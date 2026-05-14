import { Mutex } from 'async-mutex';
import { Observable, Subject } from 'rxjs';
import Complex from '../../model/complex';
import { ConstantQData } from '../../model/constantqdata';
import {
  DEFAULT_BINS,
  DEFAULT_FPS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_THRESH,
} from '../../model/defaults';
import { Pitch } from '../../model/pitch';
import ConstantQ from './ConstantQ';

interface ProcessorModule {
  evaluate(
    _0: number,
    _1: number,
    _2: number,
    _3: number,
    _4: number,
    _5: number,
    _6: number,
    _7: VectorDouble,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _8: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _9: any,
  ): number;
  terminate_worker(_0: number): void;

  addFunction(funct: {}, id: string): {};
  removeFunction(ptr: {}): void;

  VectorDouble: new () => VectorDouble;
}

export interface VectorDouble extends Iterable<number> {
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  size(): number;
  get(_0: number): number | undefined;
  set(_0: number, _1: number): boolean;
}

declare function createProcessorModule(): Promise<ProcessorModule>;

/**
 * the return message type along with data
 */
export type ConstantQMessage =
  // completion is [0,1] and displays as a percentage
  | { status: 'Loading'; message: string; completion?: number; data: ConstantQData }
  | { status: 'Complete'; data: ConstantQData }
  | { status: 'Error'; message: string };

/**
 * utilities for generating Constant Q data for an entire song
 */
export default class ConstantQDataUtil {
  private readonly moduleMutex = new Mutex();
  private module: ProcessorModule | undefined = undefined;

  private readonly processingMutex = new Mutex();
  private prevRun:
    | {
        workerId: number;
        statusUpdatePtr: {};
        dataUpdatePtr: {};
      }
    | undefined = undefined;

  async loadModule(): Promise<ProcessorModule> {
    return await this.moduleMutex.runExclusive(async () => {
      if (!this.module) {
        const newModule = await createProcessorModule();
        this.module = newModule;
        return newModule;
      } else {
        return this.module;
      }
    });
  }

  // how often user will get updates
  readonly PERCENTAGE_INCREMENTS = 5;

  /**
   * pads the processed info array so that all frames for the length of the song are covered
   * (assume last frame will be copied for the length of the song)
   *
   * @param retArr        the return array
   * @param frameRate     length in seconds of frames in the array
   * @param seconds       the total length of the song in seconds
   * @return              the padded array
   */
  private padAudioArray(retArr: number[][], frameRate: number, seconds: number) {
    if (!retArr || !retArr.length) return retArr;

    const totalExpectedFrames = Math.ceil(seconds / frameRate);
    const totalFrames = retArr.length;
    const lastFrame = retArr[retArr.length - 1];
    const paddedArr = [];
    const paddedArrayNum = totalExpectedFrames - totalFrames;
    for (let i = 0; i < paddedArrayNum; i++) paddedArr.push(lastFrame);

    return [...retArr, ...paddedArr];
  }
  /**
   * creates constant q data by sending and receiving data from
   * wasm worker
   *
   * @param buffer    the buffer to analyze
   * @param minFreq   the minimum frequency to utilize in constant q
   * @param maxFreq   the maximum frequency to utilize in constant q
   * @param bins      the number of bins
   * @param thresh    the threshold for constant q
   * @param sampleInterval        the number of analysis per second (default is 16)
   * @returns         the generated ConstantQData subject which yields
   *                  results like:
   *                  {
   *                      status: 'Error'|'Loading'|'Complete'
   *                      message: string
   *                      [completion?]: percentage complete
   *                      [data?]: on complete, returns ConstantQData
   *                  }
   */
  async messageProcessing(
    buffer: AudioBuffer,
    minPitch: Pitch = DEFAULT_MIN_FREQ,
    maxPitch: Pitch = DEFAULT_MAX_FREQ,
    bins: number = DEFAULT_BINS,
    thresh: number = DEFAULT_THRESH,
    fps: number = DEFAULT_FPS,
  ): Promise<Observable<ConstantQMessage>> {
    const subject = new Subject<ConstantQMessage>();

    try {
      const mod = await this.loadModule();

      const amplitudeBuffer = new mod.VectorDouble();
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const floatData = buffer.getChannelData(c);
        for (let i = 0; i < buffer.length; i++) {
          if (c == 0) {
            amplitudeBuffer.push_back(floatData[i]);
          } else {
            amplitudeBuffer.set(i, (amplitudeBuffer.get(i) ?? 0) + floatData[i]);
          }
        }
      }

      const retArr: number[][] = [];
      let count = 0;
      let totCount = 0;
      let graphMax = 0;

      const dataUpdate = (i: number, b: number, val: number) => {
        while (retArr.length <= i) {
          retArr[i] = [];
        }

        while (retArr[i].length < b) {
          retArr[i].push(0);
        }

        retArr[i][b] = val;
        graphMax = Math.max(graphMax, val);
      };

      const statusUpdate = (status: number, num: number) => {
        switch (status) {
          case 0:
            subject.next({
              status: 'Loading',
              message: 'Calculating Sparse Kernel',
              data: {
                constantQData: retArr,
                graphMax,
              },
            });
            break;
          case 1:
            totCount = num;
            subject.next({
              status: 'Loading',
              message: 'Parsing Constant Q Data',
              completion: 0,
              data: {
                constantQData: retArr,
                graphMax,
              },
            });
            break;
          case 2:
            count += num;
            if (count >= totCount) {
              this.cleanupPrevRun(mod, false)
                .then(() => {
                  const paddedArr = this.padAudioArray(retArr, 1 / fps, buffer.duration);

                  const constantqdata: ConstantQData = {
                    constantQData: paddedArr,
                    graphMax,
                  };
                  this.processingMutex.runExclusive(() => {
                    this.prevRun = undefined;
                    subject.next({ status: 'Complete', data: constantqdata });
                  });
                })
                .catch(e => console.log('There was an error on completion', e));
            } else {
              subject.next({
                status: 'Loading',
                message: 'Parsing Constant Q Data',
                completion: count / totCount,
                data: {
                  constantQData: retArr,
                  graphMax,
                },
              });
            }

            break;
        }
      };

      this.processingMutex
        .runExclusive(async () => {
          await this.cleanupPrevRun(mod, true);

          const statUpdateFunc = mod.addFunction(statusUpdate, 'vii');
          const dataUpdateFunc = mod.addFunction(dataUpdate, 'viid');

          const workerId = mod.evaluate(
            buffer.sampleRate,
            minPitch.frequency,
            maxPitch.frequency,
            bins,
            thresh,
            buffer.sampleRate / fps,
            20,
            amplitudeBuffer,
            statUpdateFunc.toString(),
            dataUpdateFunc.toString(),
          );

          this.prevRun = {
            workerId,
            statusUpdatePtr: statUpdateFunc,
            dataUpdatePtr: dataUpdateFunc,
          };
        })
        .catch(e => {
          console.log('An error occurred', e);
          subject.next({ status: 'Error', message: e?.toString() ?? '' });
        });
    } catch (e) {
      console.log('An error occurred', e);
      subject.next({ status: 'Error', message: e?.toString() ?? '' });
    }

    return subject;
  }

  private async cleanupPrevRun(mod: ProcessorModule, terminateWorker: boolean) {
    const prevRun = this.prevRun;
    if (prevRun !== undefined) {
      mod.removeFunction(prevRun.statusUpdatePtr);
      mod.removeFunction(prevRun.dataUpdatePtr);
      if (terminateWorker) {
        await mod.terminate_worker(prevRun.workerId);
      }
    }
    this.prevRun = undefined;
  }

  /**
   * process an audio buffer and generate a ConstantQData object
   * representing all the audio data for song
   * @param buffer    the buffer to analyze
   * @param minFreq   the minimum frequency to utilize in constant q
   * @param maxFreq   the maximum frequency to utilize in constant q
   * @param bins      the number of bins
   * @param thresh    the threshold for constant q
   * @param sampleInterval        the number of frames between analysis
   *                              (if undefined use sparse kernel length)
   * @returns         the generated ConstantQData
   */
  static process(
    buffer: AudioBuffer,
    minPitch: Pitch = DEFAULT_MIN_FREQ,
    maxPitch: Pitch = DEFAULT_MAX_FREQ,
    bins: number = DEFAULT_BINS,
    thresh: number = DEFAULT_THRESH,
    sampleInterval: number | undefined = undefined,
  ): ConstantQData {
    // create the sparse kernel
    const sparseKernel = ConstantQ.sparseKernel(
      buffer.sampleRate,
      minPitch.frequency,
      maxPitch.frequency,
      bins,
      thresh,
    );

    if (!sampleInterval) sampleInterval = sparseKernel.size;

    // create a buffer to hold amplitude data from the audio buffer
    const complexBuff = new Array<Complex>(sparseKernel.size);

    // get basic information about the audio like number of channels and length of audio
    const channels = buffer.numberOfChannels;
    const bufferLength = buffer.getChannelData(0).length;

    // the constant q data
    const constantQData = new Array<number[]>();

    // the current start position within
    let bufferStartPos = 0;
    let graphMax = 0;

    // iterate through audio buffer and determine constant q data
    while (bufferStartPos + sparseKernel.size <= bufferLength) {
      for (let c = 0; c < channels; c++) {
        const bufferData = buffer.getChannelData(c);

        for (let i = 0; i < complexBuff.length; i++) {
          if (c === 0) complexBuff[i] = new Complex(bufferData[bufferStartPos + i] / channels, 0);
          else
            complexBuff[i] = complexBuff[i].add(
              new Complex(bufferData[bufferStartPos + i] / channels, 0),
            );
        }
      }

      const complexArr = ConstantQ.constantQ(complexBuff, sparseKernel);
      const arr = [];
      for (const num of complexArr) {
        const absNum = num.abs();
        graphMax = Math.max(graphMax, absNum);
        arr.push(absNum);
      }
      constantQData.push(arr);

      bufferStartPos += sampleInterval;
    }

    // return the pertinent constant q data
    return {
      graphMax,
      constantQData,
    };
  }
}

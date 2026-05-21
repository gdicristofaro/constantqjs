import { Observable, Subject } from 'rxjs';
import { ConstantQData } from '../../model/constantqdata';
import {
  DEFAULT_BINS,
  DEFAULT_FPS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_THRESH,
} from '../../model/defaults';
import { Pitch } from '../../model/pitch';

export type ConstantQMessage =
  // completion is [0,1] and displays as a percentage
  | { status: 'Loading'; message: string; completion?: number; data: ConstantQData }
  | { status: 'Complete'; data: ConstantQData }
  | { status: 'Cancelled'; data: ConstantQData }
  | { status: 'Error'; message: string };

export interface ConstantQProcessing {
  data: Observable<ConstantQMessage>;
  cancel: () => void;
}

export default class ConstantQWorkerInterface {
  // how often user will get updates
  static readonly PERCENTAGE_INCREMENTS = 5;
  static readonly NUMBER_OF_MESSAGES = 100 / ConstantQWorkerInterface.PERCENTAGE_INCREMENTS;

  private static readonly WORKER_PATH = 'assets/wasm/constantq.worker.intercept.js';

  // this is wholly dependent on the size of the struct as determined below and corresponding to ConstantQWorker.cpp:onmessage.
  private static readonly PREFIX_MSG_LEN = 8;

  private writeMessageHeader(arr: Float64Array, args: ConstantQWorkerArgs) {
    arr[0] = args.fs;
    arr[1] = args.bins;
    arr[2] = args.frameInterval;
    arr[3] = args.progressMessageCount;
    arr[4] = args.audioDataLen;
    arr[5] = args.minFreq;
    arr[6] = args.maxFreq;
    arr[7] = args.thresh;
  }

  private createFloat64Arr(buffer: AudioBuffer, args: ConstantQWorkerArgs): Float64Array {
    const prefixLen = ConstantQWorkerInterface.PREFIX_MSG_LEN;

    const len = buffer.length;
    const arr = new Float64Array(prefixLen + len);
    const channelNum = buffer.numberOfChannels;

    this.writeMessageHeader(arr, args);

    for (let c = 0; c < channelNum; c++) {
      const floatData = buffer.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        arr[i + prefixLen] = floatData[i] + (c == 0 ? 0 : arr[i + prefixLen]);
      }
    }

    return arr;
  }

  private parseMessage(
    inputData: Float64Array,
    outputData: number[][],
    graphMax: number,
  ): { completion: number; graphMax: number } {
    const headerArgs: ConstantQReturnHeaderArgs = {
      totalSamples: inputData[0],
      bins: inputData[1],
      sampleStart: inputData[2],
      sampleLen: inputData[3],
    };

    const inputOffset = 4;

    const { totalSamples, bins, sampleStart, sampleLen } = headerArgs;

    if (outputData.length < sampleStart) {
      outputData.fill([], outputData.length, sampleStart);
    }

    let curGraphMax = graphMax;
    for (let i = 0; i < sampleLen; i++) {
      const subArr = inputData.subarray(inputOffset + i * bins, inputOffset + (1 + i) * bins);
      curGraphMax = subArr.reduce((prev, cur) => Math.max(prev, cur), curGraphMax);
      outputData[sampleStart + i] = Array.from(subArr);
    }

    const completion = (sampleStart + sampleLen) / totalSamples;
    return { completion, graphMax: curGraphMax };
  }

  async messageProcessing(
    buffer: AudioBuffer,
    minPitch: Pitch = DEFAULT_MIN_FREQ,
    maxPitch: Pitch = DEFAULT_MAX_FREQ,
    bins: number = DEFAULT_BINS,
    thresh: number = DEFAULT_THRESH,
    fps: number = DEFAULT_FPS,
  ): Promise<ConstantQProcessing> {
    const subject = new Subject<ConstantQMessage>();

    const workerArgs: ConstantQWorkerArgs = {
      fs: buffer.sampleRate,
      bins,
      frameInterval: buffer.sampleRate / fps,
      progressMessageCount: ConstantQWorkerInterface.NUMBER_OF_MESSAGES,
      audioDataLen: buffer.length,
      minFreq: minPitch.frequency,
      maxFreq: maxPitch.frequency,
      thresh,
    };

    const worker = new Worker(new URL(ConstantQWorkerInterface.WORKER_PATH, import.meta.url));

    worker.onmessage = () => this.onWorkerInit(worker, workerArgs, buffer, subject);

    const workerCancel = () => {
      worker.terminate();
      subject.next({
        status: 'Cancelled',
        data: {
          constantQData: [],
          graphMax: 0,
        },
      });
      subject.complete();
    };

    return {
      data: subject,
      cancel: workerCancel,
    };
  }

  private onWorkerInit(
    worker: Worker,
    workerArgs: ConstantQWorkerArgs,
    buffer: AudioBuffer,
    subject: Subject<ConstantQMessage>,
  ) {
    const inputData = this.createFloat64Arr(buffer, workerArgs);
    let graphMax = 0;

    const outputData: number[][] = [];

    worker.onmessage = (evt: MessageEvent) => {
      const { completion, graphMax: newGraphMax } = this.parseMessage(
        evt.data,
        outputData,
        graphMax,
      );
      graphMax = newGraphMax;
      const data: ConstantQData = {
        constantQData: outputData,
        graphMax,
      };

      if (completion >= 1) {
        subject.next({
          status: 'Complete',
          data,
        });
        worker.terminate();
        subject.complete();
      } else {
        subject.next({
          status: 'Loading',
          data,
          completion,
          message: 'Parsing Constant Q Data',
        });
      }
    };

    worker.onerror = evt => {
      console.log('An error occurred while processing the audio buffer', evt);
      subject.next({
        status: 'Error',
        message: 'An error occurred while processing the audio buffer: ' + evt.message,
      });
    };

    worker.postMessage(inputData, [inputData.buffer]);
  }
}

interface ConstantQWorkerArgs {
  fs: number;
  bins: number;
  frameInterval: number;
  progressMessageCount: number;
  audioDataLen: number;
  minFreq: number;
  maxFreq: number;
  thresh: number;
}

interface ConstantQReturnHeaderArgs {
  // done as doubles for consistent return data with audio data
  totalSamples: number;
  bins: number;
  sampleStart: number;
  sampleLen: number;
}

import { Observable, Subject } from 'rxjs';
import { ConstantQData } from '../model/constantqdata';
import {
  DEFAULT_BINS,
  DEFAULT_FPS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_THRESH,
} from '../model/defaults';
import { Pitch } from '../model/pitch';

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

export default class WasmWorkerInterface {
  // how often user will get updates
  static readonly PERCENTAGE_INCREMENTS = 5;
  static readonly NUMBER_OF_MESSAGES = 100 / WasmWorkerInterface.PERCENTAGE_INCREMENTS;

  private static readonly WORKER_PATH = 'assets/wasm/constantq.worker.intercept.js';

  private createFloat64Arr(buffer: AudioBuffer): Float64Array {
    const len = buffer.length;
    const arr = new Float64Array(len);
    const channelNum = buffer.numberOfChannels;

    for (let c = 0; c < channelNum; c++) {
      const floatData = buffer.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        arr[i] = floatData[i] + (c == 0 ? 0 : arr[i]);
      }
    }

    return arr;
  }

  private parseMessage(
    data: { metadata: ConstantQReturnHeaderArgs; constantQData: Float64Array },
    outputData: number[][],
    graphMax: number,
  ): { completion: number; graphMax: number } {
    const {
      metadata: { totalSamples, bins, sampleStart },
      constantQData,
    } = data;

    const sampleLen = Math.floor(constantQData.length / bins);

    if (outputData.length < sampleStart) {
      outputData.fill([], outputData.length, sampleStart);
    }

    let curGraphMax = graphMax;
    for (let i = 0; i < sampleLen; i++) {
      const subArr = constantQData.subarray(i * bins, (1 + i) * bins);
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
      progressMessageCount: WasmWorkerInterface.NUMBER_OF_MESSAGES,
      minFreq: minPitch.frequency,
      maxFreq: maxPitch.frequency,
      thresh,
    };

    const workerUrl = new URL(WasmWorkerInterface.WORKER_PATH, document.baseURI);
    const worker = new Worker(workerUrl);

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
    const audioData = this.createFloat64Arr(buffer);
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

    worker.postMessage({ audioData, workerArgs }, [audioData.buffer]);
  }
}

interface ConstantQWorkerArgs {
  fs: number;
  bins: number;
  frameInterval: number;
  progressMessageCount: number;
  minFreq: number;
  maxFreq: number;
  thresh: number;
}

interface ConstantQReturnHeaderArgs {
  // done as doubles for consistent return data with audio data
  totalSamples: number;
  bins: number;
  sampleStart: number;
}

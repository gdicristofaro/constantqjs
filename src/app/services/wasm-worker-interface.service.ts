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

/**
 * Types and status updates from Constant-Q WebAssembly worker
 * @typedef {Object} ConstantQMessage
 * @property {{status: 'Loading'; message: string; completion?: number; data: ConstantQData}} - Processing in progress with completion percentage
 * @property {{status: 'Complete'; data: ConstantQData}} - Analysis completed successfully
 * @property {{status: 'Cancelled'; data: ConstantQData}} - Analysis was cancelled by user
 * @property {{status: 'Error'; message: string}} - An error occurred during processing
 */
export type ConstantQMessage =
  // completion is [0,1] and displays as a percentage
  | { status: 'Loading'; message: string; completion?: number; data: ConstantQData }
  | { status: 'Complete'; data: ConstantQData }
  | { status: 'Cancelled'; data: ConstantQData }
  | { status: 'Error'; message: string };

/**
 * Result of Constant-Q message processing containing data stream and cancellation function
 * @interface ConstantQProcessing
 * @property {Observable<ConstantQMessage>} data - Observable stream of analysis updates and results
 * @property {Function} cancel - Function to cancel ongoing analysis
 */
export interface ConstantQProcessing {
  data: Observable<ConstantQMessage>;
  cancel: () => void;
}

/**
 * Interface to WebAssembly Constant-Q worker for audio spectral analysis
 * Manages worker lifecycle, message passing, and result collection
 * Emits progress updates and handles cancellation
 */
export default class WasmWorkerInterface {
  // how often user will get updates
  static readonly PERCENTAGE_INCREMENTS = 5;
  static readonly NUMBER_OF_MESSAGES = 100 / WasmWorkerInterface.PERCENTAGE_INCREMENTS;

  private static readonly WORKER_PATH = 'assets/wasm/constantq.worker.intercept.js';

  /**
   * Converts multi-channel audio buffer to single-channel float array
   * Mixes all channels by summing amplitudes
   * @param {AudioBuffer} buffer - The multi-channel audio buffer
   * @returns {Float64Array} Single-channel audio data
   * @private
   */
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

  /**
   * Processes analysis data from worker and updates output array
   * Extracts frequency bins and tracks maximum amplitude for visualization scaling
   * @param {Object} data - Message data from worker containing analysis results
   * @param {number[][]} outputData - Array to accumulate results
   * @param {number} graphMax - Current maximum amplitude value
   * @returns {{completion: number; graphMax: number}} Completion percentage and updated max
   * @private
   */
  private parseMessage(
    data: { metadata: ConstantQReturnHeaderArgs; constantQData: Float64Array },
    outputData: number[][],
    graphMax: number,
  ): { completion: number; graphMax: number; frameStart: number; frameCount: number } {
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
    return { completion, graphMax: curGraphMax, frameStart: sampleStart, frameCount: sampleLen };
  }

  /**
   * Initiates Constant-Q analysis in a WebAssembly worker
   * Creates worker, sets up message handling, and returns cancellable observable
   * @param {AudioBuffer} buffer - The audio buffer to analyze
   * @param {Pitch} [minPitch] - Minimum analysis frequency (defaults to C2)
   * @param {Pitch} [maxPitch] - Maximum analysis frequency (defaults to C6)
   * @param {number} [bins] - Bins per octave for frequency resolution (default 24)
   * @param {number} [thresh] - Amplitude threshold for sparse kernel (default 0.0054)
   * @param {number} [fps] - Frames per second for analysis (default 16)
   * @returns {Promise<ConstantQProcessing>} Observable of results and cancel function
   */
  async messageProcessing(
    buffer: AudioBuffer,
    minPitch: Pitch = DEFAULT_MIN_FREQ,
    maxPitch: Pitch = DEFAULT_MAX_FREQ,
    bins: number = DEFAULT_BINS,
    thresh: number = DEFAULT_THRESH,
    fps: number = DEFAULT_FPS,
    numNotes = 0,
    absoluteKeyboardThreshold = 0,
    relativeKeyboardThreshold = 0,
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

    worker.onmessage = () =>
      this.onWorkerInit(
        worker,
        workerArgs,
        buffer,
        subject,
        numNotes,
        absoluteKeyboardThreshold,
        relativeKeyboardThreshold,
      );

    const workerCancel = () => {
      worker.terminate();
      subject.next({
        status: 'Cancelled',
        data: {
          constantQData: [],
          graphMax: 0,
          keyboardIntensity: [],
        },
      });
      subject.complete();
    };

    return {
      data: subject,
      cancel: workerCancel,
    };
  }

  /**
   * Sets up worker message handlers and initiates analysis after initialization
   * Accumulates results and emits progress updates
   * @param {Worker} worker - The WebAssembly worker instance
   * @param {ConstantQWorkerArgs} workerArgs - Analysis parameters
   * @param {AudioBuffer} buffer - Audio data to analyze
   * @param {Subject<ConstantQMessage>} subject - Subject to emit results to
   * @private
   */
  private onWorkerInit(
    worker: Worker,
    workerArgs: ConstantQWorkerArgs,
    buffer: AudioBuffer,
    subject: Subject<ConstantQMessage>,
    numNotes: number,
    absoluteKeyboardThreshold: number,
    relativeKeyboardThreshold: number,
  ) {
    const audioData = this.createFloat64Arr(buffer);
    let graphMax = 0;

    const outputData: number[][] = [];
    const keyboardIntensity: number[][] = [];

    worker.onmessage = (evt: MessageEvent) => {
      const { completion, graphMax: newGraphMax, frameStart, frameCount } = this.parseMessage(
        evt.data,
        outputData,
        graphMax,
      );
      graphMax = newGraphMax;

      // Precompute per-note keyboard intensities for this batch of frames
      const absThresh = absoluteKeyboardThreshold * graphMax;
      for (let f = frameStart; f < frameStart + frameCount; f++) {
        const frame = outputData[f];
        if (!frame?.length) {
          keyboardIntensity[f] = [];
          continue;
        }
        let relMax = 0;
        for (let i = 0; i < numNotes; i++) relMax = Math.max(relMax, frame[2 * i] ?? 0);
        const relThresh = relativeKeyboardThreshold * relMax;
        keyboardIntensity[f] = Array.from({ length: numNotes }, (_, i) => {
          const v = frame[2 * i] ?? 0;
          return relMax > 0 && v >= absThresh && v >= relThresh ? v / relMax : 0;
        });
      }

      const data: ConstantQData = {
        constantQData: outputData,
        graphMax,
        keyboardIntensity,
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

/**
 * Parameters passed to WebAssembly worker for Constant-Q analysis
 * @interface ConstantQWorkerArgs
 * @property {number} fs - Sample rate (e.g., 44100 Hz)
 * @property {number} bins - Frequency bins per octave
 * @property {number} frameInterval - Samples between consecutive analyses
 * @property {number} progressMessageCount - Number of progress updates to emit
 * @property {number} minFreq - Minimum frequency in Hz
 * @property {number} maxFreq - Maximum frequency in Hz
 * @property {number} thresh - Amplitude threshold
 */
interface ConstantQWorkerArgs {
  fs: number;
  bins: number;
  frameInterval: number;
  progressMessageCount: number;
  minFreq: number;
  maxFreq: number;
  thresh: number;
}

/**
 * Metadata returned with analysis results from worker
 * @interface ConstantQReturnHeaderArgs
 * @property {number} totalSamples - Total number of analyses performed
 * @property {number} bins - Number of frequency bins per analysis
 * @property {number} sampleStart - Starting index of this batch in output
 */
interface ConstantQReturnHeaderArgs {
  // done as doubles for consistent return data with audio data
  totalSamples: number;
  bins: number;
  sampleStart: number;
}

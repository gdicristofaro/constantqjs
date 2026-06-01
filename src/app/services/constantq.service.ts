import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConstantQData } from '../model/constantqdata';
import { DEFAULT_BINS, DEFAULT_THRESH } from '../model/defaults';
import { Settings } from '../model/settings';
import { AudioLoadService } from './audio-load.service';
import WasmWorkerInterface, { ConstantQMessage } from './wasm-worker-interface.service';

/**
 * Service for Constant-Q transform audio analysis using WebAssembly
 * Manages spectral analysis requests and emits analysis progress/completion updates
 * Coordinates between AudioLoadService and WasmWorkerInterface
 */
@Injectable({
  providedIn: 'root',
})
export class ConstantqService {
  private readonly audioSvc = inject(AudioLoadService);
  private readonly constantQUtil = new WasmWorkerInterface();
  readonly constantQData = signal<ConstantQData | undefined>(undefined);

  readonly loadingPercentage = signal(0);
  readonly errorMessage = signal<string | null>(null);

  private audioLoadSub: Subscription | undefined = undefined;
  private cancelFunct: undefined | (() => void) = undefined;

  constructor() {
    effect(() => {
      const audioFileData = this.audioSvc.audioFileData();
      if (!audioFileData) return;

      untracked(() => {
        this.onLoad(audioFileData.audio, audioFileData.settings);
      });
    });
  }

  /**
   * Handles messages from Constant-Q worker including progress and completion
   * Updates loading percentage and data signals based on message status
   * @param {ConstantQMessage} data - Message from WebAssembly worker
   * @private
   */
  private onConstantQMsg(data: ConstantQMessage) {
    if (data.status === 'Error') {
      this.setError(data.message);
    } else if (data.status === 'Cancelled') {
      this.constantQData.set(data.data);
    } else {
      const percComplete = data.status === 'Complete' ? 1 : (data.completion ?? 0);
      console.log('Loading: ' + Math.round(percComplete * 100) + '%');
      this.loadingPercentage.set(percComplete);
      this.constantQData.set(data.data);
    }
  }

  /**
   * Initiates Constant-Q analysis on new audio buffer with specified settings
   * Cancels any previous analysis and sets up new worker with progress tracking
   * @param {AudioBuffer} audioBuffer - The audio data to analyze
   * @param {Pitch} minPitch - Minimum frequency for analysis
   * @param {Pitch} maxPitch - Maximum frequency for analysis
   * @private
   */
  private async onLoad(audioBuffer: AudioBuffer, settings: Settings) {
    this.cancelFunct?.();
    this.audioLoadSub?.unsubscribe();
    this.loadingPercentage.set(0);
    this.constantQData.set(undefined);

    const { cancel, data } = await this.constantQUtil.messageProcessing(
      audioBuffer,
      settings.minPitch,
      settings.maxPitch,
      DEFAULT_BINS,
      DEFAULT_THRESH,
      settings.fps,
    );

    this.cancelFunct = cancel;
    this.audioLoadSub = data.subscribe({
      next: message => this.onConstantQMsg(message),
      error: err => this.setError(err),
    });
  }

  /**
   * Records error message for display to user
   * @param {string} err - Error message or error object
   * @private
   */
  private setError(err: string) {
    console.error(err);
    this.errorMessage.set('An error occurred while processing the audio file.');
  }
}

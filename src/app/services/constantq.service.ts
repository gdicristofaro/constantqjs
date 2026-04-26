import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConstantQData } from '../model/constantqdata';
import { DEFAULT_BINS, DEFAULT_THRESH } from '../model/defaults';
import { Settings } from '../model/settings';
import { AudioLoadService } from './audio-load.service';
import ConstantQDataUtil, { ConstantQMessage } from './constantq/ConstantQDataUtil';

@Injectable({
  providedIn: 'root',
})
export class ConstantqService {
  private readonly audioSvc = inject(AudioLoadService);
  readonly constantQData = signal<ConstantQData | undefined>(undefined);

  readonly loadingPercentage = signal(0);
  readonly errorMessage = signal<string | null>(null);

  private audioLoadSub: Subscription | undefined = undefined;

  // TODO: load all of this
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
   * When a constant q message is received, this function is called.
   * @param data the constant q data message received
   * @param buff the pertinent audio buffer
   * @param title the title of the audio file
   */
  private onConstantQMsg(data: ConstantQMessage) {
    if (data.status === 'Error') {
      this.setError(data.message);
    } else {
      this.loadingPercentage.set(data.status === 'Complete' ? 1 : (data.completion ?? 0));
      this.constantQData.set(data.data);
    }
  }

  private onLoad(audioBuffer: AudioBuffer, settings: Settings) {
    this.loadingPercentage.set(0);
    this.audioLoadSub?.unsubscribe();
    this.audioLoadSub = ConstantQDataUtil.messageProcessing(
      audioBuffer,
      settings.minPitch,
      settings.maxPitch,
      DEFAULT_BINS,
      DEFAULT_THRESH,
      settings.fps,
    ).subscribe({
      next: message => this.onConstantQMsg(message),
      error: err => this.setError(err),
    });
  }

  private setError(err: any) {
    console.error(err);
    this.errorMessage.set('An error occurred while processing the audio file.');
  }
}

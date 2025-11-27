import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioPlaybackService {
  private readonly hasSource = signal(false);

  private readonly _duration = signal(0);
  readonly duration = this._duration.asReadonly();

  private readonly _isPlaying = signal(false);
  readonly isPlaying = this._isPlaying.asReadonly();

  private readonly _curPosition = signal(0);
  readonly curPosition = this._curPosition.asReadonly();

  constructor() {}

  togglePlay() {
    if (this.hasSource()) {
      if (this.isPlaying()) {
        this.pause();
      } else this.play();
    }
  }

  setCurPosition(secs: number) {
    throw new Error('Method not implemented.');
  }
}

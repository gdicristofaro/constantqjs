import { computed, Injectable, signal } from '@angular/core';
import { FFT_MS_REFRESH } from '../model/defaults';

/**
 * A class that defines playback and playback controls for an audio file
 */
@Injectable({
  providedIn: 'root',
})
export class AudioPlaybackService {
  private readonly source = signal<AudioBuffer | undefined>(undefined);

  // whether or not an actual audio buffer has been set for playback
  readonly hasSource = computed(() => this.source() !== undefined);

  // the duration of the audio buffer or undefined
  readonly duration = computed(() => this.source()?.duration);

  private readonly _isPlaying = signal(false);
  readonly isPlaying = this._isPlaying.asReadonly();

  private readonly _curPosition = signal(0);
  readonly curPosition = this._curPosition.asReadonly();

  // creates the next frame of the fft based on the playback
  public readonly fftListener = signal<Uint8Array<ArrayBuffer> | undefined>(undefined);

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext = new AudioContext();

  // the analyzer node to provide fft data
  private _analyzer: AnalyserNode | undefined = undefined;

  // the interval id for the interval that will periodically update fft data, is  playing, position
  private _interval: number | undefined = undefined;

  // the start position relative to the audio context time
  private contextStart: number = 0;

  // the start position relative to the audio file
  private audioStart: number = 0;

  // the actual plaback node (only operational during playback not on pause)
  private playbackNode: AudioBufferSourceNode | undefined = undefined;

  private msRefresh: number = FFT_MS_REFRESH;

  togglePlay() {
    if (this.hasSource()) {
      if (this.isPlaying()) {
        this.pause();
      } else {
        this.play();
      }
    }
  }

  setCurPosition(secs: number) {
    this._curPosition.set(secs);
  }

  initializeAudio(
    source: AudioBuffer,
    // ms for refresh of playback position and fft
    msRefresh: number = FFT_MS_REFRESH,
    fftSize?: number,
  ) {
    if (fftSize) {
      this.msRefresh = msRefresh;
      this._analyzer = this._audioContext.createAnalyser();
      // so we get the right size for the bin count
      this._analyzer.fftSize = fftSize * 2;

      const bufferLength = this._analyzer.frequencyBinCount;
      this.fftListener.set(new Uint8Array(bufferLength));

      this._analyzer.connect(this._audioContext.destination);
    } else {
      this.fftListener.set(undefined);
    }

    this.source.set(source);
  }

  /**
   * the function that updates listeners during the playback process
   */
  private onUpdate() {
    // update position
    this._curPosition.set(this._audioContext.currentTime - this.contextStart + this.audioStart);

    // if there is an fft listener, update accordingly
    this.fftListener.update(arr => {
      if (arr) {
        this._analyzer?.getByteFrequencyData(arr);
      }
      return arr;
    });
  }

  /**
   * handles playing audio
   * @param pos   the position of playback; if none set, current position is used
   */
  play(pos: number = 0) {
    // can't play with no source
    if (!this.source()) {
      return false;
    }

    // if playing, pause to properly restart
    if (this.isPlaying()) {
      this.pause();
    }

    // establish starting position
    let startPos = pos ? pos : this.curPosition();
    if (startPos >= (this.duration() ?? 0)) {
      startPos = 0;
    }

    // set up playback node
    this.playbackNode = this._audioContext.createBufferSource();
    this.playbackNode.buffer = this.source() ?? null;
    if (this._analyzer) {
      this.playbackNode.connect(this._analyzer);
    }

    // establish context items for listeners
    this.contextStart = this._audioContext.currentTime;
    this.audioStart = startPos;
    this._isPlaying.set(true);
    this.playbackNode.start(0, startPos);

    this.playbackNode.onended = () => {
      this.pause();
    };

    this._interval = window.setInterval(() => this.onUpdate(), this.msRefresh);

    return true;
  }

  /**
   * pauses audio playback at current location
   */
  pause() {
    // can't pause with no source
    if (!this.source()) {
      return false;
    }

    // clear out interval for updates
    if (this._interval) {
      window.clearInterval(this._interval);
    }

    // if playing, trigger one last update and stop
    if (this.isPlaying()) {
      this._isPlaying.set(false);

      if (this.source()) {
        this.onUpdate();
        this.playbackNode?.disconnect();
        this.playbackNode?.stop(0);
      }
    }

    this.playbackNode = undefined;
    return true;
  }

  /**
   * seeks to the given position
   * @param pos   the new position for playback
   */
  seek(pos: number) {
    // bound appropriately to length of song
    const boundedPos = Math.min(Math.max(0, pos), this.duration() ?? 0);

    if (this.isPlaying()) {
      this.play(boundedPos);
    } else {
      this._curPosition.set(boundedPos);
    }
  }
}

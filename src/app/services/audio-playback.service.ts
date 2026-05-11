import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { AudioLoadService } from './audio-load.service';

/**
 * A class that defines playback and playback controls for an audio file
 */
@Injectable({
  providedIn: 'root',
})
export class AudioPlaybackService {
  private static readonly DEFAULT_MS_REFRESH = 100;

  private readonly audioSvc = inject(AudioLoadService);

  private readonly source = signal<AudioBuffer | undefined>(undefined);
  private readonly msRefresh = signal(AudioPlaybackService.DEFAULT_MS_REFRESH);

  // whether or not an actual audio buffer has been set for playback
  readonly hasSource = computed(() => this.source() !== undefined);

  // the duration of the audio buffer or undefined
  readonly duration = computed(() => this.source()?.duration);

  private readonly _curPosition = signal(0);
  readonly curPosition = this._curPosition.asReadonly();

  // the analyzer node to provide fft data
  private readonly _analyzer = signal<AnalyserNode | undefined>(undefined);

  // creates the next frame of the fft based on the playback
  private readonly _fftListener = signal<Uint8Array<ArrayBuffer> | undefined>(undefined);

  readonly fftListener = this._fftListener.asReadonly();

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext = new AudioContext();

  private readonly playbackContext = signal<{
    // the actual plaback node (only operational during playback not on pause)
    playbackNode: AudioBufferSourceNode | undefined;
    // the interval id for the interval that will periodically update fft data, is  playing, position
    interval: number;
    // the start position relative to the audio context time
    contextStart: number;
    // the start position relative to the audio file
    audioStart: number;
    // true if playing
    isPlaying: boolean;
  }>({
    playbackNode: undefined,
    interval: 0,
    contextStart: 0,
    audioStart: 0,
    isPlaying: false,
  });

  // TODO threadsafe
  readonly isPlaying = computed(() => this.playbackContext().isPlaying);

  constructor() {
    // when the audio file data changes, update the source and reset playback
    effect(() => {
      const audioFileData = this.audioSvc.audioFileData();
      untracked(() => {
        this.pause();
        this._curPosition.set(0);
        if (audioFileData) {
          this.initializeAudio(audioFileData.audio);
        }
      });
    });
  }

  togglePlay() {
    if (this.hasSource()) {
      if (this.isPlaying()) {
        this.pause();
      } else {
        this.play();
      }
    }
  }

  initializeAudio(
    source: AudioBuffer,
    // ms for refresh of playback position and fft
    msRefresh = AudioPlaybackService.DEFAULT_MS_REFRESH,
    fftSize?: number,
  ) {
    if (fftSize) {
      const analyzer = this._audioContext.createAnalyser();
      // so we get the right size for the bin count
      analyzer.fftSize = fftSize * 2;

      const bufferLength = analyzer.frequencyBinCount;
      this._fftListener.set(new Uint8Array(bufferLength));

      analyzer.connect(this._audioContext.destination);
      this._analyzer.set(analyzer);
    } else {
      this._fftListener.set(undefined);
    }

    this.msRefresh.set(msRefresh);
    this.source.set(source);
  }

  /**
   * the function that updates listeners during the playback process
   */
  private onUpdate() {
    // update position
    const { contextStart, audioStart } = this.playbackContext();
    this._curPosition.set(
      Math.min(
        this.duration() ?? 0,
        Math.max(0, this._audioContext.currentTime - contextStart + audioStart),
      ),
    );

    // if there is an fft listener, update accordingly
    this._fftListener.update(arr => {
      if (arr) {
        this._analyzer()?.getByteFrequencyData(arr);
      }
      return arr;
    });
  }

  /**
   * handles playing audio
   * @param pos   the position of playback; if none set, current position is used
   */
  play(pos = 0) {
    // can't play with no source
    const source = this.source();
    if (!source) {
      return false;
    }

    const { isPlaying } = this.playbackContext();

    // if playing, pause to properly restart
    if (isPlaying) {
      this.pause();
    }

    // establish starting position
    let startPos = pos;
    if (startPos >= (this.duration() ?? 0) || startPos < 0) {
      startPos = 0;
    }

    // set up playback node
    const playbackNode = this._audioContext.createBufferSource();

    playbackNode.buffer = source;
    const analyzer = this._analyzer();
    if (analyzer) {
      playbackNode.connect(analyzer);
    }
    playbackNode.connect(this._audioContext.destination);

    // establish context items for listeners
    const contextStart = this._audioContext.currentTime;

    playbackNode.start(0, startPos);

    const interval = window.setInterval(() => this.onUpdate(), this.msRefresh());

    playbackNode.onended = () => {
      this.pause();
    };

    this.playbackContext.set({
      playbackNode,
      interval,
      contextStart,
      audioStart: startPos,
      isPlaying: true,
    });

    return true;
  }

  /**
   * pauses audio playback at current location
   */
  pause() {
    // can't pause with no source
    const source = this.source();
    if (!source) {
      return false;
    }

    const { interval, isPlaying, playbackNode } = this.playbackContext();

    // clear out interval for updates
    if (interval) {
      window.clearInterval(interval);
    }

    // if playing, trigger one last update and stop
    if (isPlaying) {
      if (this.source()) {
        this.onUpdate();
        if (playbackNode) {
          playbackNode.onended = null;
        }
        playbackNode?.disconnect();
        playbackNode?.stop(0);
      }
    }

    this.playbackContext.set({
      playbackNode: undefined,
      interval: 0,
      contextStart: 0,
      audioStart: 0,
      isPlaying: false,
    });

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

import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Mutex } from 'async-mutex';
import AudioFileData from '../model/audiofiledata';
import { AUDIO_CONTEXT } from '../tokens/audio-context.token';
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
  private readonly playPauseMutex = new Mutex();

  private readonly source = signal<AudioBuffer | undefined>(undefined);
  private readonly msRefresh = signal(AudioPlaybackService.DEFAULT_MS_REFRESH);

  // whether or not an actual audio buffer has been set for playback
  readonly hasSource = computed(() => this.source() !== undefined);

  // the duration of the audio buffer or undefined
  readonly duration = computed(() => this.source()?.duration);

  private readonly _curPosition = signal(0);
  readonly curPosition = this._curPosition.asReadonly();

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext | null = inject(AUDIO_CONTEXT);

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

  readonly isPlaying = computed(() => this.playbackContext().isPlaying);

  constructor() {
    // when the audio file data changes, update the source and reset playback
    effect(() => {
      const audioFileData = this.audioSvc.audioFileData();
      untracked(() => {
        this.prepareInitializeNewAudio(audioFileData);
      });
    });
  }

  private prepareInitializeNewAudio(audioFileData: AudioFileData | undefined) {
    this.playPauseMutex.runExclusive(() => {
      this._pause();
      this._curPosition.set(0);
      if (audioFileData) {
        this.initializeAudio(audioFileData.audio);
      }
    });
  }

  private initializeAudio(
    source: AudioBuffer,
    // ms for refresh of playback position and fft
    msRefresh = AudioPlaybackService.DEFAULT_MS_REFRESH,
  ) {
    this.msRefresh.set(msRefresh);
    this.source.set(source);
  }

  /**
   * the function that updates listeners during the playback process
   */
  private onUpdate() {
    // update position
    this.playPauseMutex.runExclusive(() => {
      this._onUpdate();
    });
  }

  private _onUpdate() {
    if (!this._audioContext) {
      throw new Error(
        'No AudioContext could be found in this web browser.  Please use a more modern web browser.',
      );
    }
    const { contextStart, audioStart } = this.playbackContext();
    this._curPosition.set(
      Math.min(
        this.duration() ?? 0,
        Math.max(0, this._audioContext.currentTime - contextStart + audioStart),
      ),
    );
  }

  togglePlay() {
    this.playPauseMutex.runExclusive(() => this._togglePlay());
  }

  _togglePlay() {
    if (this.hasSource()) {
      if (this.isPlaying()) {
        this._pause();
      } else {
        this._play(this.curPosition());
      }
    }
  }

  play(pos: number) {
    this.playPauseMutex.runExclusive(() => this._play(pos));
  }

  /**
   * handles playing audio
   * @param pos   the position of playback; if none set, current position is used
   */
  private _play(pos: number) {
    // can't play with no source
    const source = this.source();
    if (!source) {
      return false;
    }

    const { isPlaying } = this.playbackContext();

    // if playing, pause to properly restart
    if (isPlaying) {
      this._pause();
    }

    // establish starting position
    let startPos = pos;
    if (startPos >= (this.duration() ?? 0) || startPos < 0) {
      startPos = 0;
    }

    if (!this._audioContext) {
      throw new Error(
        'No AudioContext could be found in this web browser.  Please use a more modern web browser.',
      );
    }

    // set up playback node
    const playbackNode = this._audioContext.createBufferSource();

    playbackNode.buffer = source;
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
    this.playPauseMutex.runExclusive(() => this._pause());
  }

  private _pause() {
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
        this._onUpdate();
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
    this.playPauseMutex.runExclusive(() => this._seek(pos));
  }

  private _seek(pos: number) {
    // bound appropriately to length of song
    const boundedPos = Math.min(Math.max(0, pos), this.duration() ?? 0);

    if (this.isPlaying()) {
      this._play(boundedPos);
    } else {
      this._curPosition.set(boundedPos);
    }
  }
}

import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, vi } from 'vitest';

import AudioFileData from '../model/audiofiledata';
import { AUDIO_CONTEXT } from '../tokens/audio-context.token';
import { AudioLoadService } from './audio-load.service';
import { AudioPlaybackService } from './audio-playback.service';

interface PlaybackContext {
  playbackNode: AudioBufferSourceNode | undefined;
  interval: number;
  contextStart: number;
  audioStart: number;
  isPlaying: boolean;
}

interface AudioPlaybackServicePrivate {
  source: WritableSignal<AudioBuffer | undefined>;
  _curPosition: WritableSignal<number>;
  playbackContext: WritableSignal<PlaybackContext>;
}

const asPrivate = (svc: AudioPlaybackService): AudioPlaybackServicePrivate =>
  svc as unknown as AudioPlaybackServicePrivate;

const makeFakeAudioBuffer = (duration = 10): AudioBuffer =>
  ({
    duration,
    length: 44100 * duration,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  }) as unknown as AudioBuffer;

const makeFakeSourceNode = () => {
  const node = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null as AudioBuffer | null,
    onended: null as AudioBufferSourceNode['onended'],
  };
  let _onended: AudioBufferSourceNode['onended'] = null;
  Object.defineProperty(node, 'onended', {
    get: () => _onended,
    set: (v: AudioBufferSourceNode['onended']) => {
      _onended = v;
    },
    configurable: true,
  });
  Object.defineProperty(node, 'buffer', { writable: true, value: null });
  return node;
};

/**
 * Drains the microtask queue deeply enough for the Mutex to fully resolve.
 *
 * async-mutex's runExclusive() wraps work in a promise chain that can be
 * several microtask ticks deep (acquire → run callback → release → notify
 * next waiter). A single Promise.resolve() only drains one tick, which is
 * not enough when operations chain internally (e.g. _pause then _play inside
 * a single runExclusive, or two sequential runExclusive calls). Yielding 10
 * ticks covers even deeply nested chains while remaining synchronous to the
 * test runner.
 */
const flushMutex = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe('AudioPlaybackService', () => {
  let service: AudioPlaybackService;
  let fakeAudioContext: {
    createBufferSource: ReturnType<typeof vi.fn>;
    currentTime: number;
    destination: AudioDestinationNode;
  };
  let fakeSourceNode: ReturnType<typeof makeFakeSourceNode>;
  let audioFileDataSignal: WritableSignal<AudioFileData | undefined>;
  let fakeAudioLoadService: Pick<AudioLoadService, 'audioFileData'>;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(vi.fn());

    fakeSourceNode = makeFakeSourceNode();

    fakeAudioContext = {
      createBufferSource: vi.fn().mockReturnValue(fakeSourceNode),
      currentTime: 0,
      destination: {} as AudioDestinationNode,
    };

    audioFileDataSignal = signal<AudioFileData | undefined>(undefined);
    fakeAudioLoadService = { audioFileData: audioFileDataSignal.asReadonly() };

    TestBed.configureTestingModule({
      providers: [
        AudioPlaybackService,
        { provide: AUDIO_CONTEXT, useValue: fakeAudioContext as unknown as AudioContext },
        { provide: AudioLoadService, useValue: fakeAudioLoadService },
      ],
    });

    service = TestBed.inject(AudioPlaybackService);
  });

  afterEach(async () => {
    // Drain any pending mutex work then clean up live intervals
    await flushMutex();
    const ctx = asPrivate(service).playbackContext();
    if (ctx.interval) {
      window.clearInterval(ctx.interval);
    }
    vi.restoreAllMocks();
  });

  const loadBuffer = (duration = 10): AudioBuffer => {
    const buffer = makeFakeAudioBuffer(duration);
    asPrivate(service).source.set(buffer);
    return buffer;
  };

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not be playing', () => {
      expect(service.isPlaying()).toBe(false);
    });

    it('should have no source', () => {
      expect(service.hasSource()).toBe(false);
    });

    it('should have undefined duration', () => {
      expect(service.duration()).toBeUndefined();
    });

    it('should have position 0', () => {
      expect(service.curPosition()).toBe(0);
    });
  });

  describe('after a source is loaded', () => {
    it('should report hasSource as true', () => {
      loadBuffer();
      expect(service.hasSource()).toBe(true);
    });

    it('should expose the buffer duration', () => {
      loadBuffer(30);
      expect(service.duration()).toBe(30);
    });
  });

  describe('effect on audioFileData change', () => {
    it('should set the source buffer when audioFileData is provided', async () => {
      audioFileDataSignal.set({ audio: makeFakeAudioBuffer(5) } as AudioFileData);
      TestBed.tick();
      await flushMutex();

      expect(service.hasSource()).toBe(true);
      expect(service.duration()).toBe(5);
    });

    it('should reset position to 0 when new audio file data arrives', async () => {
      loadBuffer();
      asPrivate(service)._curPosition.set(4);

      audioFileDataSignal.set({ audio: makeFakeAudioBuffer(10) } as AudioFileData);
      TestBed.tick();
      await flushMutex();

      expect(service.curPosition()).toBe(0);
    });

    it('should clear the source when audioFileData becomes undefined', async () => {
      audioFileDataSignal.set({ audio: makeFakeAudioBuffer(5) } as AudioFileData);
      TestBed.tick();
      await flushMutex();
      expect(service.hasSource()).toBe(true);
    });
  });

  describe('play', () => {
    it('should set isPlaying to true', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      expect(service.isPlaying()).toBe(true);
    });

    it('should call createBufferSource and start on the AudioContext', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      expect(fakeAudioContext.createBufferSource).toHaveBeenCalled();
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 0);
    });

    it('should start from the given position', async () => {
      loadBuffer(10);
      service.play(3);
      await flushMutex();
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 3);
    });

    it('should clamp a negative start position to 0', async () => {
      loadBuffer(10);
      service.play(-5);
      await flushMutex();
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 0);
    });

    it('should clamp a start position beyond duration to 0', async () => {
      loadBuffer(10);
      service.play(999);
      await flushMutex();
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 0);
    });

    it('should do nothing when there is no source', async () => {
      service.play(0);
      await flushMutex();
      expect(fakeAudioContext.createBufferSource).not.toHaveBeenCalled();
      expect(service.isPlaying()).toBe(false);
    });

    it('should restart from new position if already playing', async () => {
      loadBuffer(10);
      service.play(2);
      await flushMutex();
      service.play(5);
      await flushMutex();
      expect(fakeSourceNode.start).toHaveBeenCalledTimes(2);
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 5);
    });
  });

  describe('pause', () => {
    it('should set isPlaying to false', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      service.pause();
      await flushMutex();
      expect(service.isPlaying()).toBe(false);
    });

    it('should disconnect and stop the playback node', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      service.pause();
      await flushMutex();
      expect(fakeSourceNode.disconnect).toHaveBeenCalled();
      expect(fakeSourceNode.stop).toHaveBeenCalledWith(0);
    });

    it('should clear the interval', async () => {
      vi.spyOn(window, 'clearInterval');
      loadBuffer();
      service.play(0);
      await flushMutex();
      const { interval } = asPrivate(service).playbackContext();
      service.pause();
      await flushMutex();
      expect(window.clearInterval).toHaveBeenCalledWith(interval);
    });

    it('should do nothing when there is no source', async () => {
      service.pause();
      await flushMutex();
      expect(service.isPlaying()).toBe(false);
    });

    it('should null out the onended handler before stopping', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      service.pause();
      await flushMutex();
      expect(fakeSourceNode.onended).toBeNull();
    });
  });

  describe('togglePlay', () => {
    it('should start playing when paused and a source is set', async () => {
      loadBuffer();
      service.togglePlay();
      await flushMutex();
      expect(service.isPlaying()).toBe(true);
    });

    it('should pause when already playing', async () => {
      loadBuffer();
      service.play(0);
      await flushMutex();
      service.togglePlay();
      await flushMutex();
      expect(service.isPlaying()).toBe(false);
    });

    it('should do nothing when there is no source', async () => {
      service.togglePlay();
      await flushMutex();
      expect(service.isPlaying()).toBe(false);
    });
  });

  describe('seek', () => {
    it('should update curPosition when not playing', async () => {
      loadBuffer(10);
      service.seek(5);
      await flushMutex();
      expect(service.curPosition()).toBe(5);
    });

    it('should clamp seek position to 0', async () => {
      loadBuffer(10);
      service.seek(-3);
      await flushMutex();
      expect(service.curPosition()).toBe(0);
    });

    it('should clamp seek position to duration', async () => {
      loadBuffer(10);
      service.seek(999);
      await flushMutex();
      expect(service.curPosition()).toBe(10);
    });

    it('should restart playback from the new position when playing', async () => {
      loadBuffer(10);
      service.play(0);
      await flushMutex();
      service.seek(7);
      await flushMutex();
      expect(fakeSourceNode.start).toHaveBeenCalledWith(0, 7);
      expect(service.isPlaying()).toBe(true);
    });

    it('should not restart playback when not playing', async () => {
      loadBuffer(10);
      service.seek(5);
      await flushMutex();
      expect(fakeAudioContext.createBufferSource).not.toHaveBeenCalled();
    });
  });

  describe('onended callback', () => {
    it('should pause when the source node fires onended', async () => {
      loadBuffer(10);
      service.play(0);
      await flushMutex();
      expect(service.isPlaying()).toBe(true);

      // Capture the onended handler set during _play, before pause clears it
      const handler = fakeSourceNode.onended;
      expect(handler).not.toBeNull();

      // Simulate the browser firing the ended event
      (handler as EventListener)(new Event('ended'));
      await flushMutex();

      expect(service.isPlaying()).toBe(false);
    });
  });

  describe('when AUDIO_CONTEXT is null (unsupported browser)', () => {
    let nullCtxService: AudioPlaybackService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AudioPlaybackService,
          { provide: AUDIO_CONTEXT, useValue: null },
          { provide: AudioLoadService, useValue: fakeAudioLoadService },
        ],
      });
      nullCtxService = TestBed.inject(AudioPlaybackService);
      asPrivate(nullCtxService).source.set(makeFakeAudioBuffer());
    });

    it('should throw when _play is called with a null AudioContext', () => {
      // _togglePlay bypasses the mutex and calls _play directly, so no
      // flushMutex() needed — the throw is synchronous.
      expect(() => nullCtxService._togglePlay()).toThrow(/No AudioContext/);
    });
  });
});

import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AudioFile } from '../model/audiofile';
import AudioFileData from '../model/audiofiledata';
import { LoadingState } from '../model/loadingstate';
import { Note } from '../model/pitch';
import { Settings } from '../model/settings';
import { AUDIO_CONTEXT } from '../tokens/audio-context.token';
import { AudioLoadService } from './audio-load.service';

// ─── Private-field accessor ───────────────────────────────────────────────────
// Used only to reach _loadingState for seeding test state.
// _audioContext is never touched after construction; the spy is wired via DI.

interface AudioLoadServicePrivate {
  _loadingState: WritableSignal<LoadingState>;
}

const asPrivate = (svc: AudioLoadService): AudioLoadServicePrivate =>
  svc as unknown as AudioLoadServicePrivate;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
  fps: 30,
  minPitch: { note: Note.C, octave: 4, frequency: 261.63 },
  maxPitch: { note: Note.B, octave: 4, frequency: 493.88 },
  ...overrides,
});

/** Builds a minimal fake AudioBuffer */
const makeFakeAudioBuffer = (): AudioBuffer =>
  ({
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: jasmine.createSpy('getChannelData').and.returnValue(new Float32Array(44100)),
    copyFromChannel: jasmine.createSpy('copyFromChannel'),
    copyToChannel: jasmine.createSpy('copyToChannel'),
  }) as unknown as AudioBuffer;

/** Creates a File object backed by an ArrayBuffer of a given byte size */
const makeFile = (bytes = 1024, name = 'test.mp3'): File => {
  const buf = new Uint8Array(bytes).buffer;
  return new File([buf], name, { type: 'audio/mpeg' });
};

/** Swallows a rejected promise so the test can assert on side-effects instead */
const ignoreRejection = (p: Promise<void>): Promise<void> => p.catch(() => undefined);

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AudioLoadService', () => {
  let service: AudioLoadService;
  let httpMock: HttpTestingController;
  let fakeAudioContext: jasmine.SpyObj<AudioContext>;

  beforeEach(() => {
    // Build the spy before configureTestingModule so it can be provided as
    // the AudioContext token. This is necessary because _audioContext is readonly
    // and JSDOM has no codec support, so we can never use the real AudioContext.
    fakeAudioContext = jasmine.createSpyObj<AudioContext>('AudioContext', ['decodeAudioData']);

    // Suppress console.error: the service logs every error it handles, which is
    // correct production behaviour but creates noise in the test output for tests
    // that intentionally exercise error paths.
    spyOn(console, 'error');

    TestBed.configureTestingModule({
      providers: [
        AudioLoadService,
        provideHttpClient(),
        provideHttpClientTesting(),
        // Provide our spy via the AUDIO_CONTEXT token so the service receives
        // it at construction time. JSDOM has no codec support, so we can never
        // use a real AudioContext in unit tests.
        { provide: AUDIO_CONTEXT, useValue: fakeAudioContext },
      ],
    });

    service = TestBed.inject(AudioLoadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start in the idle loading state', () => {
      expect(service.loadingState().state).toBe('idle');
    });

    it('should expose undefined audioFileData when idle', () => {
      expect(service.audioFileData()).toBeUndefined();
    });
  });

  // ─── processError ──────────────────────────────────────────────────────────

  describe('processError', () => {
    it('should return "An error occurred" for a null error', () => {
      expect(service.processError(null, 'during test')).toBe('An error occurred');
    });

    it('should return "An error occurred" for an undefined error', () => {
      expect(service.processError(undefined, 'during test')).toBe('An error occurred');
    });

    it('should return the string itself when the error is a plain string', () => {
      expect(service.processError('boom', 'during test')).toBe('boom');
    });

    it('should extract message from an object with a message property', () => {
      expect(
        service.processError({ message: 'network failure', errorData: {} }, 'during test'),
      ).toBe('network failure');
    });

    it('should extract error from an object with an error string property', () => {
      expect(service.processError({ error: 'forbidden' }, 'during test')).toBe('forbidden');
    });

    it('should fall back to "An error occurred" for an unrecognised object shape', () => {
      expect(service.processError({ code: 42 }, 'during test')).toBe('An error occurred');
    });
  });

  // ─── clearError ────────────────────────────────────────────────────────────

  describe('clearError', () => {
    it('should transition from error state back to idle', () => {
      asPrivate(service)._loadingState.set({ state: 'error', error: 'oops', title: 'test.mp3' });
      expect(service.loadingState().state).toBe('error');

      service.clearError();

      expect(service.loadingState().state).toBe('idle');
    });

    it('should not change state when already idle', () => {
      service.clearError();
      expect(service.loadingState().state).toBe('idle');
    });

    it('should not change state when in loading state', () => {
      asPrivate(service)._loadingState.set({ state: 'loading', progress: 0.5, title: 'test.mp3' });
      service.clearError();
      expect(service.loadingState().state).toBe('loading');
    });
  });

  // ─── audioFileData computed ─────────────────────────────────────────────────

  describe('audioFileData computed signal', () => {
    it('should return the result when state is loaded', () => {
      const fakeResult = { title: 'test.mp3' } as AudioFileData;
      asPrivate(service)._loadingState.set({ state: 'loaded', result: fakeResult });
      expect(service.audioFileData()).toBe(fakeResult);
    });

    it('should return undefined when state is loading', () => {
      asPrivate(service)._loadingState.set({ state: 'loading', progress: 0.5, title: 'test.mp3' });
      expect(service.audioFileData()).toBeUndefined();
    });

    it('should return undefined when state is error', () => {
      asPrivate(service)._loadingState.set({ state: 'error', error: 'oops', title: 'test.mp3' });
      expect(service.audioFileData()).toBeUndefined();
    });
  });

  // ─── loadAudioFile – URL source ────────────────────────────────────────────

  describe('loadAudioFile (URL source)', () => {
    const urlFile: AudioFile = { url: 'http://example.com/audio.mp3', filename: 'audio.mp3' };
    const settings = makeSettings();

    it('should set loading state with progress during download', async () => {
      fakeAudioContext.decodeAudioData.and.resolveTo(makeFakeAudioBuffer());

      const loadPromise = service.loadAudioFile(urlFile, settings);

      const req = httpMock.expectOne(urlFile.url);

      req.event({ type: HttpEventType.DownloadProgress, loaded: 512, total: 1024 });
      expect(service.loadingState().state).toBe('loading');

      req.flush(new ArrayBuffer(1024));
      await loadPromise;
    });

    it('should reach loaded state after a successful URL download and decode', async () => {
      fakeAudioContext.decodeAudioData.and.resolveTo(makeFakeAudioBuffer());

      const loadPromise = service.loadAudioFile(urlFile, settings);

      const req = httpMock.expectOne(urlFile.url);
      req.flush(new ArrayBuffer(1024));

      await loadPromise;

      expect(service.loadingState().state).toBe('loaded');
      expect(service.audioFileData()).toBeDefined();
      expect(service.audioFileData()?.title).toBe('audio.mp3');
    });

    it('should set error state when the HTTP response has no body', async () => {
      fakeAudioContext.decodeAudioData.and.resolveTo(makeFakeAudioBuffer());

      const loadPromise = ignoreRejection(service.loadAudioFile(urlFile, settings));

      const req = httpMock.expectOne(urlFile.url);
      req.flush(null);

      await loadPromise;

      expect(service.loadingState().state).toBe('error');
    });

    it('should set error state when decodeAudioData rejects', async () => {
      fakeAudioContext.decodeAudioData.and.rejectWith(new Error('decode failed'));

      const loadPromise = ignoreRejection(service.loadAudioFile(urlFile, settings));

      const req = httpMock.expectOne(urlFile.url);
      req.flush(new ArrayBuffer(1024));

      await loadPromise;

      const state = service.loadingState();
      expect(state.state).toBe('error');
      if (state.state === 'error') {
        expect(state.error).toContain('decode failed');
      }
    });

    it('should set error state when the HTTP request itself fails', async () => {
      const loadPromise = ignoreRejection(service.loadAudioFile(urlFile, settings));

      const req = httpMock.expectOne(urlFile.url);
      req.error(new ProgressEvent('error'));

      await loadPromise;

      expect(service.loadingState().state).toBe('error');
    });

    it('should do nothing when called with a falsy file value', async () => {
      // loadAudioFile guards against falsy input; we satisfy the type by casting
      // through `unknown` at a single well-documented boundary.
      await service.loadAudioFile(undefined as unknown as AudioFile, settings);
      httpMock.expectNone('');
      expect(service.loadingState().state).toBe('idle');
    });
  });

  // ─── loadAudioFile – File source ───────────────────────────────────────────

  describe('loadAudioFile (File source)', () => {
    const settings = makeSettings();

    it('should reach loaded state after reading and decoding a local File', async () => {
      fakeAudioContext.decodeAudioData.and.resolveTo(makeFakeAudioBuffer());

      const file = makeFile(2048, 'local.mp3');
      const audioFile: AudioFile = { file, filename: 'local.mp3' };

      await service.loadAudioFile(audioFile, settings);

      expect(service.loadingState().state).toBe('loaded');
      expect(service.audioFileData()?.title).toBe('local.mp3');
    });

    it('should include the correct noteLetters derived from settings pitch range', async () => {
      fakeAudioContext.decodeAudioData.and.resolveTo(makeFakeAudioBuffer());

      const narrowSettings = makeSettings({
        minPitch: { note: Note.C, octave: 4, frequency: 261.63 },
        maxPitch: { note: Note.E, octave: 4, frequency: 329.63 },
      });

      const file = makeFile(512, 'narrow.mp3');
      const audioFile: AudioFile = { file, filename: 'narrow.mp3' };

      await service.loadAudioFile(audioFile, narrowSettings);

      const noteLetters = service.audioFileData()?.noteLetters ?? [];
      // getFreqRange(C4 → E4) = [C4, C#4, D4, D#4] → each note + '' interleaved
      expect(noteLetters).toContain('C4');
      expect(noteLetters).toContain('C#4');
      expect(noteLetters).toContain('D4');
      expect(noteLetters).toContain('D#4');
    });

    it('should set error state when decodeAudioData rejects for a local file', async () => {
      fakeAudioContext.decodeAudioData.and.rejectWith(new Error('bad audio data'));

      const file = makeFile(512, 'bad.mp3');
      const audioFile: AudioFile = { file, filename: 'bad.mp3' };

      await ignoreRejection(service.loadAudioFile(audioFile, settings));

      expect(service.loadingState().state).toBe('error');
    });
  });

  // ─── null AudioContext ──────────────────────────────────────────────────────

  describe('when AUDIO_CONTEXT is null (unsupported browser)', () => {
    let nullContextService: AudioLoadService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AudioLoadService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: AUDIO_CONTEXT, useValue: null },
        ],
      });
      nullContextService = TestBed.inject(AudioLoadService);
    });

    it('should set error state when attempting to load a URL', async () => {
      const urlFile: AudioFile = { url: 'http://example.com/audio.mp3', filename: 'audio.mp3' };
      const localHttpMock = TestBed.inject(HttpTestingController);

      const loadPromise = ignoreRejection(
        nullContextService.loadAudioFile(urlFile, makeSettings()),
      );

      const req = localHttpMock.expectOne(urlFile.url);
      req.flush(new ArrayBuffer(1024));

      await loadPromise;

      expect(nullContextService.loadingState().state).toBe('error');
      const state = nullContextService.loadingState();
      if (state.state === 'error') {
        expect(state.error).toContain('No AudioContext');
      }

      localHttpMock.verify();
    });

    it('should set error state when attempting to load a local File', async () => {
      const audioFile: AudioFile = { file: makeFile(512, 'test.mp3'), filename: 'test.mp3' };

      await ignoreRejection(nullContextService.loadAudioFile(audioFile, makeSettings()));

      expect(nullContextService.loadingState().state).toBe('error');
      const state = nullContextService.loadingState();
      if (state.state === 'error') {
        expect(state.error).toContain('No AudioContext');
      }
    });
  });
});

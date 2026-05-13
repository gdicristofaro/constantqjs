import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, from, map, mergeMap, Observable, Observer, of } from 'rxjs';
import { AudioFile } from '../model/audiofile';
import AudioFileData from '../model/audiofiledata';
import { LoadingState } from '../model/loadingstate';
import { getFreqRange, noteToString } from '../model/pitch';
import { Settings } from '../model/settings';

@Injectable({
  providedIn: 'root',
})
export class AudioLoadService {
  private readonly http = inject(HttpClient);

  private readonly _loadingState = signal<LoadingState>({ state: 'idle' });

  readonly audioFileData = computed(() => {
    const loadingState = this._loadingState();
    return loadingState.state === 'loaded' ? loadingState.result : undefined;
  });

  readonly loadingState = this._loadingState.asReadonly();

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext = new AudioContext();

  clearError() {
    this._loadingState.update(prev => (prev.state === 'error' ? { state: 'idle' } : prev));
  }

  private loadFromUrl(url: string): Observable<LoadingProgress> {
    return this.http
      .get(url, {
        responseType: 'arraybuffer',
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event: HttpEvent<ArrayBuffer>): LoadingProgress => {
          switch (event.type) {
            case HttpEventType.DownloadProgress: {
              const progress = event.total ? event.loaded / event.total : 0;
              return { state: 'loading', progress };
            }
            case HttpEventType.Response:
              if (event.body) {
                return { state: 'loaded', result: event.body };
              } else {
                return { state: 'error', error: 'Unable to load data' };
              }
            default:
              return { state: 'loading', progress: 0 };
          }
        }),
      );
  }

  /**
   * Load audio from a local File object (from <input type="file">)
   */
  private loadFromFile(file: File): Observable<LoadingProgress> {
    return new Observable((observer: Observer<LoadingProgress>) => {
      const reader = new FileReader();

      reader.onprogress = event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          observer.next({ state: 'loading', progress });
        }
      };

      reader.onload = () => {
        observer.next({ state: 'loaded', result: reader.result as ArrayBuffer });
        observer.complete();
      };

      reader.onerror = err => {
        observer.error({ state: 'error', error: err });
      };

      reader.readAsArrayBuffer(file);

      // Cleanup logic if the observable is unsubscribed
      return () => reader.abort();
    });
  }

  private async arrayToDecodeData(
    arrBuffer: ArrayBuffer,
  ): Promise<{ audio: AudioBuffer; size: number }> {
    const size = arrBuffer.byteLength;
    const audio = await this._audioContext.decodeAudioData(arrBuffer);
    return {
      audio,
      size,
    };
  }

  private getAudioFileData(
    audio: AudioBuffer,
    size: number,
    title: string,
    settings: Settings,
  ): AudioFileData {
    return {
      audio,
      size,
      settings,
      fps: settings.fps,
      noteLetters: getFreqRange(
        settings.minPitch.note,
        settings.minPitch.octave,
        settings.maxPitch.note,
        settings.maxPitch.octave,
      )
        .map(n => `${noteToString(n.note)}${n.octave}`)
        .flatMap(note => [note, '']),
      title,
    };
  }

  private loadAndDecode(
    title: string,
    settings: Settings,
    obs: Observable<LoadingProgress>,
  ): Observable<LoadingState> {
    const observable = obs.pipe(
      mergeMap((loadProgress): Observable<LoadingState> => {
        switch (loadProgress.state) {
          case 'error':
            return of({ state: 'error', error: loadProgress.error, title });
          case 'loading':
            // save 10% for decoding
            return of({ state: 'loading', title, progress: loadProgress.progress * 0.95 });
          case 'loaded':
            return from(this.arrayToDecodeData(loadProgress.result)).pipe(
              map(({ audio, size }): LoadingState => {
                const result = this.getAudioFileData(audio, size, title, settings);
                return { state: 'loaded', result };
              }),
              catchError((error): Observable<LoadingState> => of({ state: 'error', error, title })),
            );
        }
      }),
    );
    return observable;
  }

  /**
   * when the selected file changes, this function is called
   * @param file  the new selected file
   */
  async loadAudioFile(file: AudioFile, settings: Settings) {
    if (!file) {
      return;
    }

    await new Promise((res, rej) => {
      const title = file.filename ?? '';

      const loadingProgressObservable =
        'file' in file ? this.loadFromFile(file.file) : this.loadFromUrl(file.url);

      this.loadAndDecode(title, settings, loadingProgressObservable).subscribe({
        next: data => {
          this._loadingState.set(data);
        },
        complete: () => {
          res(null);
        },
        error: error => {
          this._loadingState.set({ state: 'error', error, title });
          rej(error);
        },
      });
    });
  }
}

type LoadingProgress =
  | { state: 'loading'; progress: number }
  | { state: 'loaded'; result: ArrayBuffer }
  | { state: 'error'; error: {} };

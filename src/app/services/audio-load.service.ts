import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AudioFile } from '../model/audiofile';
import AudioFileData from '../model/audiofiledata';
import { getFreqRange, noteToString } from '../model/pitch';
import { Settings } from '../model/settings';

@Injectable({
  providedIn: 'root',
})
export class AudioLoadService {
  private readonly http = inject(HttpClient);

  private readonly _audioFileData = signal<AudioFileData | undefined>(undefined);
  readonly audioFileData = this._audioFileData.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _loadingTitle = signal('');
  readonly loadingTitle = this._loadingTitle.asReadonly();

  private readonly _fileLoadedPerc = signal(0);
  readonly fileLoadedPerc = this._fileLoadedPerc.asReadonly();

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext = new AudioContext();

  async getFileBufferNode(file: File): Promise<{ audio: AudioBuffer; size: number }> {
    const arrayBuffer = await this.readFile(file);
    return this.arrayToDecodeData(arrayBuffer);
  }

  // taken from https://stackoverflow.com/questions/34495796/javascript-promises-with-filereader
  private readFile(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result as ArrayBuffer);
      };
      fr.onerror = reject;
      fr.readAsArrayBuffer(blob);
    });
  }

  /**
   * obtains an observable returning an audio buffer based on the url of the audio file
   * @param http  the http client to obtain the file
   * @param url   the url of the file to obtain
   */
  async getHttpBufferNode(url: string): Promise<{ audio: AudioBuffer; size: number }> {
    const arrBuffer = await firstValueFrom(
      this.http.get(url, {
        // reportProgress: true,
        // observe: 'events',
        responseType: 'arraybuffer',
      }),
    );

    return this.arrayToDecodeData(arrBuffer);
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
    console.log('size is', size);
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

  /**
   * when the selected file changes, this function is called
   * @param file  the new selected file
   */
  async loadAudioFile(file: AudioFile, settings: Settings) {
    if (!file) {
      return;
    }

    const title = file.filename ?? '';

    this._loading.set(true);
    this._loadingTitle.set(title);
    this._audioFileData.set(undefined);

    try {
      const { audio, size } =
        'file' in file
          ? await this.getFileBufferNode(file.file)
          : await this.getHttpBufferNode(file.url);

      const audioFileData = this.getAudioFileData(audio, size, title, settings);
      this._audioFileData.set(audioFileData);
    } finally {
      this._loading.set(false);
      this._loadingTitle.set('');
    }
  }
}

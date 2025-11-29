import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioLoadService {
  private readonly http = inject(HttpClient);

  /**
   * defines the audio context to use for audio playback
   */
  private readonly _audioContext: AudioContext = new AudioContext();

  async getFileBufferNode(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await this.readFile(file);
    return this.arrayToDecodeData(arrayBuffer);
  }

  // taken from https://stackoverflow.com/questions/34495796/javascript-promises-with-filereader
  private readFile(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
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
  async getHttpBufferNode(url: string): Promise<AudioBuffer> {
    const arrBuffer = await firstValueFrom(
      this.http.get(url, {
        responseType: 'arraybuffer',
      }),
    );

    return this.arrayToDecodeData(arrBuffer);
  }

  private arrayToDecodeData(arrBuffer: ArrayBuffer) {
    return this._audioContext.decodeAudioData(arrBuffer);
  }
}

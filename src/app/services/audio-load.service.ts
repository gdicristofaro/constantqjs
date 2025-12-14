import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, from, map, mergeMap, Subscription } from 'rxjs';
import { AudioFile } from '../model/audiofile';
import { AudioVisualizationData } from '../model/audiovisualizationdata';
import ConstantQData from '../model/constantqdata';
import { DEFAULT_BINS, DEFAULT_THRESH } from '../model/defaults';
import { getFreqRange, noteToString } from '../model/pitch';
import { AudioPlaybackService } from './audio-playback.service';
import ConstantQDataUtil, { ConstantQMessage } from './constantq/ConstantQDataUtil';

@Injectable({
  providedIn: 'root',
})
export class AudioLoadService {
  private readonly http = inject(HttpClient);
  private readonly audioPlaybackSvc = inject(AudioPlaybackService);
  private readonly pitchData = signal<ConstantQData | undefined>(undefined);

  isLoading = computed(() => {
    // TODO
    return true;
  })
  loadingMessage = signal('');
  loadigPercentage = signal(0);

  private audioLoadSub: Subscription | undefined = undefined;

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

  private getAudioVisualizationData(pitchData: ConstantQData, audio: AudioBuffer): AudioVisualizationData {
    return {
      pitchData,
      audio,
      fps: number;
      title: string;
      noteLetters: string[];
      graphMax: number;
    }
  };



  /**
   * when an audio file along with pertinent pitch data is loaded, this method handles result
   * @param buff      the audio buffer
   * @param pitchData the pitch data if exists
   */
  private onFinishedLoading(buff: AudioBuffer, pitchData: ConstantQData, title: string): AudioVisualizationData {
    this.audioPlaybackSvc.initializeAudio(buff, pitchData, title);
    this.expansionPanel?.close();

    if (pitchData && pitchData.lowPitch && pitchData.highPitch) {
      const noteLetters = getFreqRange(
        pitchData.lowPitch.note,
        pitchData.lowPitch.octave,
        pitchData.highPitch.note,
        pitchData.highPitch.octave,
      )
        .map(n => `${noteToString(n.note)}${n.octave}`)
        .flatMap(note => [note, '']);

      this.noteLetters.set(noteLetters.slice(0, noteLetters.length - 2));
    }

    if (pitchData) {
      // determine max value for graph
      const maxVal = pitchData.constQData.reduce((prevVal, curArr) => {
        return curArr.reduce((prev, curVal) => {
          if (curVal > prev) return curVal;
          else return prev;
        }, prevVal);
      }, 0);

      // round graph max to nearest number
      var log10 = 0;
      var alteredMax = maxVal;
      while (alteredMax < 1) {
        log10 += 1;
        alteredMax *= 10;
      }
      this.graphMax.set(Math.ceil(alteredMax) / Math.pow(10, log10));

      this.pitchData.set(pitchData);
    }

    if (this.loadingModal) {
      this.loadingModal.close('dismiss');
    }
  }



  /**
   * when an audio file along with pertinent pitch data is loaded, this method handles result
   * @param buff      the audio buffer
   * @param pitchData the pitch data if exists
   */
  private onFinishedLoading(buff: AudioBuffer, pitchData: ConstantQData, title: string): AudioVisualizationData {
    this.audioPlaybackSvc.initializeAudio(buff, pitchData, title);
    this.expansionPanel?.close();

    if (pitchData && pitchData.lowPitch && pitchData.highPitch) {
      const noteLetters = getFreqRange(
        pitchData.lowPitch.note,
        pitchData.lowPitch.octave,
        pitchData.highPitch.note,
        pitchData.highPitch.octave,
      )
        .map(n => `${noteToString(n.note)}${n.octave}`)
        .flatMap(note => [note, '']);

      this.noteLetters.set(noteLetters.slice(0, noteLetters.length - 2));
    }

    if (pitchData) {
      // determine max value for graph
      const maxVal = pitchData.constQData.reduce((prevVal, curArr) => {
        return curArr.reduce((prev, curVal) => {
          if (curVal > prev) return curVal;
          else return prev;
        }, prevVal);
      }, 0);

      // round graph max to nearest number
      var log10 = 0;
      var alteredMax = maxVal;
      while (alteredMax < 1) {
        log10 += 1;
        alteredMax *= 10;
      }
      this.graphMax.set(Math.ceil(alteredMax) / Math.pow(10, log10));

      this.pitchData.set(pitchData);
    }

    if (this.loadingModal) {
      this.loadingModal.close('dismiss');
    }
  }

  /**
   * When a constant q message is received, this function is called.
   * @param data the constant q data message received
   * @param buff the pertinent audio buffer
   * @param title the title of the audio file
   */
  private onConstantQMsg(data: ConstantQMessage, buff: AudioBuffer, title: string) {
    if (data.status === 'Loading') {
      this.loadingMessage.set(data.message);
      this.loadingPercentage.set(data.completion ?? 0);
    } else if (data.status === 'Complete') {
      const constQData: ConstantQData = data.data;
      this.onFinishedLoading(buff, constQData);
    } else if (data.status === 'Error') {
      // on error get pitch data and apply to position listener
      // synchronous version
      const pitchData = ConstantQDataUtil.process(buff);
      this.onFinishedLoading(buff, pitchData);
    }
  }

  /**
   * when the selected file changes, this function is called
   * @param file  the new selected file
   */
  onFileChange(file?: AudioFile) {
    if (!file) {
      return;
    }

    this.audioLoadSub?.unsubscribe();

    // pause playback if exists (to avoid playback issues)
    this.audioPlaybackSvc.pause();

    this.title.set(file.filename ?? '');
    // set up loading modal and variables
    this.loadingMessage.set('Loading Audio File');
    this.loadingPercentage.set(0);
    if (this.modal && this.modalService) {
      this.loadingModal = this.modalService.open(this.modal);
    }

    const settings = this.settings();

    const audioBuffer =
      'file' in file
        ? this.audioLoadSvc.getFileBufferNode(file.file)
        : this.audioLoadSvc.getHttpBufferNode(file.url);

    this.audioLoadSub = from(audioBuffer)
      .pipe(
        mergeMap(buffer =>
          ConstantQDataUtil.messageProcessing(
            buffer,
            settings.minPitch,
            settings.maxPitch,
            DEFAULT_BINS,
            DEFAULT_THRESH,
            settings.fps,
          ).pipe(
            map(message => {
              return { buffer, message };
            }),
          ),
        ),
      )
      .subscribe({
        next: data => this.onConstantQMsg(data.message, data.buffer),
        error: err => {
          console.error(err);
          this.loadingMessage.set('');
          this.loadingPercentage.set(0);

          if (this.loadingModal) {
            this.loadingModal.close('dismiss');
          }
        },
      });
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AudioFile, FileSource, UrlSource } from './model/audiofile';
import ConstantQData from './model/constantqdata';
import { DEFAULT_FPS, DEFAULT_MAX_FREQ, DEFAULT_MIN_FREQ } from './model/defaults';
import { AudioPlaybackService } from './services/audio-playback.service';
import ConstantQDataUtil, { ConstantQMessage } from './services/constantq/ConstantQDataUtil';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  playback = inject(AudioPlaybackService);
  http = inject(HttpClient);

  modalService = inject(NgbModal);

  /**
   * the actual modal dom element
   */
  @ViewChild('modal') private modal;

  loadingModal: NgbModalRef = undefined;
  @ViewChild('expansionPanel') expansionPanel: MatExpansionPanel;

  /**
   * the pitches to be visualized by the audio visualizer
   */
  curPitches = signal<number[] | undefined>(undefined);

  // whether or not audio is loading
  loadingMessage = signal<string | undefined>(undefined);
  loadingPercentage = signal<number | undefined>(undefined);

  graphMax = signal(0);
  title = signal('');

  minPitch = signal(DEFAULT_MIN_FREQ);
  maxPitch = signal(DEFAULT_MAX_FREQ);
  fps = signal(DEFAULT_FPS);
  selectedFile = signal<AudioFile | undefined>(undefined);

  noteLetters = signal<string[]>([]);

  /**
   * whether or not to show controls
   */
  showControls = computed(() => {
    return this.playback && this.playback.hasSource();
  });

  /**
   * when an audio file along with pertinent pitch data is loaded, this method handles result
   * @param buff      the audio buffer
   * @param pitchData the pitch data if exists
   */
  private onFinishedLoading(buff: AudioBuffer, pitchData: ConstantQData) {
    this.playback = new AudioPlayback(buff, AppComponent.MS_REFRESH);
    this.expansionPanel.close();

    if (pitchData && pitchData.lowPitch && pitchData.highPitch) {
      let noteLetters = getFreqRange(
        pitchData.lowPitch.note,
        pitchData.lowPitch.octave,
        pitchData.highPitch.note,
        pitchData.highPitch.octave,
      )
        .map(n => `${noteToString(n.note)}${n.octave}`)
        .reduce((prev, cur) => [...prev, cur, ''], []);

      this.noteLetters = noteLetters.slice(0, noteLetters.length - 2);
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
      this.graphMax = Math.ceil(alteredMax) / Math.pow(10, log10);

      if (this.positionSub) this.positionSub.unsubscribe();

      this.positionSub = this.playback.positionListener.subscribe(pos => {
        this.curPitches.next(pitchData.getData(pos));
      });
    }

    if (this.loadingModal) this.loadingModal.close('dismiss');

    this.audioLoadSub.unsubscribe();
    this.audioLoadSub = undefined;
  }

  /**
   *
   * @param data the constant q data message received
   * @param buff the pertinent audio buffer
   */
  private onConstantQMsg(data: ConstantQMessage, buff: AudioBuffer) {
    if (data.status === 'Loading') {
      this.loadingMessage = data.message;
      this.loadingPercentage = data.completion;
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
  onFileChange(file: AudioFile) {
    // if an actual file, load it and set as playback
    if (file && ((<UrlSource>file).url || (<FileSource>file).file) && !this.audioLoadSub) {
      // pause playback if exists (to avoid playback issues)
      if (this.playback) this.playback.pause();

      this.title = file.filename;
      // set up loading modal and variables
      this.loadingMessage = 'Loading Audio File';
      this.loadingPercentage = undefined;
      this.loadingModal = this.modalService.open(this.modal, {
        backdrop: 'static',
        keyboard: false,
      });

      const audioBuffer = (<FileSource>file).file
        ? AudioPlayback.getFileBufferNode((<FileSource>file).file)
        : AudioPlayback.getHttpBufferNode(this.http, (<UrlSource>file).url);

      this.audioLoadSub = audioBuffer
        .pipe(
          mergeMap(buffer =>
            ConstantQDataUtil.messageProcessing(
              buffer,
              this.minPitch,
              this.maxPitch,
              ConstantQ.DEFAULT_BINS,
              ConstantQ.DEFAULT_THRESH,
              this.fps,
            ).pipe(
              map(message => {
                return { buffer, message };
              }),
            ),
          ),
        )
        .subscribe(
          data => this.onConstantQMsg(data.message, data.buffer),
          err => {
            console.error(err);
            this.loadingMessage = undefined;
            this.loadingPercentage = undefined;

            if (this.loadingModal) this.loadingModal.close('dismiss');
          },
        );
    }
  }
}

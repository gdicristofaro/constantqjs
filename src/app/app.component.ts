import { PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { from, map, mergeMap, Subscription } from 'rxjs';
import { AudioPlayerComponent } from './components/audioplayer/audioplayer.component';
import { AudioVisualizerComponent } from './components/audiovisualizer/audiovisualizer.component';
import { FileSelectorComponent } from './components/fileselector/fileselector.component';
import { RecommendedFilesComponent } from './components/recommendedfiles/recommendedfiles.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UrlSelectorComponent } from './components/urlselector/urlselector.component';
import { AudioFile } from './model/audiofile';
import ConstantQData, { getData } from './model/constantqdata';
import {
  DEFAULT_BINS,
  DEFAULT_FPS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_THRESH,
  FFT_MS_REFRESH,
} from './model/defaults';
import { getFreqRange, noteToString, Pitch } from './model/pitch';
import { AudioLoadService } from './services/audio-load.service';
import { AudioPlaybackService } from './services/audio-playback.service';
import ConstantQDataUtil, { ConstantQMessage } from './services/constantq/ConstantQDataUtil';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    MatDialogContent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    AudioPlayerComponent,
    AudioVisualizerComponent,
    FileSelectorComponent,
    RecommendedFilesComponent,
    SettingsComponent,
    UrlSelectorComponent,
    PercentPipe,
  ],
})
export class AppComponent implements OnDestroy {
  audioLoadSvc = inject(AudioLoadService);
  audioPlaybackSvc = inject(AudioPlaybackService);
  http = inject(HttpClient);

  modalService = inject(MatDialog);

  /**
   * the actual modal dom element
   */
  @ViewChild('modal') private modal: TemplateRef<any> | undefined;

  loadingModal: MatDialogRef<any> | undefined = undefined;

  @ViewChild('expansionPanel') expansionPanel: MatExpansionPanel | undefined;

  private readonly pitchData = signal<ConstantQData | undefined>(undefined);

  private audioLoadSub: Subscription | undefined = undefined;

  /**
   * the pitches to be visualized by the audio visualizer
   */
  readonly curPitches = computed(() => {
    const pitchData = this.pitchData();
    const position = this.audioPlaybackSvc.curPosition();
    return getData(pitchData, position);
  });

  // whether or not audio is loading
  loadingMessage = signal<string>('');
  loadingPercentage = signal<number>(0);

  graphMax = signal(0);
  title = signal('');

  minPitch = signal<Pitch>(DEFAULT_MIN_FREQ);
  maxPitch = signal<Pitch>(DEFAULT_MAX_FREQ);
  fps = signal(DEFAULT_FPS);
  selectedFile = signal<AudioFile | undefined>(undefined);

  noteLetters = signal<string[]>([]);

  /**
   * whether or not to show controls
   */
  showControls = computed(() => {
    return this.audioPlaybackSvc.hasSource();
  });

  ngOnDestroy(): void {
    this.audioLoadSub?.unsubscribe();
  }

  /**
   * when an audio file along with pertinent pitch data is loaded, this method handles result
   * @param buff      the audio buffer
   * @param pitchData the pitch data if exists
   */
  private onFinishedLoading(buff: AudioBuffer, pitchData: ConstantQData) {
    this.audioPlaybackSvc.initializeAudio(buff, FFT_MS_REFRESH);
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
   *
   * @param data the constant q data message received
   * @param buff the pertinent audio buffer
   */
  private onConstantQMsg(data: ConstantQMessage, buff: AudioBuffer) {
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

    const audioBuffer =
      'file' in file
        ? this.audioLoadSvc.getFileBufferNode(file.file)
        : this.audioLoadSvc.getHttpBufferNode(file.url);

    this.audioLoadSub = from(audioBuffer)
      .pipe(
        mergeMap(buffer =>
          ConstantQDataUtil.messageProcessing(
            buffer,
            this.minPitch(),
            this.maxPitch(),
            DEFAULT_BINS,
            DEFAULT_THRESH,
            this.fps(),
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

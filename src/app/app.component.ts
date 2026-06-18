import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AudioLoadingModalComponent } from './components/audio-loading-modal/audio-loading-modal.component';
import {
  AudioSelectionAndSettings,
  AudioSelectionModalComponent,
} from './components/audio-selection-modal/audio-selection-modal.component';
import { AudioPlayerComponent } from './components/audioplayer/audioplayer.component';
import { AudioVisualizerComponent } from './components/audiovisualizer/audiovisualizer.component';
import { FileInfoBarComponent } from './components/file-info-bar/file-info-bar.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { AudioLoadService } from './services/audio-load.service';
import { AudioPlaybackService } from './services/audio-playback.service';
import { ConstantqService } from './services/constantq.service';

/**
 * Root application component
 * Manages main layout and coordinates data flow between audio loading, playback, and analysis services
 */
@Component({
  selector: 'cq-app',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AudioPlayerComponent,
    AudioVisualizerComponent,
    AudioSelectionModalComponent,
    AudioLoadingModalComponent,
    FileInfoBarComponent,
    LoadingIndicatorComponent,
  ],
})
export class AppComponent implements AfterViewInit {
  protected readonly audioLoadSvc = inject(AudioLoadService);
  private readonly audioPlaybackSvc = inject(AudioPlaybackService);
  protected readonly constantQSvc = inject(ConstantqService);

  protected readonly hasAudioFileData = computed(() => Boolean(this.audioLoadSvc.audioFileData()));

  private readonly http = inject(HttpClient);
  protected readonly audioSelectionModal =
    viewChild<AudioSelectionModalComponent>('audioSelectionModal');
  clicked() {
    console.log('clicked');
  }

  ngAfterViewInit(): void {
    this.audioSelectionModal()?.open();
  }

  openAudioSelectionModal() {
    this.audioSelectionModal()?.open();
  }

  // whether or not audio is loading
  loadingMessage = signal<string>('');
  loadingPercentage = signal<number>(0);

  /**
   * whether or not to show controls
   */
  showControls = computed(() => {
    return this.audioPlaybackSvc.hasSource();
  });

  /**
   * Handles audio file upload request from modal
   * Initiates loading and analysis of selected audio file
   * @param {AudioSelectionAndSettings} selectionAndSettings - Selected file and analysis settings
   */
  handleUploadRequest(selectionAndSettings: AudioSelectionAndSettings) {
    this.audioSelectionModal()?.close();
    this.audioLoadSvc.loadAudioFile(selectionAndSettings.audioFile, selectionAndSettings.settings);
  }
}

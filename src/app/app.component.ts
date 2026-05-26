import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
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

@Component({
  selector: 'cq-app',
  templateUrl: './app.component.html',
  imports: [
    AudioPlayerComponent,
    AudioVisualizerComponent,
    AudioSelectionModalComponent,
    AudioLoadingModalComponent,
    FileInfoBarComponent,
    LoadingIndicatorComponent,
  ],
})
export class AppComponent {
  protected readonly audioLoadSvc = inject(AudioLoadService);
  private readonly audioPlaybackSvc = inject(AudioPlaybackService);
  protected readonly constantQSvc = inject(ConstantqService);

  protected readonly hasAudioFileData = computed(() => Boolean(this.audioLoadSvc.audioFileData()));

  private readonly http = inject(HttpClient);

  modalOpen = signal(true);

  clicked() {
    console.log('clicked');
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

  handleUploadRequest(selectionAndSettings: AudioSelectionAndSettings) {
    this.modalOpen.set(false);
    this.audioLoadSvc.loadAudioFile(selectionAndSettings.audioFile, selectionAndSettings.settings);
  }
}

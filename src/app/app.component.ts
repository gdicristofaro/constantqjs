import { PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild, ViewChild } from '@angular/core';
import { MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { AudioSelectionModalComponent } from './components/audio-selection-modal/audio-selection-modal.component';
import { AudioPlayerComponent } from './components/audioplayer/audioplayer.component';
import { AudioVisualizerComponent } from './components/audiovisualizer/audiovisualizer.component';
import { FileSelectorComponent } from './components/fileselector/fileselector.component';
import { RecommendedFilesComponent } from './components/recommendedfiles/recommendedfiles.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UrlSelectorComponent } from './components/urlselector/urlselector.component';
import { AudioFile } from './model/audiofile';
import { DEFAULT_FPS, DEFAULT_MAX_FREQ, DEFAULT_MIN_FREQ } from './model/defaults';
import { Settings } from './model/settings';
import { AudioLoadService } from './services/audio-load.service';
import { AudioPlaybackService } from './services/audio-playback.service';
import { ConstantqService } from './services/constantq.service';

@Component({
  selector: 'cq-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    MatDialogContent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    AudioPlayerComponent,
    FileSelectorComponent,
    RecommendedFilesComponent,
    SettingsComponent,
    UrlSelectorComponent,
    PercentPipe,
    AudioVisualizerComponent,
    AudioSelectionModalComponent,
  ],
})
export class AppComponent {
  protected readonly audioLoadSvc = inject(AudioLoadService);
  private readonly audioPlaybackSvc = inject(AudioPlaybackService);
  protected readonly constantQSvc = inject(ConstantqService);

  private readonly http = inject(HttpClient);
  private readonly modalService = inject(MatDialog);

  modalOpen = signal(true);

  /**
   * the actual modal dom element
   */
  private readonly modal = viewChild('modal');

  loadingModal: MatDialogRef<any> | undefined = undefined;

  @ViewChild('expansionPanel') expansionPanel: MatExpansionPanel | undefined;

  // whether or not audio is loading
  loadingMessage = signal<string>('');
  loadingPercentage = signal<number>(0);

  settings = signal<Settings>({
    fps: DEFAULT_FPS,
    minPitch: DEFAULT_MIN_FREQ,
    maxPitch: DEFAULT_MAX_FREQ,
  });

  /**
   * whether or not to show controls
   */
  showControls = computed(() => {
    return this.audioPlaybackSvc.hasSource();
  });

  onFileChange(audioFile: AudioFile) {
    this.audioLoadSvc.loadAudioFile(audioFile, this.settings());
  }
}

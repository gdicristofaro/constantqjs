import { PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import {
  AudioSelectionAndSettings,
  AudioSelectionModalComponent,
} from './components/audio-selection-modal/audio-selection-modal.component';
import { AudioPlayerComponent } from './components/audioplayer/audioplayer.component';
import { AudioVisualizerComponent } from './components/audiovisualizer/audiovisualizer.component';
import { AudioLoadService } from './services/audio-load.service';
import { AudioPlaybackService } from './services/audio-playback.service';
import { ConstantqService } from './services/constantq.service';

@Component({
  selector: 'cq-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    MatDialogContent,
    AudioPlayerComponent,
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

  modalOpen = signal(false);

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

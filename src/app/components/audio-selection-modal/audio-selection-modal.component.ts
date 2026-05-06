import { Component, effect, model } from '@angular/core';
import { AudioFile } from '../../model/audiofile';
import { Note } from '../../model/pitch';
import { FileSelectorComponent } from '../fileselector/fileselector.component';
import { ModalComponent } from '../modal/modal.component';
import { OrDividerComponent } from '../or-divider/or-divider.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { SettingsComponent, SettingsResult } from '../settings/settings.component';
import { UrlSelectorComponent } from '../urlselector/urlselector.component';

@Component({
  selector: 'cq-audio-selection-modal',
  imports: [
    ModalComponent,
    OrDividerComponent,
    RecommendedFilesComponent,
    UrlSelectorComponent,
    SettingsComponent,
    FileSelectorComponent,
  ],
  templateUrl: './audio-selection-modal.component.html',
  styleUrl: './audio-selection-modal.component.scss',
})
export class AudioSelectionModalComponent {
  readonly open = model(false);
  readonly selectedFile = model<AudioSelectionResult>({
    type: 'recommended',
    audioFile: null,
  });

  settings = model<SettingsResult>({
    valid: true,
    data: {
      fps: 16,
      minPitch: { note: Note.C, octave: 1, frequency: 32.7 },
      maxPitch: { note: Note.C, octave: 8, frequency: 4186 },
    },
  });

  constructor() {
    effect(() => {
      const selectedFile = this.selectedFile();
      console.log('Selected file:', selectedFile);
    });
  }
}

export interface AudioSelectionResult {
  audioFile: AudioFile | null;
  type: 'url' | 'file' | 'recommended';
}

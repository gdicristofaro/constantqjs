import { Component, model, output } from '@angular/core';
import { AudioFile } from '../../model/audiofile';
import { Note } from '../../model/pitch';
import { Settings } from '../../model/settings';
import { FileSelectorComponent } from '../fileselector/fileselector.component';
import { ModalComponent } from '../modal/modal.component';
import { OrDividerComponent } from '../or-divider/or-divider.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { SettingsComponent } from '../settings/settings.component';
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
  readonly selectedFile = output<AudioFile>();
  settings = model<Settings>({
    fps: 16,
    minPitch: { note: Note.C, octave: 1, frequency: 32.7 },
    maxPitch: { note: Note.C, octave: 8, frequency: 4186 },
  });

  onFileSelected(file: AudioFile) {
    this.selectedFile.emit(file);
  }
}

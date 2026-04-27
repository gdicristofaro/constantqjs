import { Component, input, output } from '@angular/core';
import { AudioFile } from '../../model/audiofile';
import { ModalComponent } from '../modal/modal.component';
import { OrDividerComponent } from '../or-divider/or-divider.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { UrlSelectorComponent } from '../urlselector/urlselector.component';

@Component({
  selector: 'cq-audio-selection-modal',
  imports: [ModalComponent, OrDividerComponent, RecommendedFilesComponent, UrlSelectorComponent],
  templateUrl: './audio-selection-modal.component.html',
  styleUrl: './audio-selection-modal.component.scss',
})
export class AudioSelectionModalComponent {
  readonly open = input(false);
  readonly selectedFile = output<AudioFile>();

  onFileSelected(file: AudioFile) {
    this.selectedFile.emit(file);
  }
}

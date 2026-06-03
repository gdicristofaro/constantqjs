import { Component, model, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MegabytesPipe } from '../../pipes/megabytes.pipe';
import { AudioSelectionResult } from '../audio-selection-modal/audio-selection-modal.component';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'fileselector.component.html',
  selector: 'cq-file-selector',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ReactiveFormsModule, MegabytesPipe],
})
export class FileSelectorComponent {
  // the subject where the selected file is notified

  readonly selectedFile = model.required<AudioSelectionResult>();

  isDragging = signal(false);

  /**
   * handles when a user selects file
   * @param file  the file array (should just be one item), the selected audio file
   */
  private onFilesAdded(event: Event) {
    let files;
    if (event?.target && 'files' in event.target && event.target.files instanceof FileList) {
      files = event.target.files;
    } else if ((event as DragEvent)?.dataTransfer?.files instanceof FileList) {
      files = (event as DragEvent)?.dataTransfer?.files;
    } else {
      files = undefined;
    }

    if (files && files[0]) {
      const file = files[0];
      this.selectedFile.set({
        audioFile: { file, filename: file.name, size: file.size },
        type: 'file',
      });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.onFilesAdded(event);
  }

  onFileSelected(event: Event): void {
    this.onFilesAdded(event);
  }
}

import { Component, model, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AudioSelectionResult } from '../audio-selection-modal/audio-selection-modal.component';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'fileselector.component.html',
  selector: 'cq-file-selector',
  imports: [FormsModule, ReactiveFormsModule],
})
export class FileSelectorComponent {
  // the subject where the selected file is notified

  readonly selectedFile = model.required<AudioSelectionResult>();

  readonly fileForm = new FormGroup({
    fileSelectorFileInput: new FormControl(null),
  });

  localFile = signal<File | null>(null);
  isDragging = signal(false);

  /**
   * handles when a user selects file
   * @param file  the file array (should just be one item), the selected audio file
   */
  onFilesAdded(event: Event) {
    if (event?.target && 'files' in event.target && event.target.files instanceof FileList) {
      const files: FileList = event.target.files;
      if (files && files[0]) {
        const file = files[0];
        this.selectedFile.set({
          audioFile: { file, filename: file.name, size: file.size },
          type: 'file',
        });
      }
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
    const file = event.dataTransfer?.files[0];
    if (file) this.localFile.set(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.localFile.set(file);
  }
}

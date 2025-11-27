import { Component, Input } from '@angular/core';
import AudioPlayback from '../constantq/AudioPlayback';
import { BehaviorSubject } from 'rxjs';
import AudioFile from '../constantq/AudioFile';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'fileselector.component.html',
  selector: 'file-selector',
  imports: [MatDropzone, FileInputDirective],
})
export class FileSelectorComponent {
  // the subject where the selected file is notified
  @Input()
  public selectedFile: BehaviorSubject<AudioFile>;

  /**
   * handles when a user selects file
   * @param file  the file array (should just be one item), the selected audio file
   */
  onFilesAdded(files: File[]) {
    if (files && files[0]) {
      const file = files[0];
      this.selectedFile.next({
        file,
        filename: file.name,
      });
    }
  }
}

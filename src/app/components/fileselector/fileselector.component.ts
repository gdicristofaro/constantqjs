import { Component, output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { FileInputDirective } from '@ngx-dropzone/cdk';
import { MatDropzone } from '@ngx-dropzone/material';
import { AudioFile } from '../../model/audiofile';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'fileselector.component.html',
  selector: 'cq-file-selector',
  imports: [
    MatFormField,
    MatIcon,
    MatDropzone,
    FileInputDirective,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class FileSelectorComponent {
  // the subject where the selected file is notified
  readonly selectedFile = output<AudioFile>();
  readonly fileForm = new FormGroup({
    fileSelectorFileInput: new FormControl(null),
  });

  /**
   * handles when a user selects file
   * @param file  the file array (should just be one item), the selected audio file
   */
  onFilesAdded(event: Event) {
    if (event?.target && 'files' in event.target && event.target.files instanceof FileList) {
      const files: FileList = event.target.files;
      if (files && files[0]) {
        const file = files[0];
        this.selectedFile.emit({
          file,
          filename: file.name,
        });
      }
    }
  }
}

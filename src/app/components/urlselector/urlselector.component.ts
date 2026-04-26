import { Component, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AudioFile, UrlSource } from '../../model/audiofile';

@Component({
  selector: 'cq-url-selector',
  templateUrl: './urlselector.component.html',
  imports: [MatFormField, ReactiveFormsModule, MatButtonModule, MatInputModule],
})
export class UrlSelectorComponent {
  // the subject where the selected file is notified
  readonly selectedFile = output<AudioFile>();

  readonly urlForm = new FormGroup({
    urlSelectorFileInput: new FormControl(''),
  });

  /**
   * handles when a user selects a url
   */
  load() {
    const url = this.urlForm.value.urlSelectorFileInput ?? '';
    const file: UrlSource = {
      url: url,
      filename: decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)),
    };
    console.log(file);
    this.selectedFile.emit(file);
  }
}

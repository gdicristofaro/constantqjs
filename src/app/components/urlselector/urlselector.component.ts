import { Component, output, signal } from '@angular/core';
import { AudioFile, UrlSource } from '../../model/audiofile';

@Component({
  selector: 'url-selector',
  templateUrl: './urlselector.component.html',
})
export class UrlSelectorComponent {
  readonly url = signal('');

  // the subject where the selected file is notified
  readonly selectedFile = output<AudioFile>();

  onKey(event: any) {
    // without type info
    if (event?.target && 'value' in event.target && typeof event.target.value === 'string') {
      this.url.set(event.target.value);
    }
  }

  /**
   * handles when a user selects a url
   */
  load() {
    const file: UrlSource = {
      url: this.url(),
      filename: decodeURIComponent(this.url().substring(this.url().lastIndexOf('/') + 1)),
    };
    console.log(file);
    this.selectedFile.emit(file);
  }
}

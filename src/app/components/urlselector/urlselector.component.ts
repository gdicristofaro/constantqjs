import { Component, OnInit, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import AudioFile from '../constantq/AudioFile';


@Component({
  selector: 'url-selector',
  templateUrl: './urlselector.component.html',
  styleUrls: ['./urlselector.component.scss']
})
export class UrlSelectorComponent implements OnInit {

    constructor() { }

    ngOnInit() {
    }

    url: string = '';

    onKey(event: any) { // without type info
      this.url = event.target.value;
    }

    // the subject where the selected file is notified
    @Input()
    public selectedFile: BehaviorSubject<AudioFile>;

    /**
     * handles when a user selects a url
     */
    load() {
      let file = {
        url: this.url,
        filename: decodeURIComponent(this.url.substring(this.url.lastIndexOf('/')+1))
     };
     console.log(file);
      this.selectedFile.next(file);
    }
}

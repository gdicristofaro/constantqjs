import { Component, effect, model, untracked, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs/internal/operators/map';
import { AudioSelectionResult } from '../audio-selection-modal/audio-selection-modal.component';

@Component({
  selector: 'cq-url-selector',
  templateUrl: './urlselector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule],
})
export class UrlSelectorComponent {
  readonly selectedFile = model.required<AudioSelectionResult>();

  readonly urlForm = new FormGroup({
    urlSelectorFileInput: new FormControl('', Validators.pattern(URL_REGEX)),
  });

  private readonly _urlFormValue = toSignal(this.urlForm.valueChanges, {
    initialValue: this.urlForm.value,
  });

  private readonly _urlFormValid = toSignal(
    this.urlForm.statusChanges.pipe(map(status => status === 'VALID')),
    {
      initialValue: false,
    },
  );

  constructor() {
    effect(() => {
      const urlFormValid = this._urlFormValid();
      const urlFormValue = this._urlFormValue()?.urlSelectorFileInput;
      untracked(() => {
        if (urlFormValid && urlFormValue?.trim()?.length) {
          this.selectedFile.set({
            audioFile: {
              url: urlFormValue,
              filename: decodeURIComponent(
                urlFormValue.substring(urlFormValue.lastIndexOf('/') + 1),
              ),
            },
            type: 'url',
          });
        } else {
          this.selectedFile.set({ audioFile: null, type: 'url' });
        }
      });
    });
  }

  /**
   * handles when a user selects a url
   */
  // load() {
  //   const url = this.urlForm.value.urlSelectorFileInput ?? '';
  //   const file: UrlSource = {
  //     url: url,
  //     filename: decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)),
  //   };
  //   console.log(file);
  //   this.selectedFile.emit(file);
  // }
}

const URL_REGEX = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6}).*';

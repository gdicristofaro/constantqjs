import { Component, computed, effect, model, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AudioSelectionResult } from '../audio-selection-modal/audio-selection-modal.component';

@Component({
  selector: 'cq-url-selector',
  templateUrl: './urlselector.component.html',
  imports: [ReactiveFormsModule],
})
export class UrlSelectorComponent {
  readonly selectedFile = model.required<AudioSelectionResult>();

  protected readonly disabled = computed(() =>
    this.selectedFile().audioFile && this.selectedFile().type !== 'recommended' ? true : false,
  );
  readonly urlForm = new FormGroup({
    urlSelectorFileInput: new FormControl(''),
  });

  private readonly _urlFormValue = toSignal(this.urlForm.valueChanges, {
    initialValue: this.urlForm.value,
  });

  constructor() {
    effect(() => {
      const urlFormValue = this._urlFormValue()?.urlSelectorFileInput;
      untracked(() => {
        if (urlFormValue?.trim()?.length) {
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

    effect(() => {
      const disabledForm = this.disabled();
      untracked(() => {
        if (disabledForm) {
          this.urlForm.disable();
        } else {
          this.urlForm.enable();
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

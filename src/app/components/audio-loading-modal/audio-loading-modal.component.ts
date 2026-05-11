import { Component, inject } from '@angular/core';
import { AudioLoadService } from '../../services/audio-load.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'cq-audio-loading-modal',
  imports: [ModalComponent],
  template: `
    <cq-modal [open]="open()" [closeable]="false">
      <span title>Loading...</span>
      <span description>{{ subtitle() }}</span>

      <div body class="flex flex-col items-center w-full gap-5 px-10 py-8">
        <div
          class="anim-spin w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-400"
        ></div>
        <div class="text-center w-full">
          <p class="font-display font-bold text-xs tracking-widest uppercase text-blue-500">
            Loading Audio
          </p>
          <p id="modal-loading-filename" class="mt-1 text-xs text-slate-400 truncate"></p>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <!-- TODO fix loading bar -->
          <div
            id="modal-loading-bar"
            class="h-full w-0 bg-accent rounded-full transition-all duration-300"
          ></div>
        </div>
      </div>
    </cq-modal>
  `,
  styles: `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .anim-spin {
      animation: spin 0.8s linear infinite;
    }
  `,
})
export class AudioLoadingModalComponent {
  protected readonly audioLoadSvc = inject(AudioLoadService);
  open = this.audioLoadSvc.loading;
  subtitle = this.audioLoadSvc.loadingTitle;

  //   /* ── LOADING MODAL ── */
  //   /** Show the loading modal. Call before you start decoding. */
  //   function showLoadingModal(filename) {
  //     el.modalFilename.textContent = filename || '';
  //     el.modalBar.style.width = '0%';
  //     el.modalLoading.classList.remove('hidden');
  //   }

  //   /** Update the loading bar (0–1). */
  //   function setLoadingProgress(fraction) {
  //     el.modalBar.style.width = `${clamp(fraction, 0, 1) * 100}%`;
  //   }
}

import { Component, computed, inject } from '@angular/core';
import { AudioLoadService } from '../../services/audio-load.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'cq-audio-loading-modal',
  imports: [ModalComponent],
  template: `
    <cq-modal [open]="loadingData().open" [closeable]="false">
      <span title>Loading...</span>
      <span subtitle>{{ loadingData().title }}</span>

      <div body class="flex flex-col items-center w-full gap-5 p-5">
        <div
          class="anim-spin w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-400"
        ></div>
        <div class="text-center w-full">
          <p class="font-display font-bold text-xs mb-1 tracking-widest uppercase text-blue-500">
            Loading Audio
          </p>
        </div>
        @if (loadingData().error) {
          <div
            class="bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 rounded-md relative w-full"
            role="alert"
          >
            <span class="font-medium">Error occured while loading:</span> {{ loadingData().error }}
          </div>
        } @else {
          <div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mx-4 mb-4">
            <div
              [style.width]="loadingData().percentLoaded + '%'"
              class="h-full bg-blue-400 rounded-full transition-all duration-300"
            ></div>
          </div>
        }
      </div>
      @if (loadingData().error) {
        <div footer class="flex items-center justify-end w-full">
          <button
            (click)="audioLoadSvc.clearError()"
            class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-xl transition-colors"
          >
            Ok
          </button>
        </div>
      }
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

  protected readonly loadingData = computed(() => {
    const loadingState = this.audioLoadSvc.loadingState();
    if (loadingState.state === 'loading') {
      return {
        open: true,
        title: loadingState.title,
        error: undefined,
        percentLoaded: Math.round(loadingState.progress * 100),
      };
    } else if (loadingState.state === 'error') {
      {
        return {
          open: true,
          error: loadingState.error,
          title: loadingState.title,
          percentLoaded: 0,
        };
      }
    } else {
      return { open: false, error: undefined, title: '', percentLoaded: 0 };
    }
  });
}

import { Component, computed, inject } from '@angular/core';
import { AudioLoadService } from '../../services/audio-load.service';
import { ConstantqService } from '../../services/constantq.service';

@Component({
  selector: 'cq-loading-indicator',
  imports: [],
  template: `
    <span
      [class]="
        (state().msg === 'Loaded' ? 'text-brand-light' : 'text-body-subtle') +
        ' inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-secondary border border-default'
      "
    >
      {{ state().msg }}
    </span>

    <span
      [class.invisible]="typeof state().pct !== 'number'"
      class="tabular text-[11px] text-body w-6 text-right"
      >{{ state().pct }}%</span
    >
  `,
  host: {
    class: 'flex items-center gap-3',
  },
})
export class LoadingIndicatorComponent {
  private readonly audioLoadSvc = inject(AudioLoadService);
  private readonly constantQSvc = inject(ConstantqService);

  protected state = computed(() => {
    const loadingState = this.audioLoadSvc.loadingState();
    if (loadingState.state === 'loading') {
      return { msg: 'Loading', pct: Math.round(loadingState.progress * 100) };
    }

    const audioData = this.audioLoadSvc.audioFileData();
    if (!audioData) {
      return { msg: 'Idle', pct: undefined };
    }

    const loadingPercentage = this.constantQSvc.loadingPercentage();
    if (loadingPercentage >= 1) {
      return { msg: 'Loaded', pct: undefined };
    } else {
      return { msg: 'Processing', pct: Math.round(loadingPercentage * 100) };
    }

    // subscribe to loading state
  });

  //     el.modalLoading.classList.add('hidden');
  //     state.duration      = duration;
  //     state.currentTime   = 0;
  //     state.processedTime = 0;
  //     state.fileLoaded    = true;
  //     el.fileInfoName.textContent = filename;
  //     el.fileInfoDur.textContent  = `${formatTime(duration)} total`;
  //     el.fileInfoSr.textContent   = `${sampleRate.toLocaleString()} Hz`;
  //     el.fileInfoBar.classList.remove('hidden');
  //     el.fileInfoBar.classList.add('anim-fadein');
}

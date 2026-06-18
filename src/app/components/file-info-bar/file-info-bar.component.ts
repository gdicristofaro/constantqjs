import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MegabytesPipe } from '../../pipes/megabytes.pipe';
import { PlayTimePipe } from '../../pipes/playtime.pipe';
import { AudioLoadService } from '../../services/audio-load.service';

@Component({
  selector: 'cq-file-info-bar',
  imports: [MegabytesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class.hidden]="!audioLoadSvc.audioFileData()"
      class="max-h-500px:hidden flex-shrink-0 flex items-center gap-3 px-5 py-1.5 bg-brand-softer border-b border-brand-soft text-xxs"
    >
      <span class="text-brand-medium font-semibold truncate max-w-xs">{{ fileName() }}</span>
      <span class="text-body-subtle">|</span>
      <span class="text-body-subtle">{{ fileDuration() }}</span>
      <span class="text-body-subtle">|</span>
      <span class="text-body-subtle">{{ fileSampleRate() }}</span>
      <span class="text-body-subtle">|</span>
      <span class="text-body-subtle">{{ fileBytes() | megabytes }}</span>
    </div>
  `,
})
export class FileInfoBarComponent {
  protected readonly audioLoadSvc = inject(AudioLoadService);

  private readonly playtimePipe = new PlayTimePipe();

  protected readonly fileBytes = computed(() => this.audioLoadSvc.audioFileData()?.size ?? 0);
  protected readonly fileName = computed(() => this.audioLoadSvc.audioFileData()?.title || '-');
  protected readonly fileDuration = computed(() => {
    const duration = this.audioLoadSvc.audioFileData()?.audio?.duration;
    if (!duration) {
      return '-';
    } else {
      return this.playtimePipe.transform(duration);
    }
  });

  protected readonly fileSampleRate = computed(() => {
    const sampleRate = this.audioLoadSvc.audioFileData()?.audio?.sampleRate;
    if (!sampleRate) {
      return '-';
    } else {
      return `${sampleRate.toLocaleString()} Hz`;
    }
  });
}

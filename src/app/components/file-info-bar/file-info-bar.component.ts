import { Component, computed, inject } from '@angular/core';
import { MegabytesPipe } from '../../pipes/megabytes.pipe';
import { PlayTimePipe } from '../../pipes/playtime.pipe';
import { AudioLoadService } from '../../services/audio-load.service';

@Component({
  selector: 'cq-file-info-bar',
  imports: [MegabytesPipe],
  template: `
    <div
      id="file-info-bar"
      [class.hidden]="!audioLoadSvc.audioFileData()"
      class="flex-shrink-0 flex items-center gap-3 px-5 py-1.5 bg-blue-50 border-b border-blue-300 text-[10px]"
    >
      <span class="text-slate-400 tracking-wider">FILE</span>
      <span class="text-blue-600 font-semibold truncate max-w-xs">{{ fileName() }}</span>
      <span class="text-slate-300">|</span>
      <span id="file-info-dur" class="text-slate-500">{{ fileDuration() }}</span>
      <span class="text-slate-300">|</span>
      <span id="file-info-sr" class="text-slate-500">{{ fileSampleRate() }}</span>
      <span class="text-slate-300">|</span>
      <span class="text-slate-500">{{ fileBytes() | megabytes }}</span>
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

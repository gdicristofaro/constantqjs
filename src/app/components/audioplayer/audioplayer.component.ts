import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlayTimePipe } from '../../pipes/playtime.pipe';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { ConstantqService } from '../../services/constantq.service';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'audioplayer.component.html',
  styleUrl: 'audioplayer.component.scss',
  imports: [PlayTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cq-audio-player',
})
export class AudioPlayerComponent {
  // whether or not audio is playing (based on playback isPlaying)
  private readonly playback = inject(AudioPlaybackService);
  private readonly constantQSvc = inject(ConstantqService);

  readonly isPlaying = this.playback.isPlaying;
  readonly curPosition = this.playback.curPosition;
  readonly duration = this.playback.duration;

  readonly loadedPerc = this.constantQSvc.loadingPercentage;

  readonly curPositionPerc = computed(() => {
    const curPos = this.curPosition();
    const duration = this.duration();
    if (!duration) {
      return 0;
    } else {
      return Math.round((curPos / duration) * 10000) / 10000;
    }
  });

  /**
   * Sets current play position.
   * @param secs The seconds to set the current position to.
   */
  setCurPosition(secs: number) {
    this.playback.seek(secs);
  }

  onRangeChange(event: Event) {
    const inputVal = (event.target as HTMLInputElement)?.value ?? 0;
    const percentage = parseFloat(inputVal);
    const newPosition = percentage * (this.duration() ?? 0);
    this.setCurPosition(newPosition);
  }
  /**
   * Toggle playback to either play/pause.
   */
  togglePlay() {
    this.playback.togglePlay();
  }
}

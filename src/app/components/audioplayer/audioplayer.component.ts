import { Component, computed, inject } from '@angular/core';
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
      return Math.round((curPos / duration) * 100) / 100;
    }
  });

  /**
   * Sets current play position.
   * @param secs The seconds to set the current position to.
   */
  setCurPosition(secs: number) {
    this.playback.seek(secs);
  }

  onBarTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    const bar = event.target as HTMLElement;
    if (!bar) return;

    this.onPlaybarClick(bar, touch.clientX);
  }

  onBarMouseDown(event: MouseEvent) {
    const bar = event.target as HTMLElement;
    if (!bar) return;

    this.onPlaybarClick(bar, event.clientX);
  }

  private onPlaybarClick(el: HTMLElement, clickX: number) {
    const rect = el.getBoundingClientRect();
    const percentage = (clickX - rect.left) / rect.width;
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    const newPosition = clampedPercentage * (this.duration() ?? 0);

    this.setCurPosition(newPosition);
  }
  /**
   * Toggle playback to either play/pause.
   */
  togglePlay() {
    this.playback.togglePlay();
  }
}

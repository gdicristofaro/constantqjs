import { Component, OnInit, Input, inject } from '@angular/core';
import { AudioPlaybackService } from '../../services/audio-playback.service';
('../../services/audio-playback.service');
import { MatSliderModule } from '@angular/material/slider';

/**
 * This component is responsible for rendering playback controls as well
 * as displaying the current playback time.
 */
@Component({
  templateUrl: 'audioplayer.component.html',
  imports: [MatSliderModule],
  selector: 'audio-player',
})
export class AudioPlayerComponent {
  // whether or not audio is playing (based on playback isPlaying)
  private readonly playback = inject(AudioPlaybackService);

  readonly isPlaying = this.playback.isPlaying;
  readonly curPosition = this.playback.curPosition;
  readonly duration = this.playback.duration;

  /**
   * Sets current play position.
   * @param secs The seconds to set the current position to.
   */
  setCurPosition(secs: number) {
    this.playback.setCurPosition(secs);
  }

  /**
   * Toggle playback to either play/pause.
   */
  togglePlay() {
    this.playback.togglePlay();
  }
}

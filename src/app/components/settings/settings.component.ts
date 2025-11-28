import { Component, computed, model } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DEFAULT_FPS, DEFAULT_MAX_FREQ, DEFAULT_MIN_FREQ } from '../../model/defaults';
import { getName, Note, Pitch, PitchData } from '../../model/pitch';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  imports: [MatCardModule, MatFormFieldModule, MatSelectModule],
})
export class SettingsComponent {
  readonly minPitch = model<Pitch>(DEFAULT_MIN_FREQ);
  readonly maxPitch = model<Pitch>(DEFAULT_MAX_FREQ);
  readonly fps = model<number>(DEFAULT_FPS);

  readonly minPitches = computed(() => {
    return PitchData.filter(p => p.note === Note.C && p.frequency < this.maxPitch().frequency);
  });

  readonly maxPitches = computed(() => {
    return PitchData.filter(p => p.note === Note.C && p.frequency > this.minPitch().frequency);
  });

  getName(pitch: Pitch) {
    return getName(pitch);
  }

  onFpsKey(event: Event) {
    const val: number =
      event?.target && 'value' in event.target && typeof event.target.value === 'number'
        ? event.target.value
        : 1;
    const boundedVal = Math.min(32, Math.max(1, Math.floor(val)));
    this.fps.set(boundedVal);
  }
}

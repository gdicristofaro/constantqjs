import { Component, computed, effect, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';

import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map } from 'rxjs';
import { DEFAULT_FPS, DEFAULT_MAX_FREQ, DEFAULT_MIN_FREQ } from '../../model/defaults';
import { getName, Note, Pitch, PitchData } from '../../model/pitch';
import { Settings } from '../../model/settings';

@Component({
  selector: 'cq-settings',
  templateUrl: './settings.component.html',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
})
export class SettingsComponent {
  readonly settingsForm = new FormGroup({
    settingsMinPitch: new FormControl(DEFAULT_MIN_FREQ, Validators.required),
    settingsMaxPitch: new FormControl(DEFAULT_MAX_FREQ, Validators.required),
    settingsFps: new FormControl(DEFAULT_FPS, [
      Validators.required,
      Validators.min(1),
      Validators.max(32),
    ]),
  });

  private readonly _settingsData = toSignal(
    this.settingsForm.valueChanges.pipe(map(val => this.getSettings(val))),
    {
      initialValue: this.getSettings(this.settingsForm.value),
    },
  );

  private readonly _isValid = toSignal(
    this.settingsForm.statusChanges.pipe(map(status => status === 'VALID')),
    {
      initialValue: this.settingsForm.valid,
    },
  );

  private readonly _settingsDataResult = computed(
    () =>
      (this._isValid()
        ? { valid: true, data: this._settingsData() }
        : { valid: false }) as SettingsResult,
  );

  readonly minPitches = computed(() => {
    const maxFreq = this._settingsData().maxPitch.frequency;
    const pitches = PitchData.filter(p => p.note === Note.C && (!maxFreq || p.frequency < maxFreq));
    return pitches;
  });

  readonly maxPitches = computed(() => {
    const minFreq = this._settingsData().minPitch.frequency;
    const pitches = PitchData.filter(p => p.note === Note.C && (!minFreq || p.frequency > minFreq));
    return pitches;
  });

  settingsDataUpdate = output<SettingsResult>();

  constructor() {
    effect(() => {
      this.settingsDataUpdate.emit(this._settingsDataResult());
    });
  }

  private getSettings(form: typeof this.settingsForm.value): Settings {
    return {
      fps: form.settingsFps ?? DEFAULT_FPS,
      maxPitch: form.settingsMaxPitch ?? DEFAULT_MAX_FREQ,
      minPitch: form.settingsMinPitch ?? DEFAULT_MIN_FREQ,
    };
  }

  getName(pitch: Pitch) {
    return getName(pitch);
  }
}

export type SettingsResult = { valid: true; data: Settings } | { valid: false };

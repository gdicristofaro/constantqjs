import { Component, computed, effect, output } from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { DEFAULT_FPS, DEFAULT_MAX_FREQ, DEFAULT_MIN_FREQ } from '../../model/defaults';
import { getName, Note, Pitch, PitchData } from '../../model/pitch';
import { Settings } from '../../model/settings';

@Component({
  selector: 'cq-settings',
  templateUrl: './settings.component.html',
  imports: [ReactiveFormsModule],
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

  protected readonly _settingsData = toSignal(
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

  get pitches() {
    return PitchData.filter(p => p.note === Note.C);
  }

  get minPitches() {
    const rest = this.pitches.slice(1, this.pitches.length);
    return rest;
  }

  get maxPitches() {
    const rest = this.pitches.slice(0, -1);
    return rest;
  }

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

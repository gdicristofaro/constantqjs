import { Component, computed, effect, model, untracked } from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
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
    settingsMinPitch: new FormControl<Pitch>(DEFAULT_MIN_FREQ, Validators.required),
    settingsMaxPitch: new FormControl<Pitch>(DEFAULT_MAX_FREQ, Validators.required),
    settingsFps: new FormControl(DEFAULT_FPS, [
      Validators.required,
      Validators.min(1),
      Validators.max(32),
    ]),
  });

  readonly settings = model.required<SettingsResult>();

  protected readonly _settingsData = toSignal(
    this.settingsForm.valueChanges.pipe(
      map(val => this.getSettings(val)),
      distinctUntilChanged(),
    ),
    {
      initialValue: this.getSettings(this.settingsForm.value),
    },
  );

  private readonly _isValid = toSignal(
    this.settingsForm.statusChanges.pipe(
      map(status => status !== 'INVALID'),
      distinctUntilChanged(),
    ),
    {
      initialValue: this.settingsForm.valid,
    },
  );

  private readonly _settingsFromForm = computed(
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

  constructor() {
    effect(() => {
      this.settings.set(this._settingsFromForm());
    });

    effect(() => {
      const settingsResult = this.settings();
      untracked(() => {
        if (settingsResult.valid) {
          const { fps, maxPitch, minPitch } = settingsResult.data;

          this.settingsForm.setValue(
            {
              settingsFps: fps,
              settingsMaxPitch: maxPitch,
              settingsMinPitch: minPitch,
            },
            { emitEvent: false },
          );
        }
      });
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

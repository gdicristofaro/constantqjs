import { animate, style, transition, trigger } from '@angular/animations';
import {
  Component,
  computed,
  effect,
  HostListener,
  input,
  model,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import {
  DEFAULT_ABSOLUTE_KEYBOARD_THRESHOLD,
  DEFAULT_FPS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_RELATIVE_KEYBOARD_THRESHOLD,
} from '../../model/defaults';
import { getName, Note, Pitch, PitchData } from '../../model/pitch';
import { Settings } from '../../model/settings';

@Component({
  selector: 'cq-settings',
  templateUrl: './settings.component.html',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
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
    settingsAbsoluteKeyboardThreshold: new FormControl(
      Math.round(DEFAULT_ABSOLUTE_KEYBOARD_THRESHOLD * 100),
      [Validators.required, Validators.min(1), Validators.max(100)],
    ),
    settingsRelativeKeyboardThreshold: new FormControl(
      Math.round(DEFAULT_RELATIVE_KEYBOARD_THRESHOLD * 100),
      [Validators.required, Validators.min(1), Validators.max(100)],
    ),
  });

  readonly settings = model.required<SettingsResult>();
  readonly panelOpen = input(true);

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
    const rest = this.pitches.slice(0, this.pitches.length - 1);
    return rest;
  }

  get maxPitches() {
    const rest = this.pitches.slice(1);
    return rest;
  }

  constructor() {
    effect(() => {
      this.settings.set(this._settingsFromForm());
    });

    effect(() => {
      if (!this.panelOpen()) {
        untracked(() => (this.openPopover = null));
      }
    });

    effect(() => {
      const settingsResult = this.settings();
      untracked(() => {
        if (settingsResult.valid) {
          const { fps, maxPitch, minPitch, absoluteKeyboardThreshold, relativeKeyboardThreshold } =
            settingsResult.data;

          this.settingsForm.setValue(
            {
              settingsFps: fps,
              settingsMaxPitch: maxPitch,
              settingsMinPitch: minPitch,
              settingsAbsoluteKeyboardThreshold: Math.round(absoluteKeyboardThreshold * 100),
              settingsRelativeKeyboardThreshold: Math.round(relativeKeyboardThreshold * 100),
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
      absoluteKeyboardThreshold:
        (form.settingsAbsoluteKeyboardThreshold ?? DEFAULT_ABSOLUTE_KEYBOARD_THRESHOLD * 100) / 100,
      relativeKeyboardThreshold:
        (form.settingsRelativeKeyboardThreshold ?? DEFAULT_RELATIVE_KEYBOARD_THRESHOLD * 100) / 100,
    };
  }

  openPopover: string | null = null;

  togglePopover(id: string, event: Event): void {
    event.stopPropagation();
    this.openPopover = this.openPopover === id ? null : id;
  }

  @HostListener('click')
  @HostListener('document:click')
  closePopover(): void {
    this.openPopover = null;
  }

  getName(pitch: Pitch) {
    return getName(pitch);
  }
}

export type SettingsResult = { valid: true; data: Settings } | { valid: false };

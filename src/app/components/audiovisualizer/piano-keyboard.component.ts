import { Component, computed, input } from '@angular/core';
import { Note, Pitch } from '../../model/pitch';

const NOTE_X_OFFSETS: Record<Note, number> = {
  [Note.C]: 0.5,
  [Note.CSharp]: 1.0,
  [Note.D]: 1.5,
  [Note.DSharp]: 2.0,
  [Note.E]: 2.5,
  [Note.F]: 3.5,
  [Note.FSharp]: 4.0,
  [Note.G]: 4.5,
  [Note.GSharp]: 5.0,
  [Note.A]: 5.5,
  [Note.ASharp]: 6.0,
  [Note.B]: 6.5,
};

const WHITE_NOTES = new Set([Note.C, Note.D, Note.E, Note.F, Note.G, Note.A, Note.B]);

interface KeyData {
  noteIndex: number;
  /** left edge x in piano-unit coordinates */
  x: number;
  /** 0 = inactive, 0-1 = active at this relative intensity */
  intensity: number;
  isWhite: boolean;
}

@Component({
  selector: 'cq-piano-keyboard',
  styleUrl: './piano-keyboard.component.scss',
  template: `
    <svg [attr.viewBox]="viewBox()" preserveAspectRatio="none" class="piano-svg">
      @for (key of whiteKeys(); track key.noteIndex) {
        <rect
          [attr.x]="key.x"
          y="0"
          width="1"
          height="1"
          [style.fill]="keyFill(key.intensity, true)"
          class="piano-key"
        />
      }
      @for (key of blackKeys(); track key.noteIndex) {
        <rect
          [attr.x]="key.x"
          y="0"
          width="0.6"
          height="0.65"
          [style.fill]="keyFill(key.intensity, false)"
          class="piano-key"
        />
      }
    </svg>
  `,
})
export class PianoKeyboardComponent {
  readonly pitchRange = input.required<Pitch[]>();
  /** Per-note intensity values (0 = inactive, >0 = active at that relative intensity). */
  readonly noteIntensities = input<number[]>([]);

  readonly numOctaves = computed(() => {
    const range = this.pitchRange();
    if (!range.length) return 1;
    return range[range.length - 1].octave - range[0].octave + 1;
  });

  readonly viewBox = computed(() => `0 0 ${this.numOctaves() * 7} 1`);

  private readonly keyData = computed<KeyData[]>(() => {
    const range = this.pitchRange();
    const intensities = this.noteIntensities();
    if (!range.length) return [];
    const baseOctave = range[0].octave;

    return range.map((pitch, i) => ({
      noteIndex: i,
      x: (pitch.octave - baseOctave) * 7 + NOTE_X_OFFSETS[pitch.note],
      intensity: intensities[i] ?? 0,
      isWhite: WHITE_NOTES.has(pitch.note),
    }));
  });

  // white key x = center - 0.5 (left edge)
  readonly whiteKeys = computed(() =>
    this.keyData()
      .filter(k => k.isWhite)
      .map(k => ({ ...k, x: k.x - 0.5 })),
  );

  // black key x = center - 0.3 (left edge of 0.6-wide key)
  readonly blackKeys = computed(() =>
    this.keyData()
      .filter(k => !k.isWhite)
      .map(k => ({ ...k, x: k.x - 0.3 })),
  );

  keyFill(intensity: number, isWhite: boolean): string {
    if (intensity <= 0) {
      return isWhite ? 'var(--color-piano-white-key)' : 'var(--color-piano-black-key)';
    }
    const pct = Math.round(intensity * 100);
    const accent = isWhite ? '--color-brand-medium' : '--color-brand';
    const base = isWhite ? '--color-piano-white-key' : '--color-piano-black-key';
    return `color-mix(in srgb, var(${accent}) ${pct}%, var(${base}))`;
  }
}

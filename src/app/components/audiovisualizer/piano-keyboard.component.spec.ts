import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Note, Pitch, PitchDataMap, getFreqRange } from '../../model/pitch';
import { PianoKeyboardComponent } from './piano-keyboard.component';

// Full 12-note octave starting at C for the given octave number.
function octaveRange(oct: number): Pitch[] {
  return getFreqRange(Note.C, oct, Note.C, oct + 1);
}

// Convenience pitch lookups.
const C4 = PitchDataMap['C4'] as Pitch;
const D4 = PitchDataMap['D4'] as Pitch;
const CSharp4 = PitchDataMap['C#4'] as Pitch;
const DSharp4 = PitchDataMap['D#4'] as Pitch;
const C5 = PitchDataMap['C5'] as Pitch;

// ── keyFill ───────────────────────────────────────────────────────────────────

describe('PianoKeyboardComponent.keyFill', () => {
  let component: PianoKeyboardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PianoKeyboardComponent);
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    component = fixture.componentInstance;
  });

  it('should return the white key CSS variable when intensity is 0', () => {
    expect(component.keyFill(0, true)).toBe('var(--color-piano-white-key)');
  });

  it('should return the black key CSS variable when intensity is 0', () => {
    expect(component.keyFill(0, false)).toBe('var(--color-piano-black-key)');
  });

  it('should return the white key CSS variable for negative intensity', () => {
    expect(component.keyFill(-0.5, true)).toBe('var(--color-piano-white-key)');
  });

  it('should return a color-mix string for an active white key at 50%', () => {
    expect(component.keyFill(0.5, true)).toBe(
      'color-mix(in srgb, var(--color-brand-medium) 50%, var(--color-piano-white-key))',
    );
  });

  it('should return a color-mix string for an active black key at 75%', () => {
    expect(component.keyFill(0.75, false)).toBe(
      'color-mix(in srgb, var(--color-brand) 75%, var(--color-piano-black-key))',
    );
  });

  it('should round fractional intensity to the nearest integer percent', () => {
    expect(component.keyFill(1 / 3, true)).toBe(
      'color-mix(in srgb, var(--color-brand-medium) 33%, var(--color-piano-white-key))',
    );
  });

  it('should use 100% for full intensity on a black key', () => {
    expect(component.keyFill(1, false)).toBe(
      'color-mix(in srgb, var(--color-brand) 100%, var(--color-piano-black-key))',
    );
  });
});

// ── numOctaves ────────────────────────────────────────────────────────────────

describe('PianoKeyboardComponent.numOctaves', () => {
  let component: PianoKeyboardComponent;
  let fixture: ComponentFixture<PianoKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PianoKeyboardComponent);
    component = fixture.componentInstance;
  });

  it('should return 1 for an empty pitch range', () => {
    fixture.componentRef.setInput('pitchRange', []);
    expect(component.numOctaves()).toBe(1);
  });

  it('should return 1 for a single-octave range', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.numOctaves()).toBe(1);
  });

  it('should return 2 for pitches spanning two octaves', () => {
    fixture.componentRef.setInput('pitchRange', [...octaveRange(3), ...octaveRange(4)]);
    expect(component.numOctaves()).toBe(2);
  });

  it('should return 3 for pitches spanning three octaves', () => {
    fixture.componentRef.setInput('pitchRange', [...octaveRange(2), ...octaveRange(3), ...octaveRange(4)]);
    expect(component.numOctaves()).toBe(3);
  });
});

// ── viewBox ───────────────────────────────────────────────────────────────────

describe('PianoKeyboardComponent.viewBox', () => {
  let component: PianoKeyboardComponent;
  let fixture: ComponentFixture<PianoKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PianoKeyboardComponent);
    component = fixture.componentInstance;
  });

  it('should return "0 0 7 1" for an empty range (defaults to 1 octave)', () => {
    fixture.componentRef.setInput('pitchRange', []);
    expect(component.viewBox()).toBe('0 0 7 1');
  });

  it('should return "0 0 7 1" for a single-octave range', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.viewBox()).toBe('0 0 7 1');
  });

  it('should return "0 0 14 1" for a two-octave range', () => {
    fixture.componentRef.setInput('pitchRange', [...octaveRange(3), ...octaveRange(4)]);
    expect(component.viewBox()).toBe('0 0 14 1');
  });
});

// ── whiteKeys ─────────────────────────────────────────────────────────────────

describe('PianoKeyboardComponent.whiteKeys', () => {
  let component: PianoKeyboardComponent;
  let fixture: ComponentFixture<PianoKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PianoKeyboardComponent);
    component = fixture.componentInstance;
  });

  it('should contain only white-note keys', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.whiteKeys().every(k => k.isWhite)).toBe(true);
  });

  it('should return 7 keys for a full octave', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.whiteKeys().length).toBe(7);
  });

  it('should return an empty array when the range contains only a black note', () => {
    fixture.componentRef.setInput('pitchRange', [CSharp4]);
    expect(component.whiteKeys().length).toBe(0);
  });

  it('should position C4 at x=0 (left edge)', () => {
    fixture.componentRef.setInput('pitchRange', [C4]);
    const whites = component.whiteKeys();
    expect(whites.length).toBe(1);
    expect(whites[0].x).toBeCloseTo(0);
  });

  it('should position D4 at x=1', () => {
    fixture.componentRef.setInput('pitchRange', [D4]);
    expect(component.whiteKeys()[0].x).toBeCloseTo(1);
  });

  it('should offset keys by 7 units per octave for multi-octave ranges', () => {
    // C4 is index 0 (x=0), C5 is index 1 — its x should be 7 (one octave over).
    fixture.componentRef.setInput('pitchRange', [C4, C5]);
    const whites = component.whiteKeys();
    const c5Key = whites.find(k => k.noteIndex === 1);
    expect(c5Key?.x).toBeCloseTo(7);
  });

  it('should apply intensity values from noteIntensities', () => {
    fixture.componentRef.setInput('pitchRange', [C4]);
    fixture.componentRef.setInput('noteIntensities', [0.8]);
    expect(component.whiteKeys()[0].intensity).toBeCloseTo(0.8);
  });

  it('should default intensity to 0 when noteIntensities is shorter than pitchRange', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    fixture.componentRef.setInput('noteIntensities', []);
    expect(component.whiteKeys().every(k => k.intensity === 0)).toBe(true);
  });
});

// ── blackKeys ─────────────────────────────────────────────────────────────────

describe('PianoKeyboardComponent.blackKeys', () => {
  let component: PianoKeyboardComponent;
  let fixture: ComponentFixture<PianoKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PianoKeyboardComponent);
    component = fixture.componentInstance;
  });

  it('should contain only black (sharp) note keys', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.blackKeys().every(k => !k.isWhite)).toBe(true);
  });

  it('should return 5 keys for a full octave', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    expect(component.blackKeys().length).toBe(5);
  });

  it('should return an empty array when the range contains only a white note', () => {
    fixture.componentRef.setInput('pitchRange', [C4]);
    expect(component.blackKeys().length).toBe(0);
  });

  it('should position C#4 at x≈0.7', () => {
    fixture.componentRef.setInput('pitchRange', [CSharp4]);
    const blacks = component.blackKeys();
    expect(blacks.length).toBe(1);
    expect(blacks[0].x).toBeCloseTo(0.7);
  });

  it('should position D#4 at x≈1.7', () => {
    fixture.componentRef.setInput('pitchRange', [DSharp4]);
    expect(component.blackKeys()[0].x).toBeCloseTo(1.7);
  });

  it('should apply intensity values from noteIntensities', () => {
    fixture.componentRef.setInput('pitchRange', [CSharp4]);
    fixture.componentRef.setInput('noteIntensities', [0.6]);
    expect(component.blackKeys()[0].intensity).toBeCloseTo(0.6);
  });
});

// ── rendered template ─────────────────────────────────────────────────────────

describe('PianoKeyboardComponent template', () => {
  let fixture: ComponentFixture<PianoKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PianoKeyboardComponent);
  });

  it('should render 12 rects (7 white + 5 black) for a full octave', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    fixture.detectChanges();
    const rects = (fixture.nativeElement as HTMLElement).querySelectorAll('rect');
    expect(rects.length).toBe(12);
  });

  it('should render 24 rects for a two-octave range', () => {
    fixture.componentRef.setInput('pitchRange', [...octaveRange(3), ...octaveRange(4)]);
    fixture.detectChanges();
    const rects = (fixture.nativeElement as HTMLElement).querySelectorAll('rect');
    expect(rects.length).toBe(24);
  });

  it('should set the SVG viewBox attribute correctly for a single octave', () => {
    fixture.componentRef.setInput('pitchRange', octaveRange(4));
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 7 1');
  });

  it('should set the SVG viewBox attribute correctly for two octaves', () => {
    fixture.componentRef.setInput('pitchRange', [...octaveRange(3), ...octaveRange(4)]);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 14 1');
  });

  it('should render 1 white rect and 0 black rects for a single C note', () => {
    fixture.componentRef.setInput('pitchRange', [C4]);
    fixture.detectChanges();
    const rects = (fixture.nativeElement as HTMLElement).querySelectorAll('rect');
    expect(rects.length).toBe(1);
  });
});

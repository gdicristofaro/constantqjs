import {
  getFreqRange,
  getName,
  getPitch,
  Note,
  noteToString,
  PitchData,
  PitchDataMap,
  stringToNote,
} from './pitch';

// ─── noteToString ─────────────────────────────────────────────────────────────

describe('noteToString', () => {
  it('should convert C to "C"', () => {
    expect(noteToString(Note.C)).toBe('C');
  });

  it('should convert CSharp to "C#"', () => {
    expect(noteToString(Note.CSharp)).toBe('C#');
  });

  it('should convert FSharp to "F#"', () => {
    expect(noteToString(Note.FSharp)).toBe('F#');
  });

  it('should convert A to "A"', () => {
    expect(noteToString(Note.A)).toBe('A');
  });

  it('should convert B to "B"', () => {
    expect(noteToString(Note.B)).toBe('B');
  });

  it('should throw for an unknown note value', () => {
    expect(() => noteToString(99 as Note)).toThrow();
  });
});

// ─── stringToNote ─────────────────────────────────────────────────────────────

describe('stringToNote', () => {
  it('should convert "C" to Note.C', () => {
    expect(stringToNote('C')).toBe(Note.C);
  });

  it('should convert "C#" to Note.CSharp', () => {
    expect(stringToNote('C#')).toBe(Note.CSharp);
  });

  it('should convert "F#" to Note.FSharp', () => {
    expect(stringToNote('F#')).toBe(Note.FSharp);
  });

  it('should convert "A" to Note.A', () => {
    expect(stringToNote('A')).toBe(Note.A);
  });

  it('should convert "B" to Note.B', () => {
    expect(stringToNote('B')).toBe(Note.B);
  });

  it('should throw for an unknown note string', () => {
    expect(() => stringToNote('Z')).toThrow();
  });

  it('should be the inverse of noteToString for all notes', () => {
    const allNotes = [
      Note.C,
      Note.CSharp,
      Note.D,
      Note.DSharp,
      Note.E,
      Note.F,
      Note.FSharp,
      Note.G,
      Note.GSharp,
      Note.A,
      Note.ASharp,
      Note.B,
    ];
    allNotes.forEach(note => {
      expect(stringToNote(noteToString(note))).toBe(note);
    });
  });
});

// ─── getPitch ─────────────────────────────────────────────────────────────────

describe('getPitch', () => {
  it('should return C0 with frequency 16.35 Hz', () => {
    const pitch = getPitch(Note.C, 0);
    expect(pitch).toEqual({ note: Note.C, octave: 0, frequency: 16.35 });
  });

  it('should return A4 (concert pitch) with frequency 440 Hz', () => {
    const pitch = getPitch(Note.A, 4);
    expect(pitch).toEqual({ note: Note.A, octave: 4, frequency: 440 });
  });

  it('should return C4 (middle C) with frequency 261.63 Hz', () => {
    const pitch = getPitch(Note.C, 4);
    expect(pitch).toEqual({ note: Note.C, octave: 4, frequency: 261.63 });
  });

  it('should return G3 with frequency 196 Hz', () => {
    const pitch = getPitch(Note.G, 3);
    expect(pitch).toEqual({ note: Note.G, octave: 3, frequency: 196 });
  });

  it('should return B8 with frequency 7902.13 Hz', () => {
    const pitch = getPitch(Note.B, 8);
    expect(pitch).toEqual({ note: Note.B, octave: 8, frequency: 7902.13 });
  });

  it('should floor a fractional octave', () => {
    // octave 4.9 should be treated the same as octave 4
    expect(getPitch(Note.A, 4.9)).toEqual(getPitch(Note.A, 4));
  });
});

// ─── getFreqRange ─────────────────────────────────────────────────────────────

describe('getFreqRange', () => {
  it('should return a slice from C4 up to (not including) E4', () => {
    const range = getFreqRange(Note.C, 4, Note.E, 4);
    expect(range.length).toBe(4); // C4, C#4, D4, D#4
    expect(range[0].note).toBe(Note.C);
    expect(range[0].octave).toBe(4);
    expect(range[range.length - 1].note).toBe(Note.DSharp);
  });

  it('should return a single octave C0–B0 (12 notes) when spanning C0 to C1', () => {
    const range = getFreqRange(Note.C, 0, Note.C, 1);
    expect(range.length).toBe(12);
    expect(range[0].note).toBe(Note.C);
    expect(range[0].octave).toBe(0);
    expect(range[range.length - 1].note).toBe(Note.B);
    expect(range[range.length - 1].octave).toBe(0);
  });

  it('should return an empty array when start and end resolve to the same index', () => {
    const range = getFreqRange(Note.A, 4, Note.A, 4);
    expect(range.length).toBe(0);
  });

  it('should clamp a below-minimum index to 0', () => {
    // Negative note value would produce index < 0; bounded() clamps it to 0.
    const range = getFreqRange(-5 as Note, -1, Note.D, 0);
    expect(range[0]).toEqual(PitchData[0]); // first entry is C0
  });
});

// ─── getName ──────────────────────────────────────────────────────────────────

describe('getName', () => {
  it('should return "C0" for C in octave 0', () => {
    expect(getName({ note: Note.C, octave: 0, frequency: 16.35 })).toBe('C0');
  });

  it('should return "C#4" for CSharp in octave 4', () => {
    expect(getName({ note: Note.CSharp, octave: 4, frequency: 277.18 })).toBe('C#4');
  });

  it('should return "A4" for concert-pitch A', () => {
    expect(getName({ note: Note.A, octave: 4, frequency: 440 })).toBe('A4');
  });

  it('should return "F#3" for FSharp in octave 3', () => {
    expect(getName({ note: Note.FSharp, octave: 3, frequency: 185 })).toBe('F#3');
  });

  it('should return "B8" for B in octave 8', () => {
    expect(getName({ note: Note.B, octave: 8, frequency: 7902.13 })).toBe('B8');
  });
});

// ─── PitchDataMap ─────────────────────────────────────────────────────────────

describe('PitchDataMap', () => {
  it('should look up C0 by name', () => {
    expect(PitchDataMap['C0']).toEqual({ note: Note.C, octave: 0, frequency: 16.35 });
  });

  it('should look up A4 (concert pitch) by name', () => {
    expect(PitchDataMap['A4']).toEqual({ note: Note.A, octave: 4, frequency: 440 });
  });

  it('should look up C#4 by name', () => {
    expect(PitchDataMap['C#4']).toEqual({ note: Note.CSharp, octave: 4, frequency: 277.18 });
  });

  it('should look up B8 (highest entry) by name', () => {
    expect(PitchDataMap['B8']).toEqual({ note: Note.B, octave: 8, frequency: 7902.13 });
  });

  it('should return undefined for a non-existent key', () => {
    expect(PitchDataMap['X9']).toBeUndefined();
  });

  it('should contain an entry for every pitch in PitchData', () => {
    PitchData.forEach(p => {
      expect(PitchDataMap[getName(p)]).toEqual(p);
    });
  });
});

/**
 * note names for pitches
 */
export enum Note {
  C = 0,
  CSharp = 1,
  D = 2,
  DSharp = 3,
  E = 4,
  F = 5,
  FSharp = 6,
  G = 7,
  GSharp = 8,
  A = 9,
  ASharp = 10,
  B = 11
};

/**
 * converts a note to the appropriate string to display
 * @param note    the note to convert
 * @returns appropriate note letter string
 */
export const noteToString = (note: Note) => {
  switch (note) {
    case Note.C: return "C";
    case Note.CSharp: return "C#";
    case Note.D: return "D";
    case Note.DSharp: return "D#";
    case Note.E: return "E";
    case Note.F: return "F";
    case Note.FSharp: return "F#";
    case Note.G: return "G";
    case Note.GSharp: return "G#";
    case Note.A: return "A";
    case Note.ASharp: return "A#";
    case Note.B: return "B";
    default: throw `unknown note: ${note}`;
  }
}

export const stringToNote = (nt: string) => {
  switch (nt) {
    case "C": return Note.C;
    case "C#": return Note.CSharp;
    case "D": return Note.D;
    case "D#": return Note.DSharp;
    case "E": return Note.E;
    case "F": return Note.F;
    case "F#": return Note.FSharp;
    case "G": return Note.G;
    case "G#": return Note.GSharp;
    case "A": return Note.A;
    case "A#": return Note.ASharp;
    case "B": return Note.B;
    default: throw `unknown note: ${nt}`;
  }
}

/**
 * gets pertinent pitch data given the note and octave
 * @param note    the note 
 * @param octave  the octave (0-6)
 * @returns the PitchData record including a frequency
 */
export const getPitch = (note: Note, octave: number) => {
  return PitchData[note + Math.floor(octave) * 12];
}

/**
 * bounds a value to be between min and max
 * @param min   the minimum expected value
 * @param max   the maximum expected value
 * @param val   the value to be bound
 * @returns     the bounded value
 */
const bounded = (min, max, val) => {
  return Math.max(min, Math.min(max, val));
}

/**
 * gets a range of notes from note1/octave1 to note2/octave2
 */
export const getFreqRange = (note1: Note, octave1: number, note2: Note, octave2: number) => {
  const index1 = bounded(0, PitchData.length - 1, note1 + Math.floor(octave1) * 12);
  const index2 = bounded(0, PitchData.length - 1, note2 + Math.floor(octave2) * 12);

  return PitchData.slice(index1, index2 + 1);
}


export type Pitch = {
  note: Note,
  octave: number,
  frequency: number
};

/**
 * array of records pertaining to pitch and frequency dates
 * taken from https://pages.mtu.edu/~suits/notefreqs.html
 */
export const PitchData = [
  {
    note: Note.C,
    octave: 0,
    frequency: 16.35
  },
  {
    note: Note.CSharp,
    octave: 0,
    frequency: 17.32
  },
  {
    note: Note.D,
    octave: 0,
    frequency: 18.35
  },
  {
    note: Note.DSharp,
    octave: 0,
    frequency: 19.45
  },
  {
    note: Note.E,
    octave: 0,
    frequency: 20.6
  },
  {
    note: Note.F,
    octave: 0,
    frequency: 21.83
  },
  {
    note: Note.FSharp,
    octave: 0,
    frequency: 23.12
  },
  {
    note: Note.G,
    octave: 0,
    frequency: 24.5
  },
  {
    note: Note.GSharp,
    octave: 0,
    frequency: 25.96
  },
  {
    note: Note.A,
    octave: 0,
    frequency: 27.5
  },
  {
    note: Note.ASharp,
    octave: 0,
    frequency: 29.14
  },
  {
    note: Note.B,
    octave: 0,
    frequency: 30.87
  },
  {
    note: Note.C,
    octave: 1,
    frequency: 32.7
  },
  {
    note: Note.CSharp,
    octave: 1,
    frequency: 34.65
  },
  {
    note: Note.D,
    octave: 1,
    frequency: 36.71
  },
  {
    note: Note.DSharp,
    octave: 1,
    frequency: 38.89
  },
  {
    note: Note.E,
    octave: 1,
    frequency: 41.2
  },
  {
    note: Note.F,
    octave: 1,
    frequency: 43.65
  },
  {
    note: Note.FSharp,
    octave: 1,
    frequency: 46.25
  },
  {
    note: Note.G,
    octave: 1,
    frequency: 49
  },
  {
    note: Note.GSharp,
    octave: 1,
    frequency: 51.91
  },
  {
    note: Note.A,
    octave: 1,
    frequency: 55
  },
  {
    note: Note.ASharp,
    octave: 1,
    frequency: 58.27
  },
  {
    note: Note.B,
    octave: 1,
    frequency: 61.74
  },
  {
    note: Note.C,
    octave: 2,
    frequency: 65.41
  },
  {
    note: Note.CSharp,
    octave: 2,
    frequency: 69.3
  },
  {
    note: Note.D,
    octave: 2,
    frequency: 73.42
  },
  {
    note: Note.DSharp,
    octave: 2,
    frequency: 77.78
  },
  {
    note: Note.E,
    octave: 2,
    frequency: 82.41
  },
  {
    note: Note.F,
    octave: 2,
    frequency: 87.31
  },
  {
    note: Note.FSharp,
    octave: 2,
    frequency: 92.5
  },
  {
    note: Note.G,
    octave: 2,
    frequency: 98
  },
  {
    note: Note.GSharp,
    octave: 2,
    frequency: 103.83
  },
  {
    note: Note.A,
    octave: 2,
    frequency: 110
  },
  {
    note: Note.ASharp,
    octave: 2,
    frequency: 116.54
  },
  {
    note: Note.B,
    octave: 2,
    frequency: 123.47
  },
  {
    note: Note.C,
    octave: 3,
    frequency: 130.81
  },
  {
    note: Note.CSharp,
    octave: 3,
    frequency: 138.59
  },
  {
    note: Note.D,
    octave: 3,
    frequency: 146.83
  },
  {
    note: Note.DSharp,
    octave: 3,
    frequency: 155.56
  },
  {
    note: Note.E,
    octave: 3,
    frequency: 164.81
  },
  {
    note: Note.F,
    octave: 3,
    frequency: 174.61
  },
  {
    note: Note.FSharp,
    octave: 3,
    frequency: 185
  },
  {
    note: Note.G,
    octave: 3,
    frequency: 196
  },
  {
    note: Note.GSharp,
    octave: 3,
    frequency: 207.65
  },
  {
    note: Note.A,
    octave: 3,
    frequency: 220
  },
  {
    note: Note.ASharp,
    octave: 3,
    frequency: 233.08
  },
  {
    note: Note.B,
    octave: 3,
    frequency: 246.94
  },
  {
    note: Note.C,
    octave: 4,
    frequency: 261.63
  },
  {
    note: Note.CSharp,
    octave: 4,
    frequency: 277.18
  },
  {
    note: Note.D,
    octave: 4,
    frequency: 293.66
  },
  {
    note: Note.DSharp,
    octave: 4,
    frequency: 311.13
  },
  {
    note: Note.E,
    octave: 4,
    frequency: 329.63
  },
  {
    note: Note.F,
    octave: 4,
    frequency: 349.23
  },
  {
    note: Note.FSharp,
    octave: 4,
    frequency: 369.99
  },
  {
    note: Note.G,
    octave: 4,
    frequency: 392
  },
  {
    note: Note.GSharp,
    octave: 4,
    frequency: 415.3
  },
  {
    note: Note.A,
    octave: 4,
    frequency: 440
  },
  {
    note: Note.ASharp,
    octave: 4,
    frequency: 466.16
  },
  {
    note: Note.B,
    octave: 4,
    frequency: 493.88
  },
  {
    note: Note.C,
    octave: 5,
    frequency: 523.25
  },
  {
    note: Note.CSharp,
    octave: 5,
    frequency: 554.37
  },
  {
    note: Note.D,
    octave: 5,
    frequency: 587.33
  },
  {
    note: Note.DSharp,
    octave: 5,
    frequency: 622.25
  },
  {
    note: Note.E,
    octave: 5,
    frequency: 659.25
  },
  {
    note: Note.F,
    octave: 5,
    frequency: 698.46
  },
  {
    note: Note.FSharp,
    octave: 5,
    frequency: 739.99
  },
  {
    note: Note.G,
    octave: 5,
    frequency: 783.99
  },
  {
    note: Note.GSharp,
    octave: 5,
    frequency: 830.61
  },
  {
    note: Note.A,
    octave: 5,
    frequency: 880
  },
  {
    note: Note.ASharp,
    octave: 5,
    frequency: 932.33
  },
  {
    note: Note.B,
    octave: 5,
    frequency: 987.77
  },
  {
    note: Note.C,
    octave: 6,
    frequency: 1046.5
  },
  {
    note: Note.CSharp,
    octave: 6,
    frequency: 1108.73
  },
  {
    note: Note.D,
    octave: 6,
    frequency: 1174.66
  },
  {
    note: Note.DSharp,
    octave: 6,
    frequency: 1244.51
  },
  {
    note: Note.E,
    octave: 6,
    frequency: 1318.51
  },
  {
    note: Note.F,
    octave: 6,
    frequency: 1396.91
  },
  {
    note: Note.FSharp,
    octave: 6,
    frequency: 1479.98
  },
  {
    note: Note.G,
    octave: 6,
    frequency: 1567.98
  },
  {
    note: Note.GSharp,
    octave: 6,
    frequency: 1661.22
  },
  {
    note: Note.A,
    octave: 6,
    frequency: 1760
  },
  {
    note: Note.ASharp,
    octave: 6,
    frequency: 1864.66
  },
  {
    note: Note.B,
    octave: 6,
    frequency: 1975.53
  },
  {
    note: Note.C,
    octave: 7,
    frequency: 2093
  },
  {
    note: Note.CSharp,
    octave: 7,
    frequency: 2217.46
  },
  {
    note: Note.D,
    octave: 7,
    frequency: 2349.32
  },
  {
    note: Note.DSharp,
    octave: 7,
    frequency: 2489.02
  },
  {
    note: Note.E,
    octave: 7,
    frequency: 2637.02
  },
  {
    note: Note.F,
    octave: 7,
    frequency: 2793.83
  },
  {
    note: Note.FSharp,
    octave: 7,
    frequency: 2959.96
  },
  {
    note: Note.G,
    octave: 7,
    frequency: 3135.96
  },
  {
    note: Note.GSharp,
    octave: 7,
    frequency: 3322.44
  },
  {
    note: Note.A,
    octave: 7,
    frequency: 3520
  },
  {
    note: Note.ASharp,
    octave: 7,
    frequency: 3729.31
  },
  {
    note: Note.B,
    octave: 7,
    frequency: 3951.07
  },
  {
    note: Note.C,
    octave: 8,
    frequency: 4186.01
  },
  {
    note: Note.CSharp,
    octave: 8,
    frequency: 4434.92
  },
  {
    note: Note.D,
    octave: 8,
    frequency: 4698.63
  },
  {
    note: Note.DSharp,
    octave: 8,
    frequency: 4978.03
  },
  {
    note: Note.E,
    octave: 8,
    frequency: 5274.04
  },
  {
    note: Note.F,
    octave: 8,
    frequency: 5587.65
  },
  {
    note: Note.FSharp,
    octave: 8,
    frequency: 5919.91
  },
  {
    note: Note.G,
    octave: 8,
    frequency: 6271.93
  },
  {
    note: Note.GSharp,
    octave: 8,
    frequency: 6644.88
  },
  {
    note: Note.A,
    octave: 8,
    frequency: 7040
  },
  {
    note: Note.ASharp,
    octave: 8,
    frequency: 7458.62
  },
  {
    note: Note.B,
    octave: 8,
    frequency: 7902.13
  }
];



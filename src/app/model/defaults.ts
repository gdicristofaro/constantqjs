// the default threshold taken from:

import { getPitch, Note } from './pitch';

// http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
export const DEFAULT_THRESH = 0.0054;

export const DEFAULT_FPS = 16;

// the default number of bins (12 pitches in an octave multiplied by 2 for accuracy)
export const DEFAULT_BINS = 24;

// default minimum frequency to utilize
export const DEFAULT_MIN_FREQ = getPitch(Note.C, 2);

// default maximum frequency to utilize
export const DEFAULT_MAX_FREQ = getPitch(Note.C, 6);

// how frequently the visualization of the audio should be refreshed in milliseconds
export const MS_REFRESH = 100;

/**
 * defines the default refresh rate for an fft window in milliseconds
 */
export const FFT_MS_REFRESH = 100;

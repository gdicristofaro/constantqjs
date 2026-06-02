import { Pitch } from './pitch';

/**
 * Configuration settings for Constant-Q analysis
 * @interface Settings
 * @property {Pitch} minPitch - Minimum pitch (frequency) for analysis
 * @property {Pitch} maxPitch - Maximum pitch (frequency) for analysis
 * @property {number} fps - Frames per second for analysis resolution
 */
export interface Settings {
  minPitch: Pitch;
  maxPitch: Pitch;
  fps: number;
  absoluteKeyboardThreshold: number;
  relativeKeyboardThreshold: number;
}

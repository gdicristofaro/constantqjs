/**
 * Defines the structure for audio file data with processing metadata
 * @module audiofiledata
 */

import { Settings } from './settings';

/**
 * Contains decoded audio buffer and associated metadata
 * @interface AudioFileData
 * @property {AudioBuffer} audio - The decoded audio buffer for playback and analysis
 * @property {number} size - The size of the audio file in bytes
 * @property {Settings} settings - The analysis settings (min/max pitch and fps)
 * @property {string} title - The title of the audio file
 * @property {number} fps - Frames per second for analysis
 * @property {string[]} noteLetters - Array of note letter strings for visualization
 */
export default interface AudioFileData {
  audio: AudioBuffer;
  size: number;
  settings: Settings;
  title: string;
  fps: number;
  noteLetters: string[];
}

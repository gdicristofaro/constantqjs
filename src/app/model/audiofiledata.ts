import { Settings } from './settings';

export default interface AudioFileData {
  audio: AudioBuffer;
  size: number;
  settings: Settings;
  title: string;
  fps: number;
  noteLetters: string[];
}

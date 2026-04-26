import { Settings } from './settings';

export default interface AudioFileData {
  audio: AudioBuffer;
  settings: Settings;
  title: string;
  fps: number;
  noteLetters: string[];
}

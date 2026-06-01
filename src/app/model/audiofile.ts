/**
 * Defines audio file input sources
 * @module audiofile
 */

/**
 * Defines an audio file record with pertinent details
 */
interface BaseAudioFile {
  // the display file name
  filename?: string;

  // the file size
  size?: number;
}

export type FileSource = { file: File } & BaseAudioFile;
export type UrlSource = { url: string } & BaseAudioFile;

export type AudioFile = FileSource | UrlSource;

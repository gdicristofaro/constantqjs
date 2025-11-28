/**
 * defines an audio file record with pertinent details gathered from archive.org
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

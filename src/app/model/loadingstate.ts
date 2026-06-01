import AudioFileData from './audiofiledata';

/**
 * Represents the current state of loading an audio file
 * @typedef {Object} LoadingState
 * @property {{state: 'idle'}} - No loading operation in progress
 * @property {{state: 'loading'; title: string; progress: number}} - File is currently loading
 * @property {{state: 'loaded'; result: AudioFileData}} - File has been successfully loaded and decoded
 * @property {{state: 'error'; title: string; error: string}} - An error occurred during loading
 */
export type LoadingState =
  | { state: 'idle' }
  | { state: 'loading'; title: string; progress: number }
  | { state: 'loaded'; result: AudioFileData }
  | { state: 'error'; title: string; error: string };

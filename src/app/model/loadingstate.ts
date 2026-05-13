import AudioFileData from './audiofiledata';

export type LoadingState =
  | { state: 'idle' }
  | { state: 'loading'; title: string; progress: number }
  | { state: 'loaded'; result: AudioFileData }
  | { state: 'error'; title: string; error: {} };

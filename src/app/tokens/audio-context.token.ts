import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

export const AUDIO_CONTEXT = new InjectionToken<AudioContext | null>('AudioContext', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT);
    const window = document.defaultView;

    // Safety check for environments without window (like SSR / Node.js)
    if (!window || typeof window === 'undefined') {
      return null;
    }

    // Support legacy Webkit vendors (Safari)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    return AudioContextClass ? new AudioContextClass() : null;
  },
});

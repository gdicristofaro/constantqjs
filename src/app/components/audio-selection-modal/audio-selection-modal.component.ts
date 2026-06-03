import { CommonModule } from '@angular/common';
import { Component, computed, model, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioFile } from '../../model/audiofile';
import { Note } from '../../model/pitch';
import { Settings } from '../../model/settings';
import {
  DEFAULT_ABSOLUTE_KEYBOARD_THRESHOLD,
  DEFAULT_RELATIVE_KEYBOARD_THRESHOLD,
} from '../../model/defaults';
import { FileSelectorComponent } from '../fileselector/fileselector.component';
import { ModalComponent } from '../modal/modal.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { SettingsComponent, SettingsResult } from '../settings/settings.component';
import { UrlSelectorComponent } from '../urlselector/urlselector.component';

export type Tab = 'recommended' | 'url' | 'local';

export interface RecommendedFile {
  id: number;
  name: string;
  meta: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'cq-audio-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    RecommendedFilesComponent,
    UrlSelectorComponent,
    SettingsComponent,
    FileSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './audio-selection-modal.component.html',
})
export class AudioSelectionModalComponent {
  readonly open = model(true);

  uploadRequest = output<AudioSelectionAndSettings>();

  readonly selectedFile = model<AudioSelectionResult>({
    type: 'recommended',
    audioFile: null,
  });

  settings = model<SettingsResult>({
    valid: true,
    data: {
      fps: 16,
      minPitch: { note: Note.C, octave: 1, frequency: 32.7 },
      maxPitch: { note: Note.C, octave: 8, frequency: 4186 },
      absoluteKeyboardThreshold: DEFAULT_ABSOLUTE_KEYBOARD_THRESHOLD,
      relativeKeyboardThreshold: DEFAULT_RELATIVE_KEYBOARD_THRESHOLD,
    },
  });

  // --- State ---
  activeTab = signal<Tab>('recommended');
  settingsOpen = signal(false);

  // --- Data ---
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'url', label: 'URL' },
    { id: 'local', label: 'Local file' },
  ];

  // --- Computed ---
  canUpload = computed(() => {
    return Boolean(this.selectedFile().audioFile) && this.settings().valid;
  });

  // --- Actions ---
  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  toggleSettings(): void {
    this.settingsOpen.update(v => !v);
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  close(): void {
    this.open.set(false);
  }

  upload(): void {
    const audioFile = this.selectedFile().audioFile;
    const settingsResult = this.settings();

    if (audioFile && settingsResult.valid && 'data' in settingsResult) {
      this.uploadRequest.emit({
        audioFile: audioFile,
        settings: settingsResult.data,
      });
    }
  }
}

export interface AudioSelectionResult {
  audioFile: AudioFile | null;
  type: 'url' | 'file' | 'recommended';
}

export interface AudioSelectionAndSettings {
  audioFile: AudioFile;
  settings: Settings;
}

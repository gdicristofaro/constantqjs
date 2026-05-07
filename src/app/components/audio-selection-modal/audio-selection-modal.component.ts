import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { AudioFile } from '../../model/audiofile';
import { Note } from '../../model/pitch';
import { FileSelectorComponent } from '../fileselector/fileselector.component';
import { ModalComponent } from '../modal/modal.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { SettingsComponent, SettingsResult } from '../settings/settings.component';
import { UrlSelectorComponent } from '../urlselector/urlselector.component';

export type Tab = 'recommended' | 'url' | 'local';
export type OutputFormat = 'plain' | 'timestamps' | 'srt';

export interface RecommendedFile {
  id: number;
  name: string;
  meta: string;
  iconBg: string;
  iconColor: string;
}

export interface AudioUploadSettings {
  language: string;
  outputFormat: OutputFormat;
  speakerDiarization: boolean;
}

export interface AudioUploadResult {
  source: 'recommended' | 'url' | 'local';
  file?: RecommendedFile;
  url?: string;
  localFile?: File;
  settings: AudioUploadSettings;
}

@Component({
  selector: 'cq-audio-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    ModalComponent,
    RecommendedFilesComponent,
    UrlSelectorComponent,
    SettingsComponent,
    FileSelectorComponent,
  ],
  templateUrl: './audio-selection-modal.component.html',
  styleUrl: './audio-selection-modal.component.scss',
})
export class AudioSelectionModalComponent {
  readonly open = model(true);

  closed = output();
  uploaded = output<AudioSelectionResult>();

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
    },
  });

  // --- State ---
  activeTab = signal<Tab>('recommended');
  settingsOpen = signal(false);

  selectedFileId = signal<number | null>(null);
  audioUrl = signal('');
  localFile = signal<File | null>(null);
  isDragging = signal(false);

  // Settings
  outputFormat = signal<OutputFormat>('plain');
  speakerDiarization = signal(false);

  // --- Data ---
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'url', label: 'URL' },
    { id: 'local', label: 'Local file' },
  ];

  // --- Computed ---
  canUpload = computed(() => {
    switch (this.activeTab()) {
      case 'recommended':
        return this.selectedFileId() !== null;
      case 'url':
        return this.audioUrl().trim().length > 0;
      case 'local':
        return this.localFile() !== null;
    }
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.localFile.set(file);
  }

  close(): void {
    this.closed.emit();
  }

  upload(): void {
    // TODO handle upload
  }

  // Close settings popover on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.settingsOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[data-settings-popover]') && !target.closest('[data-settings-btn]')) {
      this.settingsOpen.set(false);
    }
  }
}

export interface AudioSelectionResult {
  audioFile: AudioFile | null;
  type: 'url' | 'file' | 'recommended';
}

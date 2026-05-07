import { Component, effect, model, signal } from '@angular/core';
import { AudioFile } from '../../model/audiofile';
import { Note } from '../../model/pitch';
import { FileSelectorComponent } from '../fileselector/fileselector.component';
import { ModalComponent } from '../modal/modal.component';
import { OrDividerComponent } from '../or-divider/or-divider.component';
import { RecommendedFilesComponent } from '../recommendedfiles/recommendedfiles.component';
import { SettingsComponent, SettingsResult } from '../settings/settings.component';
import { UrlSelectorComponent } from '../urlselector/urlselector.component';

@Component({
  selector: 'cq-audio-selection-modal',
  imports: [
    ModalComponent,
    OrDividerComponent,
    RecommendedFilesComponent,
    UrlSelectorComponent,
    SettingsComponent,
    FileSelectorComponent,
  ],
  templateUrl: './audio-selection-modal.component.html',
  styleUrl: './audio-selection-modal.component.scss',
})
export class AudioSelectionModalComponent {
  readonly open = model(false);
  protected readonly selectedTab = signal<'recommended' | 'url' | 'file'>('recommended');
  protected readonly settingsOpen = signal(false);

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

  constructor() {
    effect(() => {
      const selectedFile = this.selectedFile();
      console.log('Selected file:', selectedFile);
    });
  }

  /*
  let selectedRec = null;
  let toggleOn = false;
  let settingsOpen = false;

  function showTab(tab) {

    tabs.forEach(t => {
      const panel = document.getElementById('panel-' + t);
      const btn = document.getElementById('tab-' + t);
      if (t === tab) {
        panel.classList.remove('hidden');
        btn.classList.remove('border-transparent', 'text-gray-400');
        btn.classList.add('border-blue-600', 'text-blue-600');
      } else {
        panel.classList.add('hidden');
        btn.classList.add('border-transparent', 'text-gray-400');
        btn.classList.remove('border-blue-600', 'text-blue-600');
      }
    });
  }

  function selectRec(n) {
    [1, 2, 3].forEach(i => {
      const el = document.getElementById('rec-' + i);
      const icon = document.getElementById('rec-' + i + '-icon');
      if (i === n) {
        el.classList.add('border-blue-500', 'bg-blue-50');
        el.classList.remove('border-gray-100', 'bg-gray-50');
        icon.className = 'ti ti-circle-check text-blue-600 text-lg shrink-0';
      } else {
        el.classList.remove('border-blue-500', 'bg-blue-50');
        el.classList.add('border-gray-100', 'bg-gray-50');
        icon.className = 'ti ti-circle text-gray-300 text-lg shrink-0';
      }
    });
    selectedRec = n;
  }

  function toggleSettings() {
    settingsOpen = !settingsOpen;
    document.getElementById('settings-popover').classList.toggle('hidden', !settingsOpen);
  }

  function toggleSwitch() {
    toggleOn = !toggleOn;
    const toggle = document.getElementById('toggle');
    const thumb = document.getElementById('thumb');
    if (toggleOn) {
      toggle.classList.remove('bg-gray-200');
      toggle.classList.add('bg-blue-600');
      thumb.classList.remove('left-0.5');
      thumb.classList.add('left-4');
    } else {
      toggle.classList.add('bg-gray-200');
      toggle.classList.remove('bg-blue-600');
      thumb.classList.add('left-0.5');
      thumb.classList.remove('left-4');
    }
  }

  function closeModal() {
    document.querySelector('.fixed').classList.add('hidden');
  }

  // Close popover when clicking outside
  document.addEventListener('click', function (e) {
    const popover = document.getElementById('settings-popover');
    const btn = document.getElementById('settings-btn');
    if (settingsOpen && !popover.contains(e.target) && !btn.contains(e.target)) {
      settingsOpen = false;
      popover.classList.add('hidden');
    }
  });
*/
}

export interface AudioSelectionResult {
  audioFile: AudioFile | null;
  type: 'url' | 'file' | 'recommended';
}

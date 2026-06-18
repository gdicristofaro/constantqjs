import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';
import { AudioFile } from '../../model/audiofile';
import { MegabytesPipe } from '../../pipes/megabytes.pipe';
import { AudioSelectionResult } from '../audio-selection-modal/audio-selection-modal.component';

/**
 * displays recent files and is charge of committing to local storage
 */
@Component({
  selector: 'cq-recommended-files',
  templateUrl: './recommendedfiles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MegabytesPipe],
})
export class RecommendedFilesComponent {
  // the default initial recent files if not previously populated
  private static ITEMS: (AudioFile & { url: string; size: number })[] = [
    {
      filename: 'C maj wav',
      url: './audio/Cmaj.wav',
      size: 1.8 * 1024 * 1024,
    },
    {
      filename: 'Bach Chorale',
      url: 'https://archive.org/download/LauradenardisperformingbachChorale/BachChorale.mp3',
      size: 2.0 * 1024 * 1024,
    },
    {
      filename: 'Fur Elise',
      url: 'https://dn720302.ca.archive.org/0/items/lp_greatest-hits-of_frederic-chopin-ludwig-van-beethoven-jo/disc2%2F03.03.%20For%20Elise.mp3',
      size: 5.1 * 1024 * 1024,
    },
  ];

  readonly selectedFile = model.required<AudioSelectionResult>();

  protected readonly selectedRecommendedUrl = computed(() => {
    const selected = this.selectedFile();
    if (selected?.type === 'recommended' && selected.audioFile && 'url' in selected.audioFile) {
      return selected.audioFile.url;
    }
    return null;
  });

  // a list of audio file items sorted and displayed to user
  get items() {
    return RecommendedFilesComponent.ITEMS;
  }

  /**
   * handles when a user selects a recent file
   * @param item the selected audio file
   */
  onClick(item: AudioFile) {
    this.selectedFile.set({ audioFile: item, type: 'recommended' });
  }
}

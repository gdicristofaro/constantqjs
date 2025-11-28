import { Component, output } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { AudioFile } from '../../model/audiofile';
import { MegabytesPipe } from '../../pipes/megabytes.pipe';

/**
 * displays recent files and is charge of committing to local storage
 */
@Component({
  selector: 'recommended-files',
  templateUrl: './recommendedfiles.component.html',
  imports: [MatChip, MegabytesPipe],
})
export class RecommendedFilesComponent {
  // the default initial recent files if not previously populated
  private static ITEMS: AudioFile[] = [
    {
      filename: 'C maj wav',
      url: './assets/audio/Cmaj.wav',
      size: 1.8 * 1024 * 1024,
    },
    {
      filename: 'Bach Chorale',
      url: 'https://archive.org/download/LauradenardisperformingbachChorale/BachChorale.mp3',
      size: 2.0 * 1024 * 1024,
    },
    {
      filename: 'Bach Invention',
      url: 'https://ia902904.us.archive.org/7/items/BachTwoPartInventionInCMinor/Bach%20-%20Two-part%20Invention%20in%20C%20minor.mp3',
      size: 2 * 1024 * 1024,
    },
  ];

  // the subject where the selected file is notified
  readonly selectedFile = output<AudioFile>();

  // a list of audio file items sorted and displayed to user
  get items() {
    return RecommendedFilesComponent.ITEMS;
  }

  /**
   * handles when a user selects a recent file
   * @param item the selected audio file
   */
  onClick(item: AudioFile) {
    this.selectedFile.emit(item);
  }
}

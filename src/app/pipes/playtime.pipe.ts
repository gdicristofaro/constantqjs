import { Pipe, PipeTransform } from '@angular/core';

/**
 * appropriately formats seconds to a playtime string
 */
@Pipe({
  name: 'playtime',
})
/**
 * Pipe implementation for formatting playback time
 */
export class PlayTimePipe implements PipeTransform {
  // performs transformation converting input string to a delimited string
  /**
   * Transforms seconds to MM:SS.D format (minutes:seconds.tenths)
   * @param {number} value - Time in seconds
   * @returns {string} Formatted time string
   */
  transform(value: number): string {
    return `${Math.floor(value / 60)}:${Math.floor(value % 60)
      .toString()
      .padStart(2, '0')}.${Math.floor((value * 10) % 10).toString()}`;
  }
}

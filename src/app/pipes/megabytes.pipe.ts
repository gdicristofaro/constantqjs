import { Pipe, PipeTransform } from '@angular/core';

/**
 * pipe to format number of bytes into megabytes (as well as KB, GB, etc.)
 */
@Pipe({
  name: 'megabytes',
})
// taken from here: https://stackoverflow.com/a/18650828/2375948
/**
 * Pipe implementation for formatting byte sizes
 */
export class MegabytesPipe implements PipeTransform {
  /**
   * Transforms bytes to human-readable file size (bytes, KB, MB, GB, TB, PB)
   * @param {number} bytes - Size in bytes
   * @param {number} [precision] - Decimal precision (default 1)
   * @returns {string} Formatted file size string
   */
  transform(bytes: number, precision: number | undefined = undefined): string {
    if (isNaN(bytes) || !isFinite(bytes)) {
      return '-';
    }
    if (precision === undefined) {
      precision = 1;
    }
    const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
      number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
  }
}

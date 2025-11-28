import { Pipe, PipeTransform } from '@angular/core';

/**
 * appropriately formats seconds to a playtime string
 */
@Pipe({
  name: 'playTime',
})
export class PlayTimePipe implements PipeTransform {
  // performs transformation converting input string to a delimited string
  transform(value: number): string {
    return playTimeFunct(value);
  }
}

/**
 * externalized function for use in performing playtime formatting
 * @param value     the value of the play time in seconds
 * @returns time formatted in MM:SS.00
 */
export const playTimeFunct = (value: number) => {
  return `${Math.floor(value / 60)}:${(value % 60).toLocaleString(
    undefined, // leave undefined to use the visitor's browser
    // locale or a string like 'en-US' to override it.
    { minimumFractionDigits: 2 },
  )}`;
};

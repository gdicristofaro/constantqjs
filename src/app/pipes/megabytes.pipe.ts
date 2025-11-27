import { Pipe, PipeTransform } from '@angular/core';

/**
 * pipe to format number of bytes into megabytes (as well as KB, GB, etc.)
 */
@Pipe({
  name: 'megabytes'
})
// taken from here: https://stackoverflow.com/a/18650828/2375948
export class MegabytesPipe implements PipeTransform {
	transform(bytes, precision) {
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		if (typeof precision === 'undefined') precision = 1;
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
	}
}

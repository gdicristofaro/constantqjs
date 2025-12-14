import Complex from './complex';

/**
 * represents an entry in the sparse kernel:
 * the fft index to multiply by and the complex multiplier
 */

export class KernelEntry {
  // the index within the fft to utilize
  readonly fftIndex: number;
  // the multiplier to use
  readonly multiplier: Complex;

  /**
   * creates a new KernelEntry item
   * @param fftIndex      the index within the fft to utilize
   * @param multiplier    the multiplier to apply to this index
   */
  constructor(fftIndex: number, multiplier: Complex) {
    this.fftIndex = fftIndex;
    this.multiplier = multiplier;
  }

  /**
   * the string representation of this KernelEntry
   */
  public toString() {
    return '{ Index: ' + this.fftIndex + ', Multiplier: ' + this.multiplier + ' }';
  }
}

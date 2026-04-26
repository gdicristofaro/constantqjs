import { KernelEntry } from './kernelentry';

/**
 * represents the sparse kernel to apply to the fft in order to determine pitch data
 * taken from http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
 */

export class SparseKernel {
  // the 2-d array of kernel entry information
  // 1st index represents the bin
  // the nested array are the lists of kernel entries to apply to the fft
  readonly matrix: KernelEntry[][];

  // the size of the fft to use for this sparse kernel to properly apply
  readonly size: number;

  // the number of bins
  readonly bins: number;

  /**
   * creates a sparse kernel
   * @param matrix    the 2-d array of kernel entry information
   * @param size      the size of the fft to use for this parse kernel
   * @param bins      the number of bins
   */
  constructor(matrix: KernelEntry[][], size: number, bins: number) {
    this.matrix = matrix;
    this.size = size;
    this.bins = bins;
  }

  /**
   * a string representation of this sparse kernel
   */
  toString() {
    let str = `Complex { size: ${this.size}, bins: ${this.bins} matrix: \n[`;
    for (const row of this.matrix) str += `\n[${row.join(', ')}]`;

    str += '] }';
    return str;
  }
}

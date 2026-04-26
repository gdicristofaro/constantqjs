import Complex from '../../model/complex';
import {
  DEFAULT_BINS,
  DEFAULT_MAX_FREQ,
  DEFAULT_MIN_FREQ,
  DEFAULT_THRESH,
} from '../../model/defaults';
import { KernelEntry } from '../../model/kernelentry';
import { SparseKernel } from '../../model/sparsekernel';
import { fft, hamming, nextPow2 } from './mathutil';

/**
 * performs constant q operations
 */
export default class ConstantQ {
  /**
   * creates a sparse kernel per
   * http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
   *
   * @param fs        frames per second
   * @param minFreq   the minimum frequency to use
   * @param maxFreq   the maximum frequency to use
   * @param bins      the number of bins per octave
   * @param thresh    the threshold
   * @returns         the generated sparse kernel
   */
  static sparseKernel(
    fs: number,
    minFreq: number = DEFAULT_MIN_FREQ.frequency,
    maxFreq: number = DEFAULT_MAX_FREQ.frequency,
    bins: number = DEFAULT_BINS,
    thresh: number = DEFAULT_THRESH,
  ) {
    const Q = 1 / (Math.pow(2, 1 / bins) - 1);
    const K = Math.ceil(bins * Math.log2(maxFreq / minFreq));
    const fftLen = Math.floor(Math.pow(2, nextPow2(Math.ceil(Math.ceil((Q * fs) / minFreq)))));

    const tempKernel = new Array<Complex>(fftLen);
    for (let i = 0; i < fftLen; i++) tempKernel[i] = Complex.ZERO;

    const retMatrix = new Array<KernelEntry[]>(K);

    for (let k = K; k >= 1; k--) {
      const len = Math.ceil((Q * fs) / (minFreq * Math.pow(2, (k - 1) / bins)));

      const hammingWindow = hamming(len);
      for (let i = 0; i < len; i++)
        tempKernel[i] = hammingWindow[i]
          .divNum(len)
          .multComp(Complex.euler((2 * Math.PI * Q * i) / len));

      // ensure that temp kernel is zero'd out for rest
      for (let i = len; i < fftLen; i++) tempKernel[i] = Complex.ZERO;

      fft(tempKernel);
      const newItems = new Array<KernelEntry>();
      // create an entry only if item is over threshold
      for (let i = 0; i < tempKernel.length; i++) {
        if (tempKernel[i].abs() > thresh)
          // apply conjugate & divide by fftlen
          newItems.push(new KernelEntry(i, tempKernel[i].conjugate().divNum(fftLen)));
      }

      retMatrix[k - 1] = newItems;
    }

    return new SparseKernel(retMatrix, fftLen, K);
  }

  /**
   * performs constant q analysis given the amplitude data and the sparse kernel
   * @param arr           the array of amplitude data (destructively alters arr)
   * @param sparKernel    the sparse kernel to utilize
   * @returns             the generated array
   */
  static constantQ(arr: Complex[], sparKernel: SparseKernel) {
    fft(arr, sparKernel.size);

    const toRet = new Array<Complex>(sparKernel.bins);
    for (let b = 0; b < sparKernel.bins; b++) {
      let tot = Complex.ZERO;

      for (const entr of sparKernel.matrix[b])
        tot = tot.add(arr[entr.fftIndex].multComp(entr.multiplier));

      toRet[b] = tot;
    }

    return toRet;
  }

  // possible means of utilizing fft data created from analyzer node to
  // generate constant q
  // warning: not quite functional
  // static uintFftConstantQ(
  //     arr : Uint8Array,
  //     sparKernel : SparseKernel,
  //     cached : Array<number>) : number[] {

  //     let toRet = (cached) ? cached : new Array<number>(sparKernel.bins);

  //     for (let b = 0; b < sparKernel.bins; b ++) {
  //         let tot = Complex.ZERO;

  //         for (let entr of sparKernel.matrix[b])
  //             tot = tot.add(new Complex(arr[entr.fftIndex], 0).multComp(entr.multiplier));
  //             //tot = tot.add(entr.multiplier.multNum(arr[entr.fftIndex]));

  //         toRet[b] = tot.abs();
  //     }

  //     return toRet;
  // }
}

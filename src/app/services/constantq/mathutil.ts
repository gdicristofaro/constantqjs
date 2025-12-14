import Complex from '../../model/complex';

/**
 * Math utilities for DSP and Constant Q algorithm
 */

/**
 * compute the FFT of x[], assuming its length is a power of 2
 * place results in x
 * taken from: https://introcs.cs.princeton.edu/java/97data/InplaceFFT.java.html
 * based on: https://introcs.cs.princeton.edu/java/97data/FFT.java.html
 * and https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
 *
 * @param x     the complex number array in which to perform fft
 * @param n     the length of the array to perform fft (if undefined, the length of x)
 */
export function fft(x: Complex[], n: number | undefined = undefined) {
  if (!n) {
    n = x.length;
  }

  // check that length is a power of 2
  const binary = n.toString(2);
  for (let i = 1; i < binary.length; i++)
    if (binary.charAt(i) === '1') throw 'n is not a power of 2';

  // bit reversal permutation
  const shift = 32 - n.toString(2).length + 1;
  for (let k = 0; k < n; k++) {
    var jStr = k.toString(2);
    while (jStr.length < 32 - shift) jStr = '0' + jStr;
    const j = parseInt(jStr.split('').reverse().join(''), 2);
    if (j > k) {
      const temp = x[j];
      x[j] = x[k];
      x[k] = temp;
    }
  }

  // butterfly updates
  for (let L = 2; L <= n; L = L + L) {
    for (let k = 0; k < L / 2; k++) {
      const kth = (-2 * k * Math.PI) / L;
      const w = new Complex(Math.cos(kth), Math.sin(kth));
      for (let j = 0; j < n / L; j++) {
        const tao = w.multComp(x[j * L + k + L / 2]);
        x[j * L + k + L / 2] = x[j * L + k].sub(tao);
        x[j * L + k] = x[j * L + k].add(tao);
      }
    }
  }
}

/**
 * gets the log base 2 of number (rounded up)
 * based on http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
 * @param num   the number
 * @returns     the log base 2 of number (rounded up)
 */
export function nextPow2(num: number) {
  return Math.floor(Math.ceil(Math.log2(Math.floor(num))));
}

/**
 * generates a hamming window of length len
 * taken from https://www.mathworks.com/help/signal/ref/hamming.html
 * @param len       the length of the hamming window
 * @returns         the hamming window
 */
export function hamming(len: number) {
  len = Math.floor(len);

  if (len <= 0) {
    throw 'length must be > 0';
  }

  if (len == 1) {
    return [Complex.ONE];
  }

  const window = new Array<Complex>(len);
  const N = len - 1;
  for (let n = 0; n < len; n++)
    window[n] = new Complex(0.54 - 0.46 * Math.cos((2 * Math.PI * n) / N), 0);

  return window;
}

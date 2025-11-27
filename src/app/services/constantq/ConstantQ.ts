import { Note, getPitch } from './Pitch';
import Complex from './Complex';

/**
 * Math utilities for DSP and Constant Q algorithm
 */
class MathUtil {
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
    static fft(x : Complex[], n : number = undefined) {
        if (!n)
            n = x.length;

        // check that length is a power of 2
        const binary = n.toString(2);
        for (let i = 1; i < binary.length; i++)
            if (binary.charAt(i) === '1')
                throw "n is not a power of 2";

        // bit reversal permutation
        const shift = 32 - n.toString(2).length  + 1;
        for (let k = 0; k < n; k++) {
            var jStr = k.toString(2);
            while (jStr.length < (32 - shift))
                jStr = "0" + jStr;
            const j = parseInt(jStr.split('').reverse().join(''), 2);
            if (j > k) {
                const temp = x[j];
                x[j] = x[k];
                x[k] = temp;
            }
        }

        // butterfly updates
        for (let L = 2; L <= n; L = L+L) {
            for (let k = 0; k < L/2; k++) {
                const kth = -2 * k * Math.PI / L;
                const w = new Complex(Math.cos(kth), Math.sin(kth));
                for (let j = 0; j < n/L; j++) {
                    const tao = w.multComp(x[j*L + k + L/2]);
                    x[j*L + k + L/2] = x[j*L + k].sub(tao);
                    x[j*L + k]       = x[j*L + k].add(tao);
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
    static nextPow2(num : number) {
        return Math.floor(Math.ceil(Math.log2(Math.floor(num))));
    }

    /**
     * generates a hamming window of length len
     * taken from https://www.mathworks.com/help/signal/ref/hamming.html
     * @param len       the length of the hamming window
     * @returns         the hamming window
     */
    static hamming(len : number) {
        len = Math.floor(len);
        
        if (len <= 0)
            throw "length must be > 0";

        if (len == 1)
            return [Complex.ONE];

        const window = new Array<Complex>(len);
        const N = len - 1;
        for (let n = 0; n < len; n++)
            window[n] = new Complex(.54 - .46 * Math.cos(2 * Math.PI * n / N), 0);

        return window;
    }
}


/**
 * represents an entry in the sparse kernel:
 * the fft index to multiply by and the complex multiplier
 */
export class KernelEntry {
    // the index within the fft to utilize
    readonly fftIndex : number;
    // the multiplier to use
    readonly multiplier : Complex;

    /**
     * creates a new KernelEntry item
     * @param fftIndex      the index within the fft to utilize
     * @param multiplier    the multiplier to apply to this index
     */
    constructor(fftIndex : number, multiplier : Complex) {
        this.fftIndex = fftIndex;
        this.multiplier = multiplier;
    }

    /**
     * the string representation of this KernelEntry
     */
    public toString() {
        return "{ Index: " + this.fftIndex + ", Multiplier: " + this.multiplier + " }";
    }
}


/**
 * represents the sparse kernel to apply to the fft in order to determine pitch data
 * taken from http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
 */
export class SparseKernel {
    // the 2-d array of kernel entry information
    // 1st index represents the bin
    // the nested array are the lists of kernel entries to apply to the fft
    readonly matrix : Array<Array<KernelEntry>>;

    // the size of the fft to use for this sparse kernel to properly apply
    readonly size : number;

    // the number of bins
    readonly bins : number;

    /**
     * creates a sparse kernel
     * @param matrix    the 2-d array of kernel entry information
     * @param size      the size of the fft to use for this parse kernel
     * @param bins      the number of bins
     */
    constructor(matrix : Array<Array<KernelEntry>>, size : number, bins : number) {
        this.matrix = matrix;
        this.size = size;
        this.bins = bins;
    }

    /**
     * a string representation of this sparse kernel
     */
    toString() {
        let str = `Complex { size: ${this.size}, bins: ${this.bins} matrix: \n[`;
        for (let row of this.matrix)
            str += `\n[${row.join(", ")}]`;

        str += "] }";
        return str;
    }
}


/**
 * performs constant q operations 
 */
export default class ConstantQ {
    // the default threshold taken from: 
    // http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
    static DEFAULT_THRESH = 0.0054;

    static DEFAULT_FPS = 16;

    // the default number of bins (12 pitches in an octave multiplied by 2 for accuracy)
    static DEFAULT_BINS = 24;
    
    // default minimum frequency to utilize
    static DEFAULT_MIN_FREQ = getPitch(Note.C, 2);

    // default maximum frequency to utilize
    static DEFAULT_MAX_FREQ = getPitch(Note.C, 6);

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
    static sparseKernel(fs : number, 
        minFreq : number = ConstantQ.DEFAULT_MIN_FREQ.frequency, 
        maxFreq : number = ConstantQ.DEFAULT_MAX_FREQ.frequency, 
        bins : number = ConstantQ.DEFAULT_BINS, 
        thresh : number = ConstantQ.DEFAULT_THRESH) {

        const Q = 1. / (Math.pow(2, 1./bins) - 1);
        const K = Math.ceil(bins * Math.log2(maxFreq / minFreq));
        const fftLen = Math.floor(Math.pow(2, MathUtil.nextPow2(Math.ceil(Math.ceil(Q * fs / minFreq)))));

        const tempKernel = new Array<Complex>(fftLen);
        for (let i = 0; i < fftLen; i++)
            tempKernel[i] = Complex.ZERO;

        const retMatrix = new Array<Array<KernelEntry>>(K);

        for (let k = K; k >= 1; k--) {
            const len = Math.ceil((Q * fs) / (minFreq * Math.pow(2, ((k - 1) / bins))));

            const hamming = MathUtil.hamming(len);
            for (let i = 0; i < len; i++)
                tempKernel[i] = hamming[i].divNum(len).multComp(Complex.euler(2 * Math.PI * Q * i / len));

            // ensure that temp kernel is zero'd out for rest
            for (let i = len; i < fftLen; i++)
                tempKernel[i] = Complex.ZERO;

            MathUtil.fft(tempKernel);
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
    static constantQ(arr : Complex[], sparKernel : SparseKernel) {
        MathUtil.fft(arr, sparKernel.size);

        const toRet = new Array<Complex>(sparKernel.bins);
        for (let b = 0; b < sparKernel.bins; b ++) {
            let tot = Complex.ZERO;

            for (let entr of sparKernel.matrix[b])
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
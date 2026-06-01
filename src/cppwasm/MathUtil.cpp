/**
 * Math utility implementations for DSP operations
 * @file MathUtil.cpp
 *
 * Contains FFT, windowing, and helper functions for Constant-Q transform
 */

#include <math.h>
#include <cassert>
#include <complex>
#include <vector>
#include <cmath>
#include <string>
#include "MathUtil.hpp"

using namespace std;

namespace constantq
{
    /**
     * Counts leading zero bits using bit shifting.
     * Iterates through bits from MSB to LSB until a 1-bit is found.
     * @param x The unsigned integer value
     * @return Number of leading zero bits
     */
    unsigned int MathUtil::leadingZeros(unsigned int x)
    {
        const unsigned bits = sizeof(x) * 8;
        unsigned i = 0;
        for (; i < bits; i++)
        {
            if (x == 0)
                break;

            x >>= 1;
        }
        return bits - i;
    }

    /**
     * Reverses the bit order of a 32-bit unsigned integer.
     * Used for bit-reversal permutation required by Cooley-Tukey FFT.
     *
     * For example: 0101 becomes 1010 (for 4-bit representation)
     *
     * @param num The unsigned integer to reverse
     * @return The bit-reversed value
     */
    unsigned int MathUtil::reverse(unsigned int num)
    {
        unsigned int NO_OF_BITS = sizeof(num) * 8;
        unsigned int reverse_num = 0, i, temp;

        for (i = 0; i < NO_OF_BITS; i++)
        {
            temp = (num & (1 << i));
            if (temp)
                reverse_num |= (1 << ((NO_OF_BITS - 1) - i));
        }

        return reverse_num;
    }

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
    void MathUtil::fft(vector<complex<double>> &x, size_t n)
    {
        assert(x.size() >= n);

        // verify n is a power of 2
        assert((ceil(log2(n)) == floor(log2(n))));

        // bit reversal permutation
        unsigned int shift = 1 + leadingZeros(n);
        for (unsigned int k = 0; k < n; k++)
        {
            unsigned int j = reverse(k) >> shift;
            if (j > k)
            {
                complex<double> temp = x[j];
                x[j] = x[k];
                x[k] = temp;
            }
        }

        // butterfly updates
        for (size_t L = 2; L <= n; L = L + L)
        {
            for (size_t k = 0; k < L / 2; k++)
            {
                double kth = M_PI * -2 * k / L;
                auto w = complex<double>(cos(kth), sin(kth));
                for (size_t j = 0; j < n / L; j++)
                {
                    auto tao = w * (x[j * L + k + L / 2]);
                    x[j * L + k + L / 2] = x[j * L + k] - tao;
                    x[j * L + k] = x[j * L + k] + tao;
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
    int MathUtil::nextPow2(double num)
    {
        return (int)floor(ceil(log2(floor(num))));
    }

    /**
     * generates a hamming window of length len
     * taken from https://www.mathworks.com/help/signal/ref/hamming.html
     * @param len       the length of the hamming window
     * @returns         the hamming window
     */
    vector<complex<double>> MathUtil::hamming(size_t len)
    {
        vector<complex<double>> window(len);

        if (len == 1)
        {
            window[0] = 1;
        }
        else
        {
            auto N = len - 1;
            for (size_t n = 0; n < len; n++)
            {
                window[n] = .54 - .46 * cos(2 * M_PI * n / N);
            }
        }

        return window;
    }

    /**
     * evaluates e^(iMult * i)
     * Based on Euler's formula:
     * https://en.wikipedia.org/wiki/Euler%27s_formula
     *
     * @param iMult  iMultiplier to multiply times i
     * @return the complex number evaluation
     */
    complex<double> MathUtil::eulers(double num)
    {
        return complex<double>(cos(num), sin(num));
    }
}

#pragma once
#include <complex>
#include <vector>
#include <string>

namespace constantq
{
    /**
     * Utility functions for DSP operations used in Constant-Q transform
     * Includes FFT, windowing, complex number operations, and helper functions
     */
    class MathUtil
    {
    public:
        /**
         * Counts the number of leading zero bits in a 32-bit integer
         * @param x The unsigned integer value
         * @return The number of leading zeros
         */
        static unsigned int leadingZeros(unsigned int x);

        /**
         * Reverses the bit order of a 32-bit integer
         * Used for bit-reversal permutation in FFT algorithm
         * @param num The unsigned integer to reverse
         * @return The bit-reversed value
         */
        static unsigned int reverse(unsigned int num);

        /**
         * Computes in-place Fast Fourier Transform of complex number array
         * Input array must have length that is a power of 2
         * Based on Cooley-Tukey FFT algorithm with bit-reversal permutation
         * @param x The array of complex numbers (modified in-place)
         * @param n The length of the array to transform
         */
        static void fft(std::vector<std::complex<double>> &x, size_t n);

        /**
         * Calculates the next power of 2 greater than or equal to the input
         * @param num The input number
         * @return The smallest k such that 2^k >= num
         */
        static int nextPow2(double num);

        /**
         * Generates a Hamming window of specified length
         * Window values calculated as: 0.54 - 0.46 * cos(2*pi*n/N)
         * @param len The length of the window
         * @return Complex vector containing the Hamming window coefficients
         */
        static std::vector<std::complex<double>> hamming(size_t len);

        /**
         * Evaluates Euler's formula: e^(i*num) = cos(num) + i*sin(num)
         * @param num The real exponent value
         * @return Complex number representing e^(i*num)
         */
        static std::complex<double> eulers(double num);
    };
}

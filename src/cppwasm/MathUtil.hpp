#pragma once
#include <complex>
#include <vector>
#include <string>

namespace constantq {
    /**
     * Math utilities for DSP and Constant Q algorithm
     */
    class MathUtil {
        public:
            static unsigned int leadingZeros(unsigned int x);
            static unsigned int reverse(unsigned int num);
            static void fft(std::vector<std::complex<double> >& x, int n);
            static int nextPow2(double num);
            static std::vector<std::complex<double> > hamming(int len);
            static std::complex<double> eulers(double num);
    };
}

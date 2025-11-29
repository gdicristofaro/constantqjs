#pragma once
#include <complex>
#include <string>

namespace constantq {
    class KernelEntry {
        private:
            // the index within the fft to utilize
            int _fftIndex;
            // the multiplier to use
            std::complex<double> _multiplier;
            
        public:
            /**
             * creates a new KernelEntry item
             * @param fftIndex      the index within the fft to utilize
             * @param multiplier    the multiplier to apply to this index
             */
            KernelEntry(int fftIndex, std::complex<double> multiplier);

            /**
             * the string representation of this KernelEntry
             */
            std::string toString();
            
            std::complex<double> multiplier() const;
            int fftIndex() const;
    };
}
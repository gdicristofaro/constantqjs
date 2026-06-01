/**
 * Implementation of individual kernel entry for sparse kernel matrix
 * @file KernelEntry.cpp
 *
 * Represents one contributing FFT bin to a frequency bin in the Constant-Q transform.
 */

#include <complex>
#include <cmath>
#include <string>
#include <stdio.h>
#include "KernelEntry.hpp"

using namespace std;

namespace constantq
{
    complex<double> KernelEntry::multiplier() const { return _multiplier; }
    size_t KernelEntry::fftIndex() const { return _fftIndex; }

    KernelEntry::KernelEntry(size_t fftIndex, complex<double> multiplier)
    {
        _fftIndex = fftIndex;
        _multiplier = multiplier;
    }

    /**
     * Generates string representation for debugging
     * @return Human-readable string with index and multiplier values
     */
    string KernelEntry::toString()
    {
        ostringstream stringStream;
        stringStream << "{ Index: " << _fftIndex << ", Multiplier: "
                     << _multiplier.real() << " + " << _multiplier.imag() << "i }";

        return stringStream.str();
    }
};
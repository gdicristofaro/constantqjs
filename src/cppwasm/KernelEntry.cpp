#include <complex>
#include <cmath>
#include <string>
#include <stdio.h>
#include "KernelEntry.hpp"

using namespace std;

namespace constantq {
    complex<double> KernelEntry::multiplier() const { return _multiplier; }
    int KernelEntry::fftIndex() const { return _fftIndex; }

    KernelEntry::KernelEntry(int fftIndex, complex<double> multiplier) {
        _fftIndex = fftIndex;
        _multiplier = multiplier;
    }

    string KernelEntry::toString() {
        ostringstream stringStream;
        stringStream << "{ Index: " << _fftIndex << ", Multiplier: " 
            << _multiplier.real() << " + " << _multiplier.imag() << "i }";

        return stringStream.str();
    }
};
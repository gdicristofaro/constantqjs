#pragma once

#include <vector>
#include <complex>
#include <cmath>
#include "SparseKernel.hpp"

using namespace std;

inline void insertSin(vector<complex<double>> &buff, size_t fps, double maxAmplitude, double freq)
{
    auto sz = buff.size();
    for (size_t x = 0; x < sz; x++)
        buff[x] += maxAmplitude * sin(M_PI * x * 2 * freq / fps);
}

inline vector<complex<double>> generateSin(size_t size, int freq)
{
    vector<complex<double>> toGen(size, 0);
    insertSin(toGen, size, 10, freq);
    return toGen;
}

// Declaration for the complex expected kernel builder used by tests.
constantq::SparseKernel testSparseKernel();

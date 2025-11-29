#include <math.h>
#include <complex>
#include <vector>
#include <cmath>
#include <iostream>

#include "ConstantQ.hpp"
#include "KernelEntry.hpp"
#include "SparseKernel.hpp"
#include "MathUtil.hpp"


using namespace std;

namespace constantq {
    SparseKernel ConstantQ::sparseKernel(
        int fs, double minFreq, double maxFreq, int bins, double thresh) {

        double Q = 1. / (pow(2, 1./bins) - 1);
        double K = ceil(bins * log2(maxFreq / minFreq));
        double fftLen = floor(pow(2, MathUtil::nextPow2(ceil(ceil(Q * fs / minFreq)))));
        auto COMPLEX_I = complex<double>(0,1);

        // holds values of intermediate processing             
        vector<complex<double> > tempKernel(fftLen, 0);

        // the matrix to return as the information holder for the sparse kernel
        vector<vector<KernelEntry> > retMatrix(K);

        for (auto k = K; k >= 1; k--) {
            double len = ceil((Q * fs) / (minFreq * pow(2, ((k - 1) / bins))));

            auto hamming = MathUtil::hamming(len);
            for (int j = 0; j < len; j++) {
                double expMultiplier = 2. * M_PI * Q * j / len;
                complex<double> eulersMultiplier = MathUtil::eulers(expMultiplier);
                complex<double> hammingMultiplier = hamming[j] / len;
                tempKernel[j] = hammingMultiplier * eulersMultiplier;
            }
                
            // ensure that temp kernel is zero'd out for rest
            for (int j = floor(len); j < fftLen; j++)
                tempKernel[j] = 0;

            int tempKernelSize = tempKernel.size();
            MathUtil::fft(tempKernel, tempKernelSize);
            vector<KernelEntry> newItems;
            // create an entry only if item is over threshold
            for (auto j = 0; j < tempKernelSize; j++) {
                if (abs(tempKernel[j]) > thresh) {
                    // apply conjugate & divide by fftlen
                    newItems.push_back(KernelEntry(j, conj(tempKernel[j]) / fftLen));
                }
            }

            retMatrix[k - 1] = newItems;
        }

        return SparseKernel(retMatrix, fftLen, K);
    }


    void ConstantQ::constantQ(
        vector<complex<double> >& arr, 
        vector<complex<double> >& analyzed, 
        SparseKernel sparKernel) {

        assert(arr.size() >= sparKernel.size());
        MathUtil::fft(arr, sparKernel.size());

        auto binSize = sparKernel.bins();
        for (int b = 0; b < binSize; b ++) {
            complex<double> tot = 0;

            auto sparKernelItem = sparKernel.matrix()[b];
            auto sparKernelSize = sparKernelItem.size();

            for (int e = 0; e < sparKernelSize; e++) {
                auto entr = sparKernelItem[e];
                complex<double> multiplier = arr[entr.fftIndex()] * entr.multiplier();
                tot += multiplier;
            }

            analyzed[b] = tot;
        }
    }
}
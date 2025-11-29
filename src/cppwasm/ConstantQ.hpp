#pragma once
#include <vector>
#include "SparseKernel.hpp"
#include "MathUtil.hpp"

namespace constantq {

    /**
     * performs constant q operations 
     */
    class ConstantQ {
        public:
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
            static SparseKernel sparseKernel(int fs, double minFreq, double maxFreq, int bins, double thresh);

            /**
             * performs constant q analysis given the amplitude data and the sparse kernel
             * @param arr           the array of amplitude data (destructively alters arr)
             * @param toRet         the array that will contain results (must be sparKernel bin size)
             * @param sparKernel    the sparse kernel to utilize
             * @returns             the generated array
             */
            static void constantQ(
                std::vector<std::complex<double> >& arr, 
                std::vector<std::complex<double> >& analyzed, 
                SparseKernel sparKernel);
    };
}
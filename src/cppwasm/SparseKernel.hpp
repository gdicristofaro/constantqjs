#pragma once
#include <vector> 
#include <string>
#include "KernelEntry.hpp"

namespace constantq {
    /**
     * represents the sparse kernel to apply to the fft in order to determine pitch data
     * taken from http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
     */
    class SparseKernel {
        // the 2-d array of kernel entry information
        // 1st index represents the bin
        // the nested array are the lists of kernel entries to apply to the fft
        std::vector<std::vector<KernelEntry> > _matrix;

        // the size of the fft to use for this sparse kernel to properly apply
        int _size;

        // the number of bins
        int _bins;

        public:
            /**
             * creates a sparse kernel
             * @param matrix    the 2-d array of kernel entry information
             * @param size      the size of the fft to use for this parse kernel
             * @param bins      the number of bins
             */
            std::vector<std::vector<KernelEntry> > matrix() const;
            int size();
            int bins();

            SparseKernel(std::vector<std::vector<KernelEntry> > matrix, int size, int bins);

            /**
             * a string representation of this sparse kernel
             */
            std::string toString();
    };
        
}
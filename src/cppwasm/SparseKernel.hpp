#pragma once
#include <vector>
#include <string>
#include "KernelEntry.hpp"

namespace constantq
{
    /**
     * Represents the sparse kernel matrix for Constant-Q spectral analysis.
     * Encodes which FFT bins contribute to each frequency bin with weighted multipliers.
     * Taken from http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf
     */
    class SparseKernel
    {
        // the 2-d array of kernel entry information
        // 1st index represents the bin
        // the nested array are the lists of kernel entries to apply to the fft
        std::vector<std::vector<KernelEntry>> _matrix;

        // the size of the fft to use for this sparse kernel to properly apply
        size_t _size;

        // the number of bins
        size_t _bins;

    public:
        /**
         * Gets the kernel matrix (2D array of kernel entries)
         * @return The kernel matrix where each row represents a frequency bin
         */
        std::vector<std::vector<KernelEntry>> matrix() const;
        /**
         * Gets the FFT size this kernel is designed for
         * @return The FFT length required for proper operation
         */
        size_t size();
        /**
         * Gets the number of frequency bins in this kernel
         * @return The number of bins
         */
        size_t bins();

        /**
         * Constructor - Creates a new sparse kernel with specified parameters
         * @param matrix The 2D array of kernel entry information
         * @param size The FFT size for this kernel
         * @param bins The number of frequency bins
         */
        SparseKernel(std::vector<std::vector<KernelEntry>> matrix, size_t size, size_t bins);

        /**
         * Generates string representation of this sparse kernel
         * @return Human-readable string describing the kernel matrix structure
         */
        std::string toString();
    };

}
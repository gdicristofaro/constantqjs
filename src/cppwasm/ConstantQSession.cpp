/**
 * Implementation of Constant-Q analysis session management
 * @file ConstantQSession.cpp
 *
 * Manages stateful Constant-Q analysis with cached kernel,
 * supporting multiple analysis methods optimized for different use cases.
 */

#include <optional>
#include <cassert>
#include "ConstantQ.hpp"
#include "SparseKernel.hpp"
#include "ConstantQSession.hpp"
#include <cmath>
#include <cstring>

using namespace std;

namespace constantq
{
    /**
     * Constructor - Initializes session with analysis parameters.
     * Pre-computes sparse kernel used for all subsequent analyses.
     *
     * @param fs Sample rate (e.g., 44100 for CD quality)
     * @param minFreq Minimum frequency in Hz
     * @param maxFreq Maximum frequency in Hz
     * @param bins Frequency bins per octave
     * @param thresh Amplitude threshold for sparse kernel entries
     */
    ConstantQSession::ConstantQSession(size_t fs, double minFreq, double maxFreq,
                                       size_t bins, double thresh) : _cachedKernel(ConstantQ::sparseKernel(fs, minFreq, maxFreq, bins, thresh)) {}

    size_t ConstantQSession::bins() { return _cachedKernel.bins(); }

    size_t ConstantQSession::size() { return _cachedKernel.size(); }

    vector<double> ConstantQSession::analyzeSnapshot(vector<double> data,
                                                     vector<complex<double>> bufferInput,
                                                     vector<complex<double>> bufferOutput,
                                                     size_t startIndex, size_t len)
    {

        vector<double> toRet(_cachedKernel.bins());

        // verify that length to parse from data is the sparse kernel's size
        assert(len >= _cachedKernel.size());
        assert(startIndex + len <= data.size());

        for (size_t i = 0; i < len; i++)
            bufferInput[i] = data[startIndex + i];

        ConstantQ::constantQ(bufferInput, bufferOutput, _cachedKernel);
        for (size_t i = 0; i < bufferOutput.size(); i++)
        {
            toRet[i] = (double)(abs(bufferOutput[i]));
        }

        return toRet;
    }

    vector<vector<double>> ConstantQSession::analyze(vector<double> data,
                                                     size_t startFrame, size_t frameInterval, size_t totalAnalyses)
    {
        assert(data.size() >= startFrame + frameInterval * totalAnalyses);

        // buffers to minimize memory allocation and deallocation
        vector<complex<double>> bufferInput(_cachedKernel.size());
        vector<complex<double>> bufferOutput(_cachedKernel.bins());

        // the vector of vectors to return
        vector<vector<double>> toRet(totalAnalyses);

        auto kernelLen = _cachedKernel.size();
        for (size_t i = 0; i < totalAnalyses; i++)
        {
            toRet[i] = analyzeSnapshot(data, bufferInput, bufferOutput,
                                       startFrame + frameInterval * i, kernelLen);
        }

        return toRet;
    }

    vector<double> ConstantQSession::analyzeToSingle(vector<double> data,
                                                     size_t startFrame, size_t frameInterval, size_t totalAnalyses)
    {
        auto kernelLen = _cachedKernel.size();

        assert(data.size() >= startFrame + kernelLen + frameInterval * (totalAnalyses - 1));

        // buffers to minimize memory allocation and deallocation
        vector<complex<double>> bufferInput(kernelLen);
        vector<complex<double>> bufferOutput(_cachedKernel.bins());

        // the vector of vectors to return
        vector<double> toRet(totalAnalyses * _cachedKernel.bins());

        for (size_t i = 0; i < totalAnalyses; i++)
        {
            auto thisSnapshot = analyzeSnapshot(data, bufferInput, bufferOutput,
                                                startFrame + frameInterval * i, kernelLen);
            memcpy(
                &toRet[0] + _cachedKernel.bins() * i,
                &thisSnapshot[0],
                sizeof(double) * _cachedKernel.bins());
        }

        return toRet;
    }
}

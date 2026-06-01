/**
 * WebAssembly worker entry point for Constant-Q analysis
 * @file ConstantQWorker.cpp
 *
 * Implements the main worker message handler for offloading audio analysis from UI thread.
 * Uses Emscripten to expose C++ functions to JavaScript worker context.
 * Divides audio into segments to provide incremental progress updates to JavaScript.
 */

#include "ConstantQSession.hpp"
#include <cassert>
#include <emscripten/emscripten.h>
#include <optional>

using namespace std;

/**
 * Parameters for Constant-Q analysis passed from JavaScript
 * @struct ConstantQWorkerArgs
 * @member fs Sample rate in Hz
 * @member bins Frequency bins per octave
 * @member frameInterval Samples between consecutive analyses
 * @member progressMessageCount Number of progress updates to emit
 * @member audioDataLen Total length of audio buffer in samples
 * @member minFreq Minimum analysis frequency in Hz
 * @member maxFreq Maximum analysis frequency in Hz
 * @member thresh Sparse kernel amplitude threshold
 */
struct ConstantQWorkerArgs
{
        // done as doubles for consistent input data
        size_t fs;
        size_t bins;
        size_t frameInterval;
        size_t progressMessageCount;
        size_t audioDataLen;
        double minFreq;
        double maxFreq;
        double thresh;
};

/**
 * Parameters defining a segment of audio to analyze
 * @struct ConstantQSegmentWorkerArgs
 * @member sampleLen Number of analyses in this segment
 * @member totalSamples Total analyses across entire audio
 * @member frameInterval Samples between consecutive analyses
 * @member startFrame Starting sample index in audio buffer
 * @member sampleStart Index of first analysis result in output
 * @member isLast Whether this is the final segment
 */
struct ConstantQSegmentWorkerArgs
{
        size_t sampleLen;
        long totalSamples;
        size_t frameInterval;
        size_t startFrame;
        size_t sampleStart;
        bool isLast;
};

/**
 * Return header sent with each analysis result segment
 * @struct ConstantQReturnHeaderArgs
 * @member totalSamples Total number of analyses performed
 * @member bins Number of frequency bins per analysis
 * @member sampleStart Index where this segment's results begin
 */
struct ConstantQReturnHeaderArgs
{
        // done as doubles for consistent return data with audio data
        size_t totalSamples;
        size_t bins;
        size_t sampleStart;
};

extern "C"
{
        /**
         * Sends analysis results to JavaScript via postMessage
         * Uses Emscripten's EM_ASM to create JavaScript view of WebAssembly memory
         *
         * @param headerArgs Metadata about the analysis segment
         * @param evaluated Pointer to analysis results array in WebAssembly heap
         * @param evaluatedlen Length of results array
         * @param isLast Whether this is the final batch
         * @private
         */
        void constantQPostMessage(ConstantQReturnHeaderArgs *headerArgs, double *evaluated, size_t evaluatedlen, bool isLast)
        {

#ifdef DEBUG

                EM_ASM({ console.log('header args: bins', $0, 'sampleStart', $1, 'totalSamples', $2); }, headerArgs->bins, headerArgs->sampleStart, headerArgs->totalSamples);
#endif

                // Pass the pointer and size to EM_ASM
                EM_ASM({
                        var ptr = $0;
                        var length = $1;

                        // Create a view on the WebAssembly heap memory
                        var float64View = new Float64Array(Module.HEAPF64.buffer, ptr, length);

                        // postMessage the array
                        // Note: structured cloning a view creates a copy in JS.
                        self.postMessage({"constantQData" : float64View, "metadata" : {"totalSamples" : $2, "bins" : $3, "sampleStart" : $4}}); }, evaluated, evaluatedlen, headerArgs->totalSamples, headerArgs->bins, headerArgs->sampleStart);
        }
}

/**
 * Analyzes one segment of audio data and sends results to JavaScript.
 * Extracts audio data for segment, performs analysis, and posts results.
 *
 * @param segmentWorkerArgs Parameters for this segment
 * @param curSession Constant-Q session with cached kernel
 * @param audioArrPtr Pointer to audio data in WebAssembly heap
 * @private
 */
void constantQProcessSegment(ConstantQSegmentWorkerArgs segmentWorkerArgs,
                             constantq::ConstantQSession *curSession,
                             double *audioArrPtr)
{

        size_t totalSamples = segmentWorkerArgs.totalSamples;
        size_t sampleLen = segmentWorkerArgs.sampleLen;
        size_t frameInterval = segmentWorkerArgs.frameInterval;
        size_t startFrame = segmentWorkerArgs.startFrame;
        size_t sampleStart = segmentWorkerArgs.sampleStart;
        bool isLast = segmentWorkerArgs.isLast;

        if (sampleLen < 1)
        {
                return;
        }

        auto audioSampleSize = ((sampleLen - 1) * frameInterval) + curSession->size();
        size_t totLen = startFrame + frameInterval * (sampleLen - 1) + curSession->size();

#ifdef DEBUG
        EM_ASM({ console.log('sessionAnalyze: startFrame', $0,
                             'frameInterval', $1,
                             'totalSamples', $2,
                             'sampleStart', $3,
                             'totLen', $4,
                             'bins', $5,
                             'sparse kernel size', $6); }, startFrame, frameInterval, totalSamples, sampleStart, totLen, curSession->bins(), curSession->size());

#endif

        assert(audioSampleSize >= totLen);

        vector<double> audioData(audioArrPtr, audioArrPtr + audioSampleSize);

#ifdef DEBUG
        for (size_t i = 0; i < min(100, audioData.size()); i += 10)
                EM_ASM({ console.log('audio item', $0, $1); }, i, audioData[i]);
#endif

        auto evaluated = curSession->analyzeToSingle(audioData, startFrame, frameInterval, sampleLen);

#ifdef DEBUG
        for (int i = 0; i < 10; i++)
                EM_ASM({ console.log('evaluated item ', $0); }, evaluated[i]);
#endif

        ConstantQReturnHeaderArgs retArgs;
        retArgs.bins = curSession->bins();
        retArgs.sampleStart = sampleStart;
        retArgs.totalSamples = totalSamples;

        constantQPostMessage(&retArgs, &evaluated[0], evaluated.size(), isLast);
}

/**
 * Main Constant-Q processing function.
 * Divides audio into segments and processes each, providing progress updates.
 *
 * Process flow:
 * 1. Creates ConstantQSession with sparse kernel from parameters
 * 2. Divides audio into segments for progress tracking
 * 3. Processes each segment and posts results
 * 4. Emits final completion message when all segments processed
 *
 * @param constantQArgs Analysis parameters
 * @param audioArrPtr Pointer to audio data in WebAssembly heap
 * @private
 */
void constantQProcess(ConstantQWorkerArgs *constantQArgs, const double *audioArrPtr)
{
#ifdef DEBUG
        EM_ASM({ console.log('worker args: fs', $0,
                             'bins', $1,
                             'frameInterval', $2,
                             'progressMessageCount', $3,
                             'audioDataLen', $4,
                             'minFreq', $5,
                             'maxFreq', $6,
                             'thresh', $7); }, constantQArgs->fs, constantQArgs->bins, constantQArgs->frameInterval, constantQArgs->progressMessageCount, constantQArgs->audioDataLen, constantQArgs->minFreq, constantQArgs->maxFreq, constantQArgs->thresh);
#endif

        auto fs = constantQArgs->fs;
        auto minFreq = constantQArgs->minFreq;
        auto maxFreq = constantQArgs->maxFreq;
        auto bins = constantQArgs->bins;
        auto thresh = constantQArgs->thresh;
        auto frameInterval = constantQArgs->frameInterval;
        auto progressMessageCount = constantQArgs->progressMessageCount;
        auto audioDataLen = constantQArgs->audioDataLen;

        // create new ConstantQSession
        constantq::ConstantQSession curSession = constantq::ConstantQSession(fs, minFreq, maxFreq, bins, thresh);

        auto sparseKernelSize = curSession.size();

        vector<double> audioData(audioArrPtr, audioArrPtr + audioDataLen);

        // total number of constantq samplings
        size_t totalSamples = floor(audioData.size() / frameInterval);

#ifdef DEBUG
        for (size_t i = 0; i < min(100, audioData.size()); i += 10)
                EM_ASM({console.log("sparse kernel audio data at ", $0, $1)}, i, audioData[i]);

        EM_ASM({ console.log('sparsekernel: sparseKernelSize', $0,
                             'bins', $1,
                             'frameInterval', $2,
                             'progressMessageCount', $3,
                             'totalSamples', $4,
                             'audioData size', $5); }, sparseKernelSize, bins, frameInterval, progressMessageCount, totalSamples, audioData.size());
#endif

        // the last ending frame
        size_t sampleStart = 0;
        for (size_t w = 0; w < progressMessageCount; w++)
        {
                size_t endingSample = ceil(((((double)w) + 1) / progressMessageCount) * totalSamples);
                size_t sampleLen = endingSample - sampleStart;

                ConstantQSegmentWorkerArgs segmentWorkerArgs;
                segmentWorkerArgs.sampleLen = sampleLen;
                segmentWorkerArgs.totalSamples = totalSamples;
                segmentWorkerArgs.frameInterval = frameInterval;
                segmentWorkerArgs.startFrame = 0;
                segmentWorkerArgs.sampleStart = sampleStart;
                segmentWorkerArgs.isLast = w >= progressMessageCount - 1;

                constantQProcessSegment(segmentWorkerArgs, &curSession, &audioData[sampleStart * frameInterval]);

                sampleStart = endingSample;
        }
}

extern "C"
{
        EMSCRIPTEN_KEEPALIVE
        void constantq_worker_message(const double *arr, size_t len, size_t fs,
                                      double minFreq, double maxFreq, size_t bins, double thresh,
                                      size_t frameInterval, size_t progressMessageCount)
        {

                ConstantQWorkerArgs constantQArgs;
                constantQArgs.fs = fs;
                constantQArgs.minFreq = minFreq;
                constantQArgs.maxFreq = maxFreq;
                constantQArgs.bins = bins;
                constantQArgs.thresh = thresh;
                constantQArgs.frameInterval = frameInterval;
                constantQArgs.progressMessageCount = progressMessageCount;
                constantQArgs.audioDataLen = len;

                constantQProcess(&constantQArgs, arr);
        }
}

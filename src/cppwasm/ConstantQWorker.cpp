#include "ConstantQSession.hpp"
#include <cassert>
#include <emscripten/emscripten.h>
#include <optional>

using namespace std;

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

struct ConstantQSegmentWorkerArgs
{
        size_t sampleLen;
        long totalSamples;
        size_t frameInterval;
        size_t startFrame;
        size_t sampleStart;
        bool isLast;
};

struct ConstantQReturnHeaderArgs
{
        // done as doubles for consistent return data with audio data
        size_t totalSamples;
        size_t bins;
        size_t sampleStart;
};

extern "C"
{
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

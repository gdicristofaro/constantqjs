#include "ConstantQSession.hpp"
#include <cassert>
#include <emscripten/emscripten.h>
#include <optional>

using namespace std;

struct ConstantQWorkerArgs
{
        // done as doubles for consistent input data
        double fs;
        double bins;
        double frameInterval;
        double progressMessageCount;
        double audioDataLen;
        double minFreq;
        double maxFreq;
        double thresh;
};

struct ConstantQSegmentWorkerArgs
{
        int sampleLen;
        int totalSamples;
        int frameInterval;
        int startFrame;
        int sampleStart;
        bool isLast;
};

struct ConstantQReturnHeaderArgs
{
        // done as doubles for consistent return data with audio data
        double totalSamples;
        double bins;
        double sampleStart;
        double sampleLen;
};

extern "C"
{
        void constantQPostMessage(ConstantQReturnHeaderArgs *headerArgs, double *evaluated, int evaluatedlen, bool isLast)
        {

                int retObjSize = sizeof(ConstantQReturnHeaderArgs) + evaluatedlen * sizeof(double);
                // this should be transferred in the post message.
                vector<char> retData(retObjSize);

#ifdef DEBUG

                EM_ASM({ console.log('header args: bins', $0, 'sampleStart', $1, 'totalSamples', $2); }, headerArgs->bins, headerArgs->sampleStart, headerArgs->totalSamples);
#endif

                std::memcpy(&retData[0], headerArgs, sizeof(ConstantQReturnHeaderArgs));
                std::memcpy(&retData[0] + sizeof(ConstantQReturnHeaderArgs), &evaluated[0], sizeof(double) * evaluatedlen);

#ifdef DEBUG
                EM_ASM({ console.log('constantQPostMessage: retObjSize', $0); }, evaluatedlen);

#endif

                // Pass the pointer and size to EM_ASM
                EM_ASM({
                        var ptr = $0;
                        var length = $1;
                        
                        
                        // Create a view on the WebAssembly heap memory
                        var float64View = new Float64Array(Module.HEAPF64.buffer, ptr, length / Float64Array.BYTES_PER_ELEMENT);
                        
                        // postMessage the array
                        // Note: structured cloning a view creates a copy in JS. 
                        // Use float64View.buffer to transfer underlying ArrayBuffer for zero-copy.
                        self.postMessage(float64View); }, (void *)(&retData[0]), retObjSize);

                // if (isLast)
                // {
                //         emscripten_worker_respond(&retData[0], retObjSize);
                // }
                // else
                // {
                //         emscripten_worker_respond_provisionally(&retData[0], retObjSize);
                // }
        }
}

void constantQProcessSegment(ConstantQSegmentWorkerArgs segmentWorkerArgs,
                             constantq::ConstantQSession *curSession,
                             double *audioArrPtr)
{

        int totalSamples = segmentWorkerArgs.totalSamples;
        int sampleLen = segmentWorkerArgs.sampleLen;
        int frameInterval = segmentWorkerArgs.frameInterval;
        int startFrame = segmentWorkerArgs.startFrame;
        int sampleStart = segmentWorkerArgs.sampleStart;
        bool isLast = segmentWorkerArgs.isLast;

        if (sampleLen < 1)
        {
                return;
        }

        auto audioSampleSize = ((sampleLen - 1) * frameInterval) + curSession->size();
        int totLen = startFrame + frameInterval * (sampleLen - 1) + curSession->size();

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
        for (int i = 0; i < min(100, (int)audioData.size()); i += 10)
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
        retArgs.sampleLen = sampleLen;
        retArgs.totalSamples = totalSamples;

#ifdef DEBUG

        EM_ASM({ console.log('header args: bins', $0, 'sampleStart', $1, 'totalSamples', $2); }, retArgs.bins, retArgs.sampleStart, retArgs.totalSamples);
#endif

        constantQPostMessage(&retArgs, &evaluated[0], evaluated.size(), isLast);
}

void constantQProcess(ConstantQWorkerArgs *constantQArgs, double *audioArrPtr)
{
        int fs = (int)constantQArgs->fs;
        double minFreq = constantQArgs->minFreq;
        double maxFreq = constantQArgs->maxFreq;
        int bins = (int)constantQArgs->bins;
        double thresh = constantQArgs->thresh;
        int frameInterval = (int)constantQArgs->frameInterval;
        int progressMessageCount = (int)constantQArgs->progressMessageCount;
        int audioDataLen = (int)constantQArgs->audioDataLen;

        // create new ConstantQSession
        constantq::ConstantQSession curSession = constantq::ConstantQSession(fs, minFreq, maxFreq, bins, thresh);

        int sparseKernelSize = curSession.size();

        vector<double> audioData(audioArrPtr, audioArrPtr + audioDataLen);

        // total number of constantq samplings
        int totalSamples = floor((audioData.size() - sparseKernelSize) / frameInterval);

#ifdef DEBUG
        for (int i = 0; i < min(100, (int)audioData.size()); i += 10)
                EM_ASM({console.log("sparse kernel audio data at ", $0, $1)}, i, audioData[i]);

        EM_ASM({ console.log('sparsekernel: sparseKernelSize', $0,
                             'bins', $1,
                             'frameInterval', $2,
                             'progressMessageCount', $3,
                             'totalSamples', $4,
                             'audioData size', $5); }, sparseKernelSize, bins, frameInterval, progressMessageCount, totalSamples, audioData.size());
#endif

        // the last ending frame
        int sampleStart = 0;
        for (int w = 0; w < progressMessageCount; w++)
        {
                int endingSample = ceil(((((double)w) + 1) / progressMessageCount) * totalSamples);
                int sampleLen = endingSample - sampleStart;

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
        void constantq_worker_message(const double *arr, int len)
        {
                ConstantQWorkerArgs *constantQArgs = (ConstantQWorkerArgs *)arr;
                double *audioArrPtr = (double *)(((char *)arr) + sizeof(ConstantQWorkerArgs));
                constantQProcess(constantQArgs, audioArrPtr);
        }
}

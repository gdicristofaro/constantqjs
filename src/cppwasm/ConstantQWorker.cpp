#include "ConstantQSession.hpp"
#include <emscripten/emscripten.h>
#include <optional>
#include "WorkerArgs.hpp"

using namespace std;

extern "C" {
    optional<constantq::ConstantQSession> curSession = nullopt;

    /**
     * initialize static-level singleton instance of ConstantQSession
     * @param data      the data as args to the constant q session (fs,minFreq,maxFreq,bins,thresh)
     * @param size      should be sizeof(double) * 5
     */
    void initializeSession(char* charData, int size) {
        assert(size == sizeof(SparseKernelWorkerArgs));
        SparseKernelWorkerArgs* args = (SparseKernelWorkerArgs*)charData;
        int fs = args->fs;
        double minFreq = args->minFreq;
        double maxFreq = args->maxFreq;
        int bins = args->bins;
        double thresh = args->thresh;

        curSession = constantq::ConstantQSession(fs,minFreq,maxFreq,bins,thresh);
        SparseKernelReturnArgs retArgs;
        retArgs.size = curSession.value().size();
        retArgs.bins = curSession.value().bins();

        #ifdef DEBUG
        EM_ASM({
            console.log('initializeSession: fs', $0, 
                        'minFreq',  $1,
                        'maxFreq',  $2,
                        'bins',  $3,
                        'thresh',  $4,
                        'bins',  $5,
                        'size', $6);
        }, fs, minFreq, maxFreq, bins, thresh, retArgs.bins, retArgs.size);
        #endif

        emscripten_worker_respond((char*) &retArgs, sizeof(SparseKernelReturnArgs));
    }

    /**
     * threaded analysis using sparse kernel using established singleton 
     * instance of ConstantQSession
     * 
     * @param data          the pcm audio data 
     * @param startFrame    the starting sample frame in the data array
     * @param frameInterval number of frames between analysis
     * @param totalAnalyses number of samples to make
     * @return              the vector of vectors of form [sample number][bin number]
     */
    void sessionAnalyze(char* charData, int size) {
        assert(curSession.has_value());
        assert(size > sizeof(ConstantQHeaderArgs));
        ConstantQHeaderArgs* args = (ConstantQHeaderArgs*)charData;

        int startFrame = args->startFrame;
        int frameInterval = args->frameInterval;
        int totalSamples = args->totalSamples;
        int sampleStart = args->sampleStart;
        double* audioDataPtr = (double*) (charData + sizeof(ConstantQHeaderArgs));

        int arrSize = (size - sizeof(ConstantQHeaderArgs)) / sizeof(double);
        int totLen = startFrame + frameInterval * (totalSamples - 1) + curSession.value().size();

        #ifdef DEBUG
        EM_ASM({
            console.log('sessionAnalyze: startFrame', $0, 
                        'frameInterval',  $1,
                        'totalSamples',  $2,
                        'sampleStart',  $3,
                        'arrSize',  $4,
                        'totLen',  $5,
                        'bins', $6,
                        'sparse kernel size', $7);
        }, startFrame, frameInterval, totalSamples, sampleStart, arrSize, 
            totLen, curSession.value().bins(), curSession.value().size());

        #endif

        assert(arrSize >= totLen);

        vector<double> audioData(audioDataPtr, audioDataPtr + arrSize);

        #ifdef DEBUG
        for (int i = 0; i < min(100, (int)audioData.size()); i+=10)
            EM_ASM({ console.log('audio item', $0, $1); }, i, audioData[i]);
        #endif

        auto evaluated = curSession.value().analyzeToSingle(audioData,startFrame,frameInterval,totalSamples);

        #ifdef DEBUG
        for (int i = 0; i < 10; i++)
            EM_ASM({ console.log('evaluated item ', $0); }, evaluated[i]);
        #endif

        ConstantQReturnHeaderArgs retArgs;
        retArgs.bins = curSession.value().bins();
        retArgs.sampleStart = sampleStart;
        retArgs.totalSamples = totalSamples;

        int retObjSize = sizeof(ConstantQReturnHeaderArgs) + evaluated.size() * sizeof(double);
        vector<char> retData(retObjSize);

        std::memcpy(&retData[0], &retArgs, sizeof(ConstantQReturnHeaderArgs));
        std::memcpy(&retData[0] + sizeof(ConstantQReturnHeaderArgs), &evaluated[0], sizeof(double) * evaluated.size());

        emscripten_worker_respond(&retData[0], retObjSize);
    }
}
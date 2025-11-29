#include "ConstantQSession.hpp"
#include <emscripten/bind.h>
#include <emscripten.h>
#include <string>
#include <cmath>
#include "WorkerArgs.hpp"

using namespace std;

extern "C" {
    typedef void (*StatusUpdate)(int,int);
    typedef void (*DataUpdate)(int,int,double);

    const int STATUS_START_SPARSE_KERNEL = 0;
    // will also return the number of constant q frames
    const int STATUS_SPARSE_KERNEL_COMPLETE = 1; 
    // will also return the number of constant q samples in most recent iteration
    const int STATUS_CONSTANTQ_ITEM = 2; 


    // data to use on the callback when sparse kernel is determined
    struct OnSparseKernelArgs {
        int frameInterval;
        int workerNumber;
        worker_handle worker;
        int audioDataSize;
        double* audioDataPtr;
        StatusUpdate statusUpdate;
        DataUpdate dataUpdate;
    };

    // data to use on the callback when constant q is determined
    struct OnConstantQArgs {
        StatusUpdate statusUpdate;
        DataUpdate dataUpdate;       
    };

    void onConstantQ(char* data, int size, void* arg) {
        ConstantQReturnHeaderArgs* retHeaderArgs = (ConstantQReturnHeaderArgs*) data;
        int totalSamples = retHeaderArgs->totalSamples;
        int bins = retHeaderArgs->bins;
        int sampleStart = retHeaderArgs->sampleStart;
        
        OnConstantQArgs* onConstantQArgs = (OnConstantQArgs*) arg;
        StatusUpdate statusUpdate = onConstantQArgs->statusUpdate;
        DataUpdate dataUpdate = onConstantQArgs->dataUpdate;

        int audioArrSize = (size - sizeof(ConstantQReturnHeaderArgs)) / sizeof(double);
        assert(audioArrSize >= bins * totalSamples);

        double* analyzedPtr = (double*) (data + sizeof(ConstantQReturnHeaderArgs));
        vector<double> analyzed(analyzedPtr, analyzedPtr + audioArrSize);
        
        #ifdef DEBUG
        EM_ASM({
            console.log('constantq: totalSamples', $0, 
                        'bins',  $1,
                        'sampleStart', $2,
                        'audioSize', $3);
        }, totalSamples, bins, sampleStart, audioArrSize);
        #endif

        for (int i = 0; i < totalSamples; i++) {
            for (int b = 0; b < bins; b++) {
                double value = analyzed[i * bins + b];
                dataUpdate(sampleStart + i,b,value);
            }
        }

        statusUpdate(STATUS_CONSTANTQ_ITEM, totalSamples);
    }

    void onSparseKernel(char* data, int sz, void* arg) {
        assert(sz == sizeof(SparseKernelReturnArgs));
        SparseKernelReturnArgs* retArgs = (SparseKernelReturnArgs*) data;
        int sparseKernelSize = retArgs->size;
        int bins = retArgs->bins;
        
        OnSparseKernelArgs* args = (OnSparseKernelArgs*)arg;

        int frameInterval = args->frameInterval;
        int workerNumber = args->workerNumber;
        worker_handle worker = args->worker;
        int doubleSize = args->audioDataSize;
        double* audioArrPtr = args->audioDataPtr;
        StatusUpdate statusUpdate = args->statusUpdate;
        DataUpdate dataUpdate = args->dataUpdate;

        vector<double> audioData(audioArrPtr, audioArrPtr + doubleSize);

        // total number of constantq samplings
        int sampleNum = floor((audioData.size() - sparseKernelSize) / frameInterval);

        statusUpdate(STATUS_SPARSE_KERNEL_COMPLETE, sampleNum);

        #ifdef DEBUG
        for (int i = 0; i < min(100, (int)audioData.size()); i+= 10)
            EM_ASM({ console.log("sparse kernel audio data at ",$0, $1)}, i, audioData[i]);
        
        EM_ASM({
            console.log('sparsekernel: sparseKernelSize', $0, 
                        'bins',  $1,
                        'frameInterval', $2,
                        'workerNumber', $3,
                        'sampleNum', $4,
                        'audioData size', $5);
        }, sparseKernelSize, bins, frameInterval, workerNumber, sampleNum, audioData.size());
        #endif

        OnConstantQArgs onConstantQArgs;
        onConstantQArgs.dataUpdate = dataUpdate;
        onConstantQArgs.statusUpdate = statusUpdate;

        // the last ending frame
        int startSample = 0;
        for (int w = 0; w < workerNumber; w++) {
            int endingSample = ceil(((((double)w) + 1) / workerNumber) * sampleNum);

            int totalSamples = endingSample - startSample; 
            if (totalSamples < 1)
                continue;

            ConstantQHeaderArgs theseArgs;
            theseArgs.frameInterval = frameInterval;
            theseArgs.startFrame = 0;
            theseArgs.sampleStart = startSample;
            theseArgs.totalSamples = totalSamples;

            auto audioSampleSize = ((totalSamples - 1) * frameInterval) + sparseKernelSize;

            auto totalObjSize = sizeof(ConstantQHeaderArgs) + sizeof(double) * audioSampleSize;
            vector<char> thisData(totalObjSize);

            #ifdef DEBUG
            EM_ASM({
                console.log('sparsekernel loop: sampleStart', $0, 
                            'totalSamples',  $1,
                            'audioSampleSize', $2);
            }, startSample, totalSamples, audioSampleSize);

            for (int i = startSample * frameInterval; i < min(100, (int)audioData.size()); i+= 10)
                EM_ASM({ console.log("sparse kernel loop audio data at", $0, $1)}, i, audioData[i]);
            #endif

            std::memcpy(
                &thisData[0], 
                &theseArgs, 
                sizeof(ConstantQHeaderArgs));

            std::memcpy(
                &thisData[0] + sizeof(ConstantQHeaderArgs), 
                &audioData[startSample * frameInterval], 
                sizeof(double) * audioSampleSize);

            emscripten_call_worker(worker, "sessionAnalyze", 
                (char*) &thisData[0], totalObjSize, 
                onConstantQ, (void*) &onConstantQArgs);

            startSample = endingSample;
        }
    }


    // int fs, double minFreq, double maxFreq, int bins, double thresh
    // data
    // number of workers
    // message updates callbacks, 
    void evaluate(
        int fs, double minFreq, double maxFreq, int bins, double thresh,
        int frameInterval, int workerNumber, vector<double> data, 
        string statusUpdatePtr, string dataUpdatePtr) {
        
        int statusUpdateInt = atoi(&statusUpdatePtr[0]);
        StatusUpdate statusUpdate = reinterpret_cast<StatusUpdate>(statusUpdateInt);
        int dataUpdateInt = atoi(&dataUpdatePtr[0]);
        DataUpdate dataUpdate = reinterpret_cast<DataUpdate>(dataUpdateInt);

        statusUpdate(STATUS_START_SPARSE_KERNEL, 0);

        #ifdef DEBUG
        for (int i = 0; i < min(100, (int)data.size()); i+= 10)
            EM_ASM({ console.log("sparse kernel audio data at", $0, $1)}, i, data[i]);
        #endif

        worker_handle worker = emscripten_create_worker("./assets/wasm/worker.js");

        // initialize sparse Kernel
        SparseKernelWorkerArgs sparseKernelArgs;
        sparseKernelArgs.fs = fs;
        sparseKernelArgs.minFreq = minFreq;
        sparseKernelArgs.maxFreq = maxFreq;
        sparseKernelArgs.bins = bins;
        sparseKernelArgs.thresh = thresh;

        OnSparseKernelArgs args;
        args.frameInterval = frameInterval;
        args.worker = worker;
        args.workerNumber = workerNumber;
        args.audioDataSize = data.size();
        args.audioDataPtr = &data[0];
        args.statusUpdate = statusUpdate;
        args.dataUpdate = dataUpdate;

        #ifdef DEBUG
        EM_ASM({
            console.log('evaluate: fs', $0, 
                        'minFreq',  $1,
                        'maxFreq',  $2,
                        'bins',  $3,
                        'thresh',  $4,
                        'frameInterval',  $5,
                        'workerNumber', $6,
                        'audioData size', $7);
        }, fs, minFreq, maxFreq, bins, thresh, frameInterval, workerNumber, data.size());
        #endif

        emscripten_call_worker(worker, "initializeSession", 
            (char*) &sparseKernelArgs, sizeof(SparseKernelWorkerArgs), 
            onSparseKernel, (void*)&args);
    }

    EMSCRIPTEN_BINDINGS(stl_wrappers) {
        emscripten::register_vector<double>("VectorDouble");
    }

    EMSCRIPTEN_BINDINGS(ConstantQOrchestrator) {
        emscripten::function("evaluate", &evaluate);
    }
}
#include "ConstantQSession.hpp"
#include <cassert>
#include <emscripten/bind.h>
#include <emscripten.h>
#include <emscripten/wasm_worker.h>
#include <string>
#include <cmath>
#include "WorkerArgs.hpp"
#include "Status.hpp"

using namespace std;

extern "C"
{
    void handleWorkerMessage(char *data, int size, void *arg)
    {

        OnConstantQArgs *onConstantQArgs = (OnConstantQArgs *)arg;
        StatusUpdate statusUpdate = onConstantQArgs->statusUpdate;
        DataUpdate dataUpdate = onConstantQArgs->dataUpdate;
        CancelledUpdate cancelledUpdate = onConstantQArgs->cancelledUpdate;

        Status status = ((Status *)data)[0];

#ifdef DEBUG
        EM_ASM({ console.log('received status to display: ', $0, 'and size', $1); }, status, size);
#endif

        switch (status)
        {
        case STATUS_SPARSE_KERNEL_COMPLETE:
        {
            int sampleNum = *reinterpret_cast<int *>((data + sizeof(Status)));
#ifdef DEBUG
            EM_ASM({ console.log('calling status update with sparse kernel complete: ', $0); }, sampleNum);
#endif

            statusUpdate(Status::STATUS_SPARSE_KERNEL_COMPLETE, sampleNum);
            break;
        }
        case STATUS_CONSTANTQ_ITEM:
        {

            ConstantQReturnHeaderArgs *retHeaderArgs = (ConstantQReturnHeaderArgs *)(data + sizeof(Status));
            int totalSamples = retHeaderArgs->totalSamples;
            int bins = retHeaderArgs->bins;
            int sampleStart = retHeaderArgs->sampleStart;

            if (cancelledUpdate())
            {
                return;
            }

            int audioArrSize = (size - sizeof(ConstantQReturnHeaderArgs) - sizeof(Status)) / sizeof(double);
            assert(audioArrSize >= bins * totalSamples);

            double *analyzedPtr = (double *)(data + sizeof(ConstantQReturnHeaderArgs) + sizeof(Status));
            vector<double> analyzed(analyzedPtr, analyzedPtr + audioArrSize);

#ifdef DEBUG
            EM_ASM({ console.log('constantq: totalSamples', $0,
                                 'bins', $1,
                                 'sampleStart', $2,
                                 'audioSize', $3); }, totalSamples, bins, sampleStart, audioArrSize);
#endif

            for (int i = 0; i < totalSamples; i++)
            {
                for (int b = 0; b < bins; b++)
                {
                    double value = analyzed[i * bins + b];
                    dataUpdate(sampleStart + i, b, value);
                }
            }

            statusUpdate(Status::STATUS_CONSTANTQ_ITEM, totalSamples);

            break;
        }
        default:
        {
            break;
        }
        }
    }

    // int fs, double minFreq, double maxFreq, int bins, double thresh
    // data
    // number of workers
    // message updates callbacks,
    int evaluate(
        int fs, double minFreq, double maxFreq, int bins, double thresh,
        int frameInterval, int workerNumber, vector<double> data,
        string statusUpdatePtr, string dataUpdatePtr, string cancelledUpdatePtr)
    {

#ifdef DEBUG
        EM_ASM({console.log("Beginning evaluate...")});
#endif

        int statusUpdateInt = atoi(&statusUpdatePtr[0]);
        StatusUpdate statusUpdate = reinterpret_cast<StatusUpdate>(statusUpdateInt);
        int dataUpdateInt = atoi(&dataUpdatePtr[0]);
        DataUpdate dataUpdate = reinterpret_cast<DataUpdate>(dataUpdateInt);
        int cancelledUpdateInt = atoi(&cancelledUpdatePtr[0]);
        CancelledUpdate cancelledUpdate = reinterpret_cast<CancelledUpdate>(cancelledUpdateInt);

#ifdef DEBUG
        EM_ASM({ console.log("table size:", wasmTable.length, "data ptr:", $0, "status ptr: ", $1); }, dataUpdateInt, statusUpdateInt);
#endif

        statusUpdate(Status::STATUS_START_SPARSE_KERNEL, 0);

#ifdef DEBUG
        for (int i = 0; i < min(100, (int)data.size()); i += 10)
            EM_ASM({console.log("sparse kernel audio data at", $0, $1)}, i, data[i]);
#endif

        worker_handle worker = emscripten_create_worker("./assets/wasm/worker.js");

        int callObjSize = sizeof(ConstantQWorkerArgs) + data.size() * sizeof(double);
        vector<char> callObjData(callObjSize);

        ConstantQWorkerArgs *constantQWorkerArgs = (ConstantQWorkerArgs *)&callObjData[0];
        constantQWorkerArgs->sparseKernelArgs.fs = fs;
        constantQWorkerArgs->sparseKernelArgs.minFreq = minFreq;
        constantQWorkerArgs->sparseKernelArgs.maxFreq = maxFreq;
        constantQWorkerArgs->sparseKernelArgs.bins = bins;
        constantQWorkerArgs->sparseKernelArgs.thresh = thresh;

        constantQWorkerArgs->onSparseKernelArgs.frameInterval = frameInterval;
        constantQWorkerArgs->onSparseKernelArgs.workerNumber = workerNumber;
        constantQWorkerArgs->onSparseKernelArgs.audioDataSize = data.size();
        constantQWorkerArgs->onSparseKernelArgs.audioDataPtr = &data[0];
        constantQWorkerArgs->onSparseKernelArgs.statusUpdate = statusUpdate;
        constantQWorkerArgs->onSparseKernelArgs.dataUpdate = dataUpdate;
        constantQWorkerArgs->onSparseKernelArgs.cancelledUpdate = cancelledUpdate;

        std::memcpy(&callObjData[0] + sizeof(ConstantQWorkerArgs), &data[0], sizeof(double) * data.size());

        OnConstantQArgs onConstantQArgs = {
            statusUpdate,
            dataUpdate,
            cancelledUpdate};
#ifdef DEBUG
        EM_ASM({ console.log('evaluate: fs', $0,
                             'minFreq', $1,
                             'maxFreq', $2,
                             'bins', $3,
                             'thresh', $4,
                             'frameInterval', $5,
                             'workerNumber', $6,
                             'audioData size', $7); }, fs, minFreq, maxFreq, bins, thresh, frameInterval, workerNumber, data.size());
#endif

        emscripten_call_worker(worker, "initializeSession",
                               &callObjData[0],
                               callObjSize,
                               handleWorkerMessage,
                               (void *)&onConstantQArgs);

        return worker;
    }

    int forceExit()
    {
        emscripten_force_exit(0);
    }

    EMSCRIPTEN_BINDINGS(stl_wrappers)
    {
        emscripten::register_vector<double>("VectorDouble");
    }

    EMSCRIPTEN_BINDINGS(ConstantQOrchestrator)
    {
        emscripten::function("evaluate", &evaluate);
        emscripten::function("forceExit", &forceExit);
    }
}
#include "ConstantQSession.hpp"
#include <cassert>
#include <emscripten/emscripten.h>
#include <optional>
#include "WorkerArgs.hpp"
#include "Status.hpp"

using namespace std;

const Status CONSTANT_Q_ITEM_STATUS = Status::STATUS_CONSTANTQ_ITEM;
const Status SPARSE_KERNEL_COMPLETE = Status::STATUS_SPARSE_KERNEL_COMPLETE;

extern "C"
{

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
        void sessionAnalyze(constantq::ConstantQSession *curSession, ConstantQHeaderArgs *args, double *audioDataPtr, int arrSize, bool isLast)
        {

                int startFrame = args->startFrame;
                int frameInterval = args->frameInterval;
                int totalSamples = args->totalSamples;
                int sampleStart = args->sampleStart;

                int totLen = startFrame + frameInterval * (totalSamples - 1) + curSession->size();

#ifdef DEBUG
                EM_ASM({ console.log('sessionAnalyze: startFrame', $0,
                                     'frameInterval', $1,
                                     'totalSamples', $2,
                                     'sampleStart', $3,
                                     'arrSize', $4,
                                     'totLen', $5,
                                     'bins', $6,
                                     'sparse kernel size', $7); }, startFrame, frameInterval, totalSamples, sampleStart, arrSize, totLen, curSession->bins(), curSession->size());

#endif

                assert(arrSize >= totLen);

                vector<double> audioData(audioDataPtr, audioDataPtr + arrSize);

#ifdef DEBUG
                for (int i = 0; i < min(100, (int)audioData.size()); i += 10)
                        EM_ASM({ console.log('audio item', $0, $1); }, i, audioData[i]);
#endif

                auto evaluated = curSession->analyzeToSingle(audioData, startFrame, frameInterval, totalSamples);

#ifdef DEBUG
                for (int i = 0; i < 10; i++)
                        EM_ASM({ console.log('evaluated item ', $0); }, evaluated[i]);
#endif

                ConstantQReturnHeaderArgs retArgs;
                retArgs.bins = curSession->bins();
                retArgs.sampleStart = sampleStart;
                retArgs.totalSamples = totalSamples;

                int retObjSize = sizeof(Status) + sizeof(ConstantQReturnHeaderArgs) + evaluated.size() * sizeof(double);
                vector<char> retData(retObjSize);

                std::memcpy(&retData[0], &CONSTANT_Q_ITEM_STATUS, sizeof(Status));
                std::memcpy(&retData[0] + sizeof(Status), &retArgs, sizeof(ConstantQReturnHeaderArgs));
                std::memcpy(&retData[0] + sizeof(Status) + sizeof(ConstantQReturnHeaderArgs), &evaluated[0], sizeof(double) * evaluated.size());

                if (isLast)
                {
                        emscripten_worker_respond(&retData[0], retObjSize);
                }
                else
                {
                        emscripten_worker_respond_provisionally(&retData[0], retObjSize);
                }
        }

        void onSparseKernel(constantq::ConstantQSession *curSession, OnSparseKernelArgs *args, double *audioArrPtr, int arrSize)
        {
#ifdef DEBUG
                EM_ASM({console.log('Beginning onSparseKernel')});
#endif

                int sparseKernelSize = curSession->size();
                int bins = curSession->bins();

                int frameInterval = args->frameInterval;
                int workerNumber = args->workerNumber;
                StatusUpdate statusUpdate = args->statusUpdate;
                DataUpdate dataUpdate = args->dataUpdate;
                CancelledUpdate cancelledUpdate = args->cancelledUpdate;

                // if (cancelledUpdate())
                // {
                //         // statusUpdate(STATUS_CANCELLED, 0);
                // }

                vector<double> audioData(audioArrPtr, audioArrPtr + (arrSize / sizeof(double)));

                // total number of constantq samplings
                int sampleNum = floor((audioData.size() - sparseKernelSize) / frameInterval);

                // statusUpdate(STATUS_SPARSE_KERNEL_COMPLETE, sampleNum);

                int retObjSize = sizeof(Status) + sizeof(int);
                vector<char> retData(retObjSize);

                std::memcpy(&retData[0], &SPARSE_KERNEL_COMPLETE, sizeof(Status));
                std::memcpy(&retData[0] + sizeof(Status), &sampleNum, sizeof(int));

                emscripten_worker_respond_provisionally(&retData[0], retObjSize);

#ifdef DEBUG
                for (int i = 0; i < min(100, (int)audioData.size()); i += 10)
                        EM_ASM({console.log("sparse kernel audio data at ", $0, $1)}, i, audioData[i]);

                EM_ASM({ console.log('sparsekernel: sparseKernelSize', $0,
                                     'bins', $1,
                                     'frameInterval', $2,
                                     'workerNumber', $3,
                                     'sampleNum', $4,
                                     'audioData size', $5); }, sparseKernelSize, bins, frameInterval, workerNumber, sampleNum, audioData.size());
#endif

                OnConstantQArgs onConstantQArgs;
                onConstantQArgs.dataUpdate = dataUpdate;
                onConstantQArgs.statusUpdate = statusUpdate;
                onConstantQArgs.cancelledUpdate = cancelledUpdate;

                // the last ending frame
                int startSample = 0;
                for (int w = 0; w < workerNumber; w++)
                {
                        // if (cancelledUpdate())
                        // {
                        //         // statusUpdate(STATUS_CANCELLED, startSample);
                        //         return;
                        // }

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

                        // auto totalObjSize = sizeof(ConstantQHeaderArgs) + sizeof(double) * audioSampleSize;
                        // vector<char> thisData(totalObjSize);

#ifdef DEBUG
                        EM_ASM({ console.log('sparsekernel loop: sampleStart', $0,
                                             'totalSamples', $1,
                                             'audioSampleSize', $2); }, startSample, totalSamples, audioSampleSize);

                        for (int i = startSample * frameInterval; i < min(100, (int)audioData.size()); i += 10)
                                EM_ASM({console.log("sparse kernel loop audio data at", $0, $1)}, i, audioData[i]);
#endif

                        // std::memcpy(
                        //     &thisData[0],
                        //     &theseArgs,
                        //     sizeof(ConstantQHeaderArgs));

                        // std::memcpy(
                        //     &thisData[0] + sizeof(ConstantQHeaderArgs),
                        //     &audioData[startSample * frameInterval],
                        //     sizeof(double) * audioSampleSize);

                        sessionAnalyze(curSession, &theseArgs, &audioData[startSample * frameInterval], sizeof(double) * audioSampleSize, w == workerNumber - 1);
                        //     emscripten_call_worker(worker, "sessionAnalyze",
                        //                            (char *)&thisData[0], totalObjSize,
                        //                            onConstantQ, (void *)&onConstantQArgs);

                        startSample = endingSample;
                }
        }

        /**
         * initialize static-level singleton instance of ConstantQSession
         * @param data      the data as args to the constant q session (fs,minFreq,maxFreq,bins,thresh)
         * @param size      should be sizeof(double) * 5
         */
        void initializeSession(char *charData, int size)
        {
#ifdef DEBUG
                EM_ASM({console.log('Beginning initializeSession')});
#endif

                ConstantQWorkerArgs *constantQArgs = (ConstantQWorkerArgs *)charData;
                int fs = constantQArgs->sparseKernelArgs.fs;
                double minFreq = constantQArgs->sparseKernelArgs.minFreq;
                double maxFreq = constantQArgs->sparseKernelArgs.maxFreq;
                int bins = constantQArgs->sparseKernelArgs.bins;
                double thresh = constantQArgs->sparseKernelArgs.thresh;

                OnSparseKernelArgs onSparseKernelArgs = constantQArgs->onSparseKernelArgs;

                constantq::ConstantQSession curSession = constantq::ConstantQSession(fs, minFreq, maxFreq, bins, thresh);
                double *audioArrPtr = (double *)(charData + sizeof(ConstantQWorkerArgs));
                int audioArrSize = size - sizeof(ConstantQWorkerArgs);

                onSparseKernel(&curSession, &onSparseKernelArgs, audioArrPtr, audioArrSize);

#ifdef DEBUG
                EM_ASM({ console.log('initializeSession: fs', $0,
                                     'minFreq', $1,
                                     'maxFreq', $2,
                                     'bins', $3,
                                     'thresh', $4,
                                     'bins', $5,
                                     'size', $6); }, fs, minFreq, maxFreq, bins, thresh, curSession.bins(), curSession.size());
#endif
        }
}
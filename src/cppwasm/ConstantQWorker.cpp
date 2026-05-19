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
        void constantQPostMessage(ConstantQReturnHeaderArgs *headerArgs, double *evaluated, int evaluatedlen, bool isLast)
        {

                int retObjSize = sizeof(Status) + sizeof(ConstantQReturnHeaderArgs) + evaluatedlen * sizeof(double);
                vector<char> retData(retObjSize);

#ifdef DEBUG

                EM_ASM({ console.log('header args: bins', $0, 'sampleStart', $1, 'totalSamples', $2); }, headerArgs->bins, headerArgs->sampleStart, headerArgs->totalSamples);
#endif

                std::memcpy(&retData[0], &CONSTANT_Q_ITEM_STATUS, sizeof(Status));
                std::memcpy(&retData[0] + sizeof(Status), headerArgs, sizeof(ConstantQReturnHeaderArgs));
                std::memcpy(&retData[0] + sizeof(Status) + sizeof(ConstantQReturnHeaderArgs), &evaluated[0], sizeof(double) * evaluatedlen);

#ifdef DEBUG
                EM_ASM({ console.log('constantQPostMessage: retObjSize', $0); }, evaluatedlen);

#endif

                if (isLast)
                {
                        emscripten_worker_respond(&retData[0], retObjSize);
                }
                else
                {
                        emscripten_worker_respond_provisionally(&retData[0], retObjSize);
                }
        }

        void sparseKernelPostMessage(int sampleNum)
        {
                int retObjSize = sizeof(Status) + sizeof(int);
                vector<char> retData(retObjSize);

                std::memcpy(&retData[0], &SPARSE_KERNEL_COMPLETE, sizeof(Status));
                std::memcpy(&retData[0] + sizeof(Status), &sampleNum, sizeof(int));

                emscripten_worker_respond_provisionally(&retData[0], retObjSize);
        }

        void constantQProcessSegment(ConstantQSegmentWorkerArgs segmentWorkerArgs,
                                     constantq::ConstantQSession *curSession,
                                     double *audioArrPtr)
        {

                int totalSamples = segmentWorkerArgs.totalSamples;
                int frameInterval = segmentWorkerArgs.frameInterval;
                int startFrame = segmentWorkerArgs.startFrame;
                int sampleStart = segmentWorkerArgs.sampleStart;
                bool isLast = segmentWorkerArgs.isLast;

                if (totalSamples < 1)
                {
                        return;
                }

                auto audioSampleSize = ((totalSamples - 1) * frameInterval) + curSession->size();
                int totLen = startFrame + frameInterval * (totalSamples - 1) + curSession->size();

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

                auto evaluated = curSession->analyzeToSingle(audioData, startFrame, frameInterval, totalSamples);

#ifdef DEBUG
                for (int i = 0; i < 10; i++)
                        EM_ASM({ console.log('evaluated item ', $0); }, evaluated[i]);
#endif

                ConstantQReturnHeaderArgs retArgs;
                retArgs.bins = curSession->bins();
                retArgs.sampleStart = sampleStart;
                retArgs.totalSamples = totalSamples;

#ifdef DEBUG

                EM_ASM({ console.log('header args: bins', $0, 'sampleStart', $1, 'totalSamples', $2); }, retArgs.bins, retArgs.sampleStart, retArgs.totalSamples);
#endif

                constantQPostMessage(&retArgs, &evaluated[0], evaluated.size(), isLast);
        }

        void constantQProcess(ConstantQWorkerArgs *constantQArgs, double *audioArrPtr)
        {
                int fs = constantQArgs->fs;
                double minFreq = constantQArgs->minFreq;
                double maxFreq = constantQArgs->maxFreq;
                int bins = constantQArgs->bins;
                double thresh = constantQArgs->thresh;
                int frameInterval = constantQArgs->frameInterval;
                int progressMessageCount = constantQArgs->progressMessageCount;
                int audioDataLen = constantQArgs->audioDataLen;

                // create new ConstantQSession
                constantq::ConstantQSession curSession = constantq::ConstantQSession(fs, minFreq, maxFreq, bins, thresh);

                int sparseKernelSize = curSession.size();

                vector<double> audioData(audioArrPtr, audioArrPtr + audioDataLen);

                // total number of constantq samplings
                int sampleNum = floor((audioData.size() - sparseKernelSize) / frameInterval);
                sparseKernelPostMessage(sampleNum);

#ifdef DEBUG
                for (int i = 0; i < min(100, (int)audioData.size()); i += 10)
                        EM_ASM({console.log("sparse kernel audio data at ", $0, $1)}, i, audioData[i]);

                EM_ASM({ console.log('sparsekernel: sparseKernelSize', $0,
                                     'bins', $1,
                                     'frameInterval', $2,
                                     'progressMessageCount', $3,
                                     'sampleNum', $4,
                                     'audioData size', $5); }, sparseKernelSize, bins, frameInterval, progressMessageCount, sampleNum, audioData.size());
#endif

                // the last ending frame
                int startSample = 0;
                for (int w = 0; w < progressMessageCount; w++)
                {
                        int endingSample = ceil(((((double)w) + 1) / progressMessageCount) * sampleNum);
                        int totalSamples = endingSample - startSample;

                        ConstantQSegmentWorkerArgs segmentWorkerArgs = {
                            totalSamples,
                            frameInterval,
                            0,
                            startSample,
                            w >= progressMessageCount - 1};

                        constantQProcessSegment(segmentWorkerArgs, &curSession, &audioData[startSample * frameInterval]);

                        startSample = endingSample;
                }
        }

        // EMSCRIPTEN_KEEPALIVE
        void onmessage(const char *charData)
        {
                ConstantQWorkerArgs *constantQArgs = (ConstantQWorkerArgs *)charData;
                double *audioArrPtr = (double *)(charData + sizeof(ConstantQWorkerArgs));
                constantQProcess(constantQArgs, audioArrPtr);
        }
}

#pragma once

typedef void (*StatusUpdate)(int, int);
typedef void (*DataUpdate)(int, int, double);
typedef int (*CancelledUpdate)();

// for communicating to ConstantQWorker to get sparse kernel
struct SparseKernelWorkerArgs
{
    int fs;
    double minFreq;
    double maxFreq;
    int bins;
    double thresh;
};

// data to use on the callback when sparse kernel is determined
struct OnSparseKernelArgs
{
    int frameInterval;
    int workerNumber;
    int audioDataSize;
    double *audioDataPtr;
    StatusUpdate statusUpdate;
    DataUpdate dataUpdate;
    CancelledUpdate cancelledUpdate;
};

struct ConstantQWorkerArgs
{
    SparseKernelWorkerArgs sparseKernelArgs;
    OnSparseKernelArgs onSparseKernelArgs;
};

// args sent to constant q analysis; this header precedes the pertinent audio data to process
struct ConstantQHeaderArgs
{
    int startFrame;    // the starting frame (typically 0)
    int frameInterval; // frames between sampling
    int totalSamples;  // the total number of constant q samples to gather (spaced at frame interval)
    int sampleStart;   // the index for this sample start in return array
};

// args to return from constant q
struct ConstantQReturnHeaderArgs
{
    int bins;
    int totalSamples;
    int sampleStart;
};

// data to use on the callback when constant q is determined
struct OnConstantQArgs
{
    StatusUpdate statusUpdate;
    DataUpdate dataUpdate;
    CancelledUpdate cancelledUpdate;
};
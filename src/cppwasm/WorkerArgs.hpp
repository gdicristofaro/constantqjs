#pragma once

// for communicating to ConstantQWorker to get sparse kernel
struct SparseKernelWorkerArgs {
    int fs;
    double minFreq;
    double maxFreq;
    int bins;
    double thresh;
};

// for returning from creating the sparsekernel
struct SparseKernelReturnArgs {
    int size;
    int bins;
};

// args sent to constant q analysis; this header precedes the pertinent audio data to process
struct ConstantQHeaderArgs {
    int startFrame;     // the starting frame (typically 0)
    int frameInterval;  // frames between sampling
    int totalSamples;   // the total number of constant q samples to gather (spaced at frame interval)
    int sampleStart;    // the index for this sample start in return array
};

// args to return from constant q
struct ConstantQReturnHeaderArgs {
    int bins;
    int totalSamples;
    int sampleStart;
};
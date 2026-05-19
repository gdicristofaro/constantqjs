#pragma once

struct ConstantQWorkerArgs
{
    int fs;
    double minFreq;
    double maxFreq;
    int bins;
    double thresh;
    int frameInterval;
    int progressMessageCount;
    int audioDataLen;
};

struct ConstantQSegmentWorkerArgs
{
    int totalSamples;
    int frameInterval;
    int startFrame;
    int sampleStart;
    bool isLast;
};

struct ConstantQReturnHeaderArgs
{
    int bins;
    int totalSamples;
    int sampleStart;
};
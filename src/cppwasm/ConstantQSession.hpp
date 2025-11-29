#pragma once
#include "SparseKernel.hpp"

namespace constantq {
    class ConstantQSession {
        private:
            static ConstantQSession curSession;
            SparseKernel _cachedKernel;

            /**
             * analyzes pcm audio data utilizing constant q algorithm
             * @param data          the pcm audio data in a two dimensional array of format [channel][sample frame]
             * @param bufferInput   the buffer to use for input from the ConstantQ algorithm
             * @param bufferOutput  the buffer to use for output from the ConstantQ algorithm
             * @param startIndex    the starting sample frame in the data array
             * @param len           the number of sample frames to analyze (should be equivalent to sparse kernel size)
             * @return              the vector of size 'bins' of the constant q sized data
             */
            std::vector<double> analyzeSnapshot(std::vector<double> data, 
                                    std::vector<std::complex<double> > bufferInput,
                                    std::vector<std::complex<double> > bufferOutput,
                                    int startIndex, int len);

        public:
            /**
             * @param fs        the frames per second (44100 for 44.1 kHz)
             * @param minFreq   minimum frequency for  analysis (in Hz)
             * @param maxFreq   maximum frequency for  analysis (in Hz)
             * @param bins      bins per octave
             * @param thresh    minimum threshold to be encapsulated for determining bin amplitude in final analysis
             */
            ConstantQSession(int fs, double minFreq, double maxFreq, int bins, double thresh);

            int bins();
            
            int size();

            /**
             * threaded analysis using sparse kernel 
             * @param data          the pcm audio data 
             * @param startFrame    the starting sample frame in the data array
             * @param frameInterval number of frames between analysis
             * @param totalAnalyses number of samples to make
             * @return              the vector of vectors of form [sample number][bin number]
             */
            std::vector<std::vector<double> > analyze(
                                        std::vector<double> data, 
                                        int startFrame, int frameInterval, int totalAnalyses); 


            /**
             * analyzes to a single vector where item i = bin + analysis * total bins 
             * @param data          the pcm audio data 
             * @param startFrame    the starting sample frame in the data array
             * @param frameInterval number of frames between analysis
             * @param totalAnalyses number of samples to make
             * @return              the vector of vectors of form [sample number][bin number]
             */
            std::vector<double> analyzeToSingle(std::vector<double> data, 
                    int startFrame, int frameInterval, int totalAnalyses);
    };
}

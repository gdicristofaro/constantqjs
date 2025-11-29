#include <optional>
#include "ConstantQ.hpp"
#include "SparseKernel.hpp"
#include "ConstantQSession.hpp"
#include <cmath>
//#include <emscripten/bind.h>

using namespace std;

namespace constantq {
    ConstantQSession::ConstantQSession(int fs, double minFreq, double maxFreq, 
                                        int bins, double thresh) : 
        _cachedKernel(ConstantQ::sparseKernel(fs,minFreq,maxFreq,bins,thresh)) { }

    int ConstantQSession::bins() { return _cachedKernel.bins(); }

    int ConstantQSession::size() { return _cachedKernel.size(); }

    vector<double> ConstantQSession::analyzeSnapshot(vector<double> data, 
                                        vector<complex<double> > bufferInput,
                                        vector<complex<double> > bufferOutput, 
                                        int startIndex, int len) {

        vector<double> toRet(_cachedKernel.bins());

        // verify that length to parse from data is the sparse kernel's size
        assert(len >= _cachedKernel.size());
        assert(startIndex >= 0);
        assert(startIndex + len <= data.size());

        for (int i = 0; i < len; i++)
            bufferInput[i] = data[startIndex + i];

        ConstantQ::constantQ(bufferInput, bufferOutput, _cachedKernel);
        for (int i = 0; i < bufferOutput.size(); i++) {
            toRet[i] = (double) (abs(bufferOutput[i]));
        }

        return toRet;
    }

    vector<vector<double> > ConstantQSession::analyze(vector<double> data, 
                        int startFrame, int frameInterval, int totalAnalyses) {
        
        assert(startFrame >= 0);
        assert(data.size() >= startFrame + frameInterval * totalAnalyses);

        // buffers to minimize memory allocation and deallocation
        vector<complex<double> > bufferInput(_cachedKernel.size());
        vector<complex<double> > bufferOutput(_cachedKernel.bins());

        // the vector of vectors to return
        vector<vector<double> > toRet(totalAnalyses);

        auto kernelLen = _cachedKernel.size();
        for (int i = 0; i < totalAnalyses; i++) {
            toRet[i] = analyzeSnapshot(data, bufferInput, bufferOutput, 
                                        startFrame + frameInterval * i, kernelLen);
        }
            
        return toRet;
    }



    vector<double> ConstantQSession::analyzeToSingle(vector<double> data, 
                        int startFrame, int frameInterval, int totalAnalyses) {
        
        assert(startFrame >= 0);

        auto kernelLen = _cachedKernel.size();

        assert(data.size() >= startFrame + kernelLen + frameInterval * (totalAnalyses - 1));


        // buffers to minimize memory allocation and deallocation
        vector<complex<double> > bufferInput(kernelLen);
        vector<complex<double> > bufferOutput(_cachedKernel.bins());

        // the vector of vectors to return
        vector<double> toRet(totalAnalyses * _cachedKernel.bins());

        for (int i = 0; i < totalAnalyses; i++) {
            auto thisSnapshot = analyzeSnapshot(data, bufferInput, bufferOutput, 
                                        startFrame + frameInterval * i, kernelLen);
            memcpy(
                &toRet[0] + _cachedKernel.bins() * i,
                &thisSnapshot[0], 
                sizeof(double) * _cachedKernel.bins());
        }
            
        return toRet;
    }
}


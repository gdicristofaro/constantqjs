#include <vector> 
#include <string>
#include <stdio.h>
#include "KernelEntry.hpp"
#include "SparseKernel.hpp"

using namespace std;


namespace constantq {
    vector<vector<KernelEntry> > SparseKernel::matrix() const { return _matrix; }
    int SparseKernel::size() { return _size; }
    int SparseKernel::bins() { return _bins; }


    SparseKernel::SparseKernel(vector<vector<KernelEntry> > matrix, int size, int bins) : _matrix(matrix) {
        _size = size;
        _bins = bins;
    }

    string SparseKernel::toString() {
        ostringstream stringStream;
        stringStream << "Complex { size: " << _size << ", bins: " << _bins << " matrix: [";
        
        for(size_t r = 0; r < _matrix.size(); ++r)
        {
            if (r != 0)
                stringStream << ",";

            stringStream << "  [";

            auto row = _matrix[r];
            for (size_t e = 0; e < row.size(); ++e) {
                if (e != 0)
                    stringStream << ", ";

                auto entry = row[e];
                stringStream << entry.toString();
            }
            
            stringStream << "]";
        }

        stringStream << "] }";
        return stringStream.str();
    }
}
#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>

#include "TestHelpers.hpp"
#include "SparseKernel.hpp"
#include "ConstantQ.hpp"
#include <map>

using namespace constantq;
using Catch::Matchers::WithinAbs;
using Catch::Matchers::WithinRel;
using std::map;

TEST_CASE("SparseKernel", "[SparseKernel]")
{
    auto expected = testSparseKernel();

    auto result = ConstantQ::sparseKernel(44100, 523.25, 1046.5, 24, .0054);

    CHECK(expected.bins() == result.bins());
    CHECK(expected.size() == result.size());
    CHECK(expected.matrix().size() == result.matrix().size());

    for (size_t a = 0; a < expected.matrix().size(); a++)
    {
        auto thisExpectedMatrix = expected.matrix()[a];
        auto thisResultMatrix = result.matrix()[a];

        CHECK(thisExpectedMatrix.size() == thisResultMatrix.size());

        map<int, complex<double>> expectedMapping;
        for (size_t b = 0; b < thisExpectedMatrix.size(); b++)
            expectedMapping[thisExpectedMatrix[b].fftIndex()] = thisExpectedMatrix[b].multiplier();

        for (size_t b = 0; b < thisResultMatrix.size(); b++)
        {
            auto thisEntry = thisResultMatrix[b];
            auto thisFftIndex = thisEntry.fftIndex();
            auto thisMultiplier = thisEntry.multiplier();

            auto expected = expectedMapping[thisFftIndex];
            CHECK_THAT(abs(thisMultiplier), WithinRel(abs(expected), .001));
        }
    }
}

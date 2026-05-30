#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>

#include "TestHelpers.hpp"
#include "SparseKernel.hpp"
#include "ConstantQ.hpp"
#include <map>

using namespace constantq;
using Catch::Matchers::Equals;
using Catch::Matchers::WithinRel;
using std::map;

TEST_CASE("SparseKernel", "[SparseKernel]")
{
    auto expected = testSparseKernel();

    auto result = ConstantQ::sparseKernel(44100, 523.25, 1046.5, 24, .0054);

    CHECK_THAT(expected.bins(), Equals(result.bins()));
    CHECK_THAT(expected.size(), Equals(result.size()));
    CHECK_THAT(expected.matrix().size(), Equals(result.matrix().size()));

    for (int a = 0; a < expected.matrix().size(); a++)
    {
        auto thisExpectedMatrix = expected.matrix()[a];
        auto thisResultMatrix = result.matrix()[a];

        CHECK_THAT(thisExpectedMatrix.size(), Equals(thisResultMatrix.size()));

        map<int, complex<double>> expectedMapping;
        for (int b = 0; b < thisExpectedMatrix.size(); b++)
            expectedMapping[thisExpectedMatrix[b].fftIndex()] = thisExpectedMatrix[b].multiplier();

        for (int b = 0; b < thisResultMatrix.size(); b++)
        {
            auto thisEntry = thisResultMatrix[b];
            auto thisFftIndex = thisEntry.fftIndex();
            auto thisMultiplier = thisEntry.multiplier();

            CHECK_THAT(thisMultiplier, WithinRel(expectedMapping[thisFftIndex], abs(thisMultiplier) / 1000));
        }
    }
}

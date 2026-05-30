#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>

#include "TestHelpers.hpp"
#include "MathUtil.hpp"

using namespace constantq;
using Catch::Matchers::WithinRel;

TEST_CASE("MathUtil Leading Zeros", "[MathUtil]")
{
    CHECK(MathUtil::leadingZeros(0x00F00000) == 8);
    CHECK(MathUtil::leadingZeros(0x70F00000) == 1);
    CHECK(MathUtil::leadingZeros(0x000000F0) == 24);
    CHECK(MathUtil::leadingZeros(0x00000001) == 31);
    CHECK(MathUtil::leadingZeros(0x00000000) == 32);
    CHECK(MathUtil::leadingZeros(0xF0F0F0F0) == 0);
}

TEST_CASE("MathUtil Reverse", "[MathUtil]")
{
    CHECK(MathUtil::reverse(0x00000001) == 0x80000000);
    CHECK(MathUtil::reverse(0xFFFFFFFF) == 0xFFFFFFFF);
    CHECK(MathUtil::reverse(0x00000000) == 0x0);
    CHECK(MathUtil::reverse(0x00F00000) == 0x00000F00);
}

TEST_CASE("MathUtil Next Power 2", "[MathUtil]")
{
    CHECK(MathUtil::nextPow2(15) == 4);
    CHECK(MathUtil::nextPow2(16) == 4);
    CHECK(MathUtil::nextPow2(17) == 5);
    CHECK(MathUtil::nextPow2(2) == 1);
}

TEST_CASE("MathUtil Hamming Window", "[MathUtil]")
{
    double expectedHamming[12]{0.08, 0.15302337, 0.34890909, 0.60546483, 0.84123594,
                               0.98136677, 0.98136677, 0.84123594, 0.60546483, 0.34890909,
                               0.15302337, 0.08};

    auto receivedHamming = MathUtil::hamming(12);

    for (int i = 0; i < 12; i++)
    {
        CHECK_THAT(receivedHamming[i], WithinRel(expectedHamming[i], EPSILON));
    }
}

TEST_CASE("MathUtil FFT", "[MathUtil]")
{
    auto testFFT = [](int size, int freq)
    {
        auto amplitudes = generateSin(size, freq);
        MathUtil::fft(amplitudes, size);

        int maxIndex = -1;
        double maxValue = 0;
        for (int i = 0; i < size; i++)
        {
            double thisMax = abs(amplitudes[i]);
            if (maxIndex < 0 || thisMax > maxValue)
            {
                maxIndex = i;
                maxValue = thisMax;
            }
        }

        CHECK_THAT(maxIndex, WithinRel(freq, 0.0001));
    };

    int size = 32;
    testFFT(size, 1);
    testFFT(size, 2);
    testFFT(size, 4);
    testFFT(size, 8);
}

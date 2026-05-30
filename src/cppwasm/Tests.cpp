// #include <catch2/catch_test_macros.hpp>
// #include <catch2/matchers/catch_matchers_floating_point.hpp>
// #include <catch2/matchers/catch_matchers_floating_point.hpp>

// #include "ConstantQ.hpp"
// #include "ConstantQSession.hpp"
// #include "KernelEntry.hpp"
// #include "MathUtil.hpp"
// #include "SparseKernel.hpp"

// #include <string>
// #include <optional>
// #include <iostream>
// #include <cmath>
// #include <map>

// using namespace std;
// using namespace constantq;
// using Catch::Matchers::WithinRel;

// constexpr double EPSILON = 0.00000001;

// // Helper function to generate sine wave
// void insertSin(vector<complex<double>> &buff, int fps, double maxAmplitude, double freq)
// {
//     auto sz = buff.size();
//     for (int x = 0; x < sz; x++)
//         buff[x] += maxAmplitude * sin(M_PI * x * 2 * freq / fps);
// }

// vector<complex<double>> generateSin(int size, int freq)
// {
//     vector<complex<double>> toGen(size, 0);
//     insertSin(toGen, size, 10, freq);
//     return toGen;
// }

// // ===== MathUtil Tests =====

// TEST_CASE("MathUtil Leading Zeros", "[MathUtil]")
// {
//     CHECK(MathUtil::leadingZeros(0x00F00000) == 8);
//     CHECK(MathUtil::leadingZeros(0x70F00000) == 1);
//     CHECK(MathUtil::leadingZeros(0x000000F0) == 24);
//     CHECK(MathUtil::leadingZeros(0x00000001) == 31);
//     CHECK(MathUtil::leadingZeros(0x00000000) == 32);
//     CHECK(MathUtil::leadingZeros(0xF0F0F0F0) == 0);
// }

// TEST_CASE("MathUtil Reverse", "[MathUtil]")
// {
//     CHECK(MathUtil::reverse(0x00000001) == 0x80000000);
//     CHECK(MathUtil::reverse(0xFFFFFFFF) == 0xFFFFFFFF);
//     CHECK(MathUtil::reverse(0x00000000) == 0x0);
//     CHECK(MathUtil::reverse(0x00F00000) == 0x00000F00);
// }

// TEST_CASE("MathUtil Next Power 2", "[MathUtil]")
// {
//     CHECK(MathUtil::nextPow2(15) == 4);
//     CHECK(MathUtil::nextPow2(16) == 4);
//     CHECK(MathUtil::nextPow2(17) == 5);
//     CHECK(MathUtil::nextPow2(2) == 1);
// }

// TEST_CASE("MathUtil Hamming Window", "[MathUtil]")
// {
//     // taken from https://docs.scipy.org/doc/numpy-1.13.0/reference/generated/numpy.hamming.html
//     double expectedHamming[12]{0.08, 0.15302337, 0.34890909, 0.60546483, 0.84123594,
//                                0.98136677, 0.98136677, 0.84123594, 0.60546483, 0.34890909,
//                                0.15302337, 0.08};

//     auto receivedHamming = MathUtil::hamming(12);

//     for (int i = 0; i < 12; i++)
//     {
//         CHECK(abs(receivedHamming[i]) == Approx(expectedHamming[i]).epsilon(EPSILON));
//     }
// }

// TEST_CASE("MathUtil FFT", "[MathUtil]")
// {
//     auto testFFT = [](int size, int freq)
//     {
//         auto amplitudes = generateSin(size, freq);
//         MathUtil::fft(amplitudes, size);

//         int maxIndex = -1;
//         double maxValue = 0;
//         for (int i = 0; i < size; i++)
//         {
//             double thisMax = abs(amplitudes[i]);
//             if (maxIndex < 0 || thisMax > maxValue)
//             {
//                 maxIndex = i;
//                 maxValue = thisMax;
//             }
//         }

//         CHECK(maxIndex == Approx(freq).epsilon(0.0001));
//     };

//     int size = 32;
//     testFFT(size, 1);
//     testFFT(size, 2);
//     testFFT(size, 4);
//     testFFT(size, 8);
// }

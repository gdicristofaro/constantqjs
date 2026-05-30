#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>

#include "TestHelpers.hpp"
#include "ConstantQ.hpp"

using namespace constantq;
using Catch::Matchers::WithinRel;

TEST_CASE("ConstantQ Transformation", "[ConstantQ]")
{
    double C5 = 523.25;
    double E5 = 659.25;
    double G5 = 783.99;

    // C major data
    double testData[24] = {0.08075227151737176, 0.03708508808436413, 0.000682180100604102, 0.0006332065378151342, 0.0003164492087528874, 0.0004230164384114508, 0.0011948293107657425, 0.034648242232954554, 0.0806427602498084, 0.03674218964859396, 0.0003842349974780487, 0.0005833533763315809, 0.000375308553661762, 0.03477633242451615, 0.08063844061807411, 0.03777762157307901, 0.00033633519132072174, 0.0005250309281197117, 0.000410580101873855, 0.00034432758998011805, 0.0003034458853346755, 0.000256669496804819, 0.00023439176645411168, 0.00020886088738239738};

    auto sparseKernel = testSparseKernel();
    vector<complex<double>> buff(sparseKernel.size());
    insertSin(buff, 44100, .3, C5);
    insertSin(buff, 44100, .3, E5);
    insertSin(buff, 44100, .3, G5);
    vector<complex<double>> toRet(sparseKernel.bins());
    ConstantQ::constantQ(buff, toRet, sparseKernel);

    for (int i = 0; i < 24; i++)
    {
        CHECK_THAT(toRet[i], WithinRel(testData[i], testData[i] / 1000));
    }
}

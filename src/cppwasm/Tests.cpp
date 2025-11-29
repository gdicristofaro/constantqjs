#include "ConstantQ.hpp"
#include "ConstantQMultiThreaded.hpp"
#include "ConstantQSession.hpp"
#include "KernelEntry.hpp"
#include "MathUtil.hpp"
#include "SparseKernel.hpp"

#include <string>
#include <optional>
#include <iostream>
#include <cmath>
#include <map>

using namespace std;
using namespace constantq;

void test(bool passed, string suiteName, string testName) {
    if (passed)
        cout << "Test: " << suiteName << " " << testName << " passed.\n";
    else
        cout << "Test: " << suiteName << " " << testName << " FAILED.\n";
}

bool equal(double d1, double d2, double epsilon) {
    return abs(d1 - d2) < epsilon;   
}

void test(string suiteName, string testName, double expected, double received, double epsilon) {
    if (equal(expected,received,epsilon))
        cout << "Test: " << suiteName << " " << testName << " passed.\n";
    else
        cout << "Test: " << suiteName << " " << testName << " FAILED. Expected " << expected << " and received " << received << " \n";
}



void leadingZerosTest() {
    string suiteName = "MathUtil Leading Zeros";
    test(MathUtil::leadingZeros(0x00F00000) == 8, suiteName, "1");
    test(MathUtil::leadingZeros(0x70F00000) == 1, suiteName, "2");
    test(MathUtil::leadingZeros(0x000000F0) == 24, suiteName, "3");
    test(MathUtil::leadingZeros(0x00000001) == 31, suiteName, "4");
    test(MathUtil::leadingZeros(0x00000000) == 32, suiteName, "5");
    test(MathUtil::leadingZeros(0xF0F0F0F0) == 0, suiteName, "6");
}


void reverseTests() {
    string suiteName = "MathUtil Reverse";
    test(MathUtil::reverse(0x00000001) == 0x80000000, suiteName, "1");
    test(MathUtil::reverse(0xFFFFFFFF) == 0xFFFFFFFF, suiteName, "2");
    test(MathUtil::reverse(0x00000000) == 0x0, suiteName, "3");
    test(MathUtil::reverse(0x00F00000) == 0x00000F00, suiteName, "4");
}

void nextPow2Tests() {
    string suiteName = "MathUtil Next Power 2";
    test(MathUtil::nextPow2(15) == 4, suiteName, "1");
    test(MathUtil::nextPow2(16) == 4, suiteName, "2");
    test(MathUtil::nextPow2(17) == 5, suiteName, "3");
    test(MathUtil::nextPow2(2) == 1, suiteName, "4");
}


double EPSILON = 0.00000001;

void hammingWindowTest() {
    //taken from https://docs.scipy.org/doc/numpy-1.13.0/reference/generated/numpy.hamming.html
    double expectedHamming[12] { 0.08, 0.15302337, 0.34890909, 0.60546483, 0.84123594,
        0.98136677, 0.98136677, 0.84123594, 0.60546483, 0.34890909,
        0.15302337, 0.08 };

    string suiteName = "hamming test";
    auto receivedHamming = MathUtil::hamming(12);
    for (int i = 0; i < 12; i++) {
        test(suiteName, to_string(i), expectedHamming[i], abs(receivedHamming[i]), EPSILON);
    }
}

void insertSin(vector<complex<double> >& buff, int fps, double maxAmplitude, double freq) {
    auto sz = buff.size();
    for (int x = 0; x < sz; x++)
        buff[x] += maxAmplitude * sin(M_PI * x * 2 * freq / fps);
}


vector<complex<double> > generateSin(int size, int freq) {
    vector<complex<double> > toGen(size, 0);
    insertSin(toGen, size, 10, freq);
    return toGen;
}

void verifyFFT(int size, int freq) {
    auto amplitudes = generateSin(size,freq);
    MathUtil::fft(amplitudes, size);

    // cout << "array for freq " << freq << ": ";
    // for (int x = 0; x < size; x++)
    //     cout << amplitudes[x] << " ";
    // cout << "\n\n\n";

    int maxIndex = -1;
    double maxValue = 0;
    for (int i = 0; i < size; i++) {
        double thisMax = abs(amplitudes[i]);
        if (maxIndex < 0 ||  thisMax > maxValue) {
            maxIndex = i;
            maxValue = thisMax;
        }
    }

    test("FFT test", to_string(freq), freq, maxIndex, .0001);
}

void fftTests() {
    auto size = 32;
    verifyFFT(size, 1);
    verifyFFT(size, 2);
    verifyFFT(size, 4);
    verifyFFT(size, 8);
}

void MathUtilTests() {
    leadingZerosTest();
    reverseTests();
    nextPow2Tests();
    hammingWindowTest();
    fftTests();
}


SparseKernel testSparseKernel() {
    vector<vector<KernelEntry>> sparseKernel;
    vector<KernelEntry> vector1= {KernelEntry(46, complex<double>(0.000002352004883269462, 0.0000015302385737759976)),KernelEntry(47, complex<double>(-0.00004182602200164195, 0.000015692081087473787)),KernelEntry(48, complex<double>(0.00003135666320406002, -0.00011065080128743238)),KernelEntry(49, complex<double>(0.00007552136224914383, 0.00009739172890646987)),KernelEntry(50, complex<double>(-0.0000569198938918941, 0.0000013957473002901034)),KernelEntry(51, complex<double>(0.0000035749416089320624, -0.000005108954263055208))};
    sparseKernel.push_back(vector1);
    vector<KernelEntry> vector2= {KernelEntry(48, complex<double>(-0.000008933599829937823, 0.000021132563029721028)),KernelEntry(49, complex<double>(-0.00005023813632693113, -0.00007364352198555173)),KernelEntry(50, complex<double>(0.0001317420828181083, -0.0000034907961181410896)),KernelEntry(51, complex<double>(-0.00004717792471313428, 0.00007769977633051555)),KernelEntry(52, complex<double>(-0.00001056687903742544, -0.00002171202023873263))};
    sparseKernel.push_back(vector2);
    vector<KernelEntry> vector3= {KernelEntry(49, complex<double>(0.000003550966889158102, 0.000007121549399018907)),KernelEntry(50, complex<double>(-0.000057656748553550936, -0.0000027852756939875435)),KernelEntry(51, complex<double>(0.00006434773125027517, -0.00010284497627158745)),KernelEntry(52, complex<double>(0.00005768476564812072, 0.00010536706589840599)),KernelEntry(53, complex<double>(-0.00005579443465838086, -5.53545925911979e-7)),KernelEntry(54, complex<double>(0.0000036083568440548934, -0.0000062913765904204125))};
    sparseKernel.push_back(vector3);
    vector<KernelEntry> vector4= {KernelEntry(51, complex<double>(-0.00001903929247756908, 0.000023075112556970202)),KernelEntry(52, complex<double>(-0.000039405521969878784, -0.00008610825081392477)),KernelEntry(53, complex<double>(0.00013175437520868865, 0.000002975300922751483)),KernelEntry(54, complex<double>(-0.00004258485158863621, 0.00008294149836132007)),KernelEntry(55, complex<double>(-0.000017288572363317303, -0.00002299378833696595))};
    sparseKernel.push_back(vector4);
    vector<KernelEntry> vector5= {KernelEntry(52, complex<double>(0.000002863184695232003, 0.000010045483183967415)),KernelEntry(53, complex<double>(-0.000059596898939399444, -0.000006979059509505646)),KernelEntry(54, complex<double>(0.000058826383482534785, -0.00010496874812174607)),KernelEntry(55, complex<double>(0.00007618751502139411, 0.00009700835497905872)),KernelEntry(56, complex<double>(-0.0000628562282333613, 0.000017499124092245966)),KernelEntry(57, complex<double>(0.0000015703238572294086, -0.000012732800329051603))};
    sparseKernel.push_back(vector5);
    vector<KernelEntry> vector6= {KernelEntry(54, complex<double>(-0.000016736409963142112, 0.000022947222046106724)),KernelEntry(55, complex<double>(-0.000050440163000333986, -0.00007334915871176734)),KernelEntry(56, complex<double>(0.0001265073331642319, -0.000034218002947202456)),KernelEntry(57, complex<double>(-0.000007815945617363075, 0.00010531176693690765)),KernelEntry(58, complex<double>(-0.00003943771074941523, -0.000017249944343707284)),KernelEntry(59, complex<double>(0.0000032856314135215663, -0.0000035228761529928468))};
    sparseKernel.push_back(vector6);
    vector<KernelEntry> vector7= {KernelEntry(55, complex<double>(0.000003537886357777957, 0.000007237944687201443)),KernelEntry(56, complex<double>(-0.00004982657327947792, 0.000008597126723007385)),KernelEntry(57, complex<double>(0.000012487687385556558, -0.00011011078820674221)),KernelEntry(58, complex<double>(0.00012002451000574997, 0.000050281312021906714)),KernelEntry(59, complex<double>(-0.000054364631984323255, 0.00006715914309936706)),KernelEntry(60, complex<double>(-0.000015853813762297468, -0.000022852818422346384))};
    sparseKernel.push_back(vector7);
    vector<KernelEntry> vector8= {KernelEntry(57, complex<double>(-0.000004618623995057892, 0.000018934969252801516)),KernelEntry(58, complex<double>(-0.00006423166424558864, -0.000032636593927670815)),KernelEntry(59, complex<double>(0.00007995867567545676, -0.00009474232656961828)),KernelEntry(60, complex<double>(0.00007326434771786695, 0.00009861652809543298)),KernelEntry(61, complex<double>(-0.00006417503142912229, 0.000027746969726075245)),KernelEntry(62, complex<double>(-0.0000032155817658949454, -0.000017953467225270977))};
    sparseKernel.push_back(vector8);
    vector<KernelEntry> vector9= {KernelEntry(58, complex<double>(0.0000025960067928389695, 0.0000019028228890570669)),KernelEntry(59, complex<double>(-0.000024038221912331158, 0.00002279237133105432)),KernelEntry(60, complex<double>(-0.00004915156434580802, -0.00007513179096142268)),KernelEntry(61, complex<double>(0.0001198396094521565, -0.000050646127609041284)),KernelEntry(62, complex<double>(0.00002483450954160028, 0.00011086241697980034)),KernelEntry(63, complex<double>(-0.000057425526412460294, 0.0000023499040998718314)),KernelEntry(64, complex<double>(0.0000017366180048983637, -0.000012451408506191812))};
    sparseKernel.push_back(vector9);
    vector<KernelEntry> vector10= {KernelEntry(60, complex<double>(0.0000034829491587326534, 0.000007642364845116784)),KernelEntry(61, complex<double>(-0.00004449552148693408, 0.000013666514533077785)),KernelEntry(62, complex<double>(-0.0000172299544286165, -0.00010136122109864793)),KernelEntry(63, complex<double>(0.0001316704519411804, -0.000005105424458626771)),KernelEntry(64, complex<double>(-0.000009537663971990426, 0.00010467440072682905)),KernelEntry(65, complex<double>(-0.00004779429211676031, -0.000010712219856463808)),KernelEntry(66, complex<double>(0.0000032327752363036348, -0.000008853223285150418))};
    sparseKernel.push_back(vector10);
    vector<KernelEntry> vector11= {KernelEntry(62, complex<double>(3.0874012937320657e-7, 0.000014537077745744958)),KernelEntry(63, complex<double>(-0.000058004340417552, -0.0000034882883154619957)),KernelEntry(64, complex<double>(0.000015719317511917437, -0.00011045334664700287)),KernelEntry(65, complex<double>(0.0001280188948040257, 0.000028986363245777028)),KernelEntry(66, complex<double>(-0.000029530314147788617, 0.00009413840200904334)),KernelEntry(67, complex<double>(-0.00004064613643074515, -0.000016483486929807718)),KernelEntry(68, complex<double>(0.0000035571732441142266, -0.000007062654102231268))};
    sparseKernel.push_back(vector11);
    vector<KernelEntry> vector12= {KernelEntry(64, complex<double>(-0.000005877205268604191, 0.000019689244442588703)),KernelEntry(65, complex<double>(-0.00006354943704487025, -0.000021384046793833786)),KernelEntry(66, complex<double>(0.00004110930385882894, -0.00010951255761993607)),KernelEntry(67, complex<double>(0.00012019641566551073, 0.00004991702613965661)),KernelEntry(68, complex<double>(-0.00003932548405748986, 0.00008617059312540756)),KernelEntry(69, complex<double>(-0.00003716575150289781, -0.00001853661418287825)),KernelEntry(70, complex<double>(0.000003593270848799376, -0.000006621975493516169))};
    sparseKernel.push_back(vector12);
    vector<KernelEntry> vector13= {KernelEntry(65, complex<double>(0.000001897764625537814, 9.794099103005828e-7)),KernelEntry(66, complex<double>(-0.000010948605142551551, 0.000021827261537179486)),KernelEntry(67, complex<double>(-0.00006424632449569974, -0.000031306256369883006)),KernelEntry(68, complex<double>(0.00005082669912082494, -0.00010742720496736529)),KernelEntry(69, complex<double>(0.00011798894772883891, 0.000054171356256767854)),KernelEntry(70, complex<double>(-0.00003864882929113499, 0.00008679963622358728)),KernelEntry(71, complex<double>(-0.00003965352856960587, -0.0000171124293830724)),KernelEntry(72, complex<double>(0.000003397673246582881, -0.000008129025467234847))};
    sparseKernel.push_back(vector13);
    vector<KernelEntry> vector14= {KernelEntry(67, complex<double>(0.00000252601122151692, 0.0000017882794716693143)),KernelEntry(68, complex<double>(-0.000014169071314775082, 0.000022597576019698398)),KernelEntry(69, complex<double>(-0.00006410279236420831, -0.000035358060467959927)),KernelEntry(70, complex<double>(0.00005154395321885383, -0.0001072325447614741)),KernelEntry(71, complex<double>(0.00012028216665680434, 0.00004973497010262103)),KernelEntry(72, complex<double>(-0.00003220442758428736, 0.00009218627160488858)),KernelEntry(73, complex<double>(-0.00004526575699333505, -0.00001302112584801717)),KernelEntry(74, complex<double>(0.000002497339228972406, -0.000010956335335066886))};
    sparseKernel.push_back(vector14);
    vector<KernelEntry> vector15= {KernelEntry(69, complex<double>(0.0000028078740571197417, 0.000002287305626943442)),KernelEntry(70, complex<double>(-0.000015050831179506998, 0.000022741520149216062)),KernelEntry(71, complex<double>(-0.00006418158294567013, -0.00003387993422348383)),KernelEntry(72, complex<double>(0.0000443596076415908, -0.00010891956661864403)),KernelEntry(73, complex<double>(0.00012551783926654912, 0.00003715772491977369)),KernelEntry(74, complex<double>(-0.0000191866927729217, 0.00010037386617986474)),KernelEntry(75, complex<double>(-0.000052951296351812924, -0.000004774899760454162)),KernelEntry(76, complex<double>(-1.3580174754304624e-7, -0.000015072456372887518))};
    sparseKernel.push_back(vector15);
    vector<KernelEntry> vector16= {KernelEntry(71, complex<double>(0.0000028266677094130235, 0.0000023247251387237535)),KernelEntry(72, complex<double>(-0.000013740307179053006, 0.00002251661927208416)),KernelEntry(73, complex<double>(-0.0000641640687914089, -0.00002770086043301717)),KernelEntry(74, complex<double>(0.00003030102926855397, -0.00011069516374951056)),KernelEntry(75, complex<double>(0.00013054837472180277, 0.000016646751489265418)),KernelEntry(76, complex<double>(0.0000014622811484855273, 0.0001080731545885586)),KernelEntry(77, complex<double>(-0.00006052348512510694, 0.000009388118473306681)),KernelEntry(78, complex<double>(-0.00000598438644585836, -0.000019747509837598835)),KernelEntry(79, complex<double>(0.0000017064198904474763, -7.921360368517546e-7))};
    sparseKernel.push_back(vector16);
    vector<KernelEntry> vector17= {KernelEntry(73, complex<double>(0.0000021316882536249823, 0.0000012414926063769048)),KernelEntry(74, complex<double>(-0.000007363554078997926, 0.000020451456920990764)),KernelEntry(75, complex<double>(-0.00006075641485945659, -0.000010043333096329934)),KernelEntry(76, complex<double>(-0.00000192439312201792, -0.00010717730917544869)),KernelEntry(77, complex<double>(0.00012874068013825972, -0.000026060844603683055)),KernelEntry(78, complex<double>(0.00004374114287631142, 0.00010903640807336076)),KernelEntry(79, complex<double>(-0.00006361604180708572, 0.00004017563458906188)),KernelEntry(80, complex<double>(-0.00002124952812682063, -0.00002303692324059974)),KernelEntry(81, complex<double>(0.0000035301524782169195, -0.000004702378621118089))};
    sparseKernel.push_back(vector17);
    vector<KernelEntry> vector18= {KernelEntry(75, complex<double>(0.0000014286677455448332, 5.597090180172399e-7)),KernelEntry(76, complex<double>(-0.00000269637275427611, 0.000017544069635218568)),KernelEntry(77, complex<double>(-0.00005373831790326459, 0.0000036811782285901997)),KernelEntry(78, complex<double>(-0.000028272606540028706, -0.00009498994558519415)),KernelEntry(79, complex<double>(0.00011260649172923353, -0.00006301426459923249)),KernelEntry(80, complex<double>(0.00008310944968059167, 0.00009266766158542295)),KernelEntry(81, complex<double>(-0.000051311087520168044, 0.00007205180146183783)),KernelEntry(82, complex<double>(-0.00004007371930731524, -0.000016845441080961908)),KernelEntry(83, complex<double>(0.0000021064446598134567, -0.000011773434027809672))};
    sparseKernel.push_back(vector18);
    vector<KernelEntry> vector19= {KernelEntry(78, complex<double>(0.0000017220829843223614, 0.000012474698153901206)),KernelEntry(79, complex<double>(-0.00004014053860195079, 0.000016802097435843688)),KernelEntry(80, complex<double>(-0.00005317804750576229, -0.00006913590576417418)),KernelEntry(81, complex<double>(0.00007510365278801509, -0.00009759568884849284)),KernelEntry(82, complex<double>(0.00012001074694496085, 0.000050265969216156545)),KernelEntry(83, complex<double>(-0.000014207332358041768, 0.00010274708297681515)),KernelEntry(84, complex<double>(-0.000059719410065028444, 0.0000073123874603947795)),KernelEntry(85, complex<double>(-0.000008374119430529622, -0.000020900401356413334)),KernelEntry(86, complex<double>(0.0000026305557196944678, -0.0000019598921800611995))};
    sparseKernel.push_back(vector19);
    vector<KernelEntry> vector20= {KernelEntry(80, complex<double>(0.0000036078034816780997, 0.00000631833824353496)),KernelEntry(81, complex<double>(-0.000021660937461968262, 0.000023012910664974706)),KernelEntry(82, complex<double>(-0.0000642343943092937, -0.00003169047396355142)),KernelEntry(83, complex<double>(0.000018021512459442708, -0.00011062089535845212)),KernelEntry(84, complex<double>(0.00013037143909666138, -0.000017751886584193498)),KernelEntry(85, complex<double>(0.000049680450765166606, 0.00010771198190584442)),KernelEntry(86, complex<double>(-0.000060352150651548115, 0.000053899677388150346)),KernelEntry(87, complex<double>(-0.00003343951212194323, -0.000020272083155385713)),KernelEntry(88, complex<double>(0.0000026715960838938004, -0.000010543554745514596))};
    sparseKernel.push_back(vector20);
    vector<KernelEntry> vector21= {KernelEntry(82, complex<double>(0.00000265396225094637, 0.000002000054293595264)),KernelEntry(83, complex<double>(-0.000006474067383876402, 0.000020008507262468164)),KernelEntry(84, complex<double>(-0.00005543733985357323, 0.0000011055516027142904)),KernelEntry(85, complex<double>(-0.00003355525738338968, -0.00009112822958565324)),KernelEntry(86, complex<double>(0.00009819042462776586, -0.00008033071469037655)),KernelEntry(87, complex<double>(0.00010945748326182192, 0.00006744602933947161)),KernelEntry(88, complex<double>(-0.000022033974405357376, 0.00009882972456067796)),KernelEntry(89, complex<double>(-0.00005949789971149162, 0.0000067829161529741625)),KernelEntry(90, complex<double>(-0.000010355751379111577, -0.000021637321227047427)),KernelEntry(91, complex<double>(0.00000315981788908581, -0.000003121264419541619))};
    sparseKernel.push_back(vector21);
    vector<KernelEntry> vector22= {KernelEntry(85, complex<double>(0.000002372563150644731, 0.00001123007219508918)),KernelEntry(86, complex<double>(-0.000032025926977593256, 0.00002081626938854002)),KernelEntry(87, complex<double>(-0.00006270778151719561, -0.00004536470755786791)),KernelEntry(88, complex<double>(0.000029236308466227983, -0.00011073820283079369)),KernelEntry(89, complex<double>(0.000130840096064975, -0.000014455014776174353)),KernelEntry(90, complex<double>(0.00005504260289834391, 0.00010619640983150639)),KernelEntry(91, complex<double>(-0.000056266508025687185, 0.00006357956872254143)),KernelEntry(92, complex<double>(-0.00004192538512910393, -0.000015603877985041067)),KernelEntry(93, complex<double>(-1.7930561196797382e-7, -0.000015121008448424717)),KernelEntry(94, complex<double>(0.0000014595597078111336, -5.829885119801174e-7))};
    sparseKernel.push_back(vector22);
    vector<KernelEntry> vector23= {KernelEntry(87, complex<double>(0.0000031194500343875643, 0.0000030074579186066573)),KernelEntry(88, complex<double>(-0.00000789371946480677, 0.00002069161649379721)),KernelEntry(89, complex<double>(-0.00005480504425094148, 0.000002095584145168545)),KernelEntry(90, complex<double>(-0.00004023777512238189, -0.00008527368065156562)),KernelEntry(91, complex<double>(0.00008270337961777376, -0.00009292977177206403)),KernelEntry(92, complex<double>(0.0001238288059434515, 0.000041664280677487416)),KernelEntry(93, complex<double>(0.000008570879553502931, 0.00010951641288894326)),KernelEntry(94, complex<double>(-0.00006418674603406387, 0.00003347931622567414)),KernelEntry(95, complex<double>(-0.000027103361871966374, -0.000022249100012149492)),KernelEntry(96, complex<double>(0.0000029048027880930822, -0.000009926434036944176))};
    sparseKernel.push_back(vector23);
    vector<KernelEntry> vector24= {KernelEntry(90, complex<double>(0.0000027869235676431453, 0.000010248834633269206)),KernelEntry(91, complex<double>(-0.00002650204883268519, 0.000022374815014708455)),KernelEntry(92, complex<double>(-0.00006422190970457425, -0.000029764170932932622)),KernelEntry(93, complex<double>(-1.788257800883935e-7, -0.00010764147997367575)),KernelEntry(94, complex<double>(0.00011753711741855046, -0.00005494868884494582)),KernelEntry(95, complex<double>(0.00009707058034243786, 0.00008140264443140291)),KernelEntry(96, complex<double>(-0.000025902619741415735, 0.00009652162043090955)),KernelEntry(97, complex<double>(-0.000060967462848714516, 0.000010683223737564062)),KernelEntry(98, complex<double>(-0.000015944474678650693, -0.000022855976058766255)),KernelEntry(99, complex<double>(0.0000036107241296416823, -0.000006219018348707141))};
    sparseKernel.push_back(vector24);

    return SparseKernel(sparseKernel, 4096, 24);
}

void sparseKernelTests() {
    auto expected = testSparseKernel();
    auto result = ConstantQ::sparseKernel(44100, 523.25, 1046.5, 24, .0054);
            
    test("sparse kernel test", "bins", expected.bins(), result.bins(), EPSILON);
    test("sparse kernel test", "size", expected.size(), result.size(), EPSILON);
    test("sparse kernel test", "matrixSize", expected.matrix().size(), result.matrix().size(), EPSILON);

    for (int a = 0; a < expected.matrix().size(); a++) {
        auto thisExpectedMatrix = expected.matrix()[a];
        auto thisResultMatrix = result.matrix()[a];

        test("sparse kernel test", "matrixSize at index " + to_string(a), 
            thisExpectedMatrix.size(), thisResultMatrix.size(), EPSILON);

        map<int, complex<double>> expectedMapping;
        for (int b = 0; b < thisExpectedMatrix.size(); b++)
            expectedMapping[thisExpectedMatrix[b].fftIndex()] = thisExpectedMatrix[b].multiplier();
        
        for (int b = 0; b < thisResultMatrix.size(); b++) {
            auto thisEntry = thisResultMatrix[b];
            auto thisFftIndex = thisEntry.fftIndex();
            auto thisMultiplier = thisEntry.multiplier();

            test("sparse kernel test", 
                "matrix item at [" + to_string(a) + "][" + to_string(thisFftIndex) + "]",
                abs(thisMultiplier), abs(expectedMapping[thisFftIndex]), (abs(thisMultiplier) / 1000));
        }
    }

}

double C5 = 523.25;
double E5 = 659.25;
double G5 = 783.99;

void ConstantQTests() {
    // C major data
    double testData[24] = { 0.08075227151737176,0.03708508808436413,0.000682180100604102,0.0006332065378151342,0.0003164492087528874,0.0004230164384114508,0.0011948293107657425,0.034648242232954554,0.0806427602498084,0.03674218964859396,0.0003842349974780487,0.0005833533763315809,0.000375308553661762,0.03477633242451615,0.08063844061807411,0.03777762157307901,0.00033633519132072174,0.0005250309281197117,0.000410580101873855,0.00034432758998011805,0.0003034458853346755,0.000256669496804819,0.00023439176645411168,0.00020886088738239738 };
    auto sparseKernel = testSparseKernel();
    vector<complex<double> > buff(sparseKernel.size());
    insertSin(buff, 44100, .3, C5);
    insertSin(buff, 44100, .3, E5);
    insertSin(buff, 44100, .3, G5);
    vector<complex<double> > toRet(sparseKernel.bins());
    ConstantQ::constantQ(buff, toRet, sparseKernel);

    for (int i = 0; i < 24; i++)
        test("constant q tests", "item " + to_string(i), testData[i], abs(toRet[i]), testData[i] / 1000);
}




int main() {
    MathUtilTests();
    sparseKernelTests();
    ConstantQTests();
    return 0;
}


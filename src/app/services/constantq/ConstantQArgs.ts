/**
 * Arguments to be passed to ConstantQ.constantQ.  These arguments are 
 * specifically used for communication between ConstantQDataUtil.processMessage
 * and ConstantQWorker.
 */
export default class ConstantQArgs {
    readonly argType = "ConstantQ";
    // the index in array to place data
    startFrame : number;
    // interval between start frames
    analysisInterval: number;
    // number of total analysis to return
    totalAnalyses: number;
}
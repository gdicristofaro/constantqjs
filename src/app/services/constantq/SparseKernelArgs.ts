/**
 * Arguments to be passed to ConstantQ.sparseKernel.  These arguments are 
 * specifically used for communication between ConstantQDataUtil.processMessage
 * and ConstantQWorker.
 */
export default class SparseKernelArgs {
    readonly argType = "SparseKernel";
    // frames per second
    fs : number;
    minFreq? : number;
    maxFreq? : number;
    bins? : number;
    thresh? : number;
    buffer: number[];
}
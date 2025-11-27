import ConstantQData from './ConstantQData';
import ConstantQ from './ConstantQ';
import Complex from './Complex';
import { Subject, Observable } from 'rxjs';
import { Pitch } from './Pitch';

/**
 * the return message type along with data
 */
export type ConstantQMessage = 
    // completion is [0,1] and displays as a percentage
    {status: 'Loading', message: string, completion?: number } |
    {status: 'Complete', data: ConstantQData } |
    {status: 'Error', message: string }

/**
 * utilities for generating Constant Q data for an entire song
 */
export default class ConstantQDataUtil {
    // how often user will get updates
    static readonly PERCENTAGE_INCREMENTS = 5;

    /**
     * pads the processed info array so that all frames for the length of the song are covered
     * (assume last frame will be copied for the length of the song)
     * 
     * @param retArr        the return array
     * @param frameRate     length in seconds of frames in the array
     * @param seconds       the total length of the song in seconds
     * @return              the padded array
     */
    private static padAudioArray(retArr, frameRate, seconds) {
        if (!retArr || !retArr.length)
            return retArr;

        let totalExpectedFrames = Math.ceil(seconds / frameRate);
        let totalFrames = retArr.length;
        let lastFrame = retArr[retArr.length - 1];
        let paddedArr = [];
        let paddedArrayNum = totalExpectedFrames - totalFrames;
        for (let i = 0; i < paddedArrayNum; i++)
            paddedArr.push(lastFrame);

        return [...retArr, ...paddedArr];
    }
    /**
     * creates constant q data by sending and receiving data from
     * wasm worker
     * 
     * @param buffer    the buffer to analyze
     * @param minFreq   the minimum frequency to utilize in constant q
     * @param maxFreq   the maximum frequency to utilize in constant q
     * @param bins      the number of bins
     * @param thresh    the threshold for constant q
     * @param sampleInterval        the number of analysis per second (default is 16)
     * @returns         the generated ConstantQData subject which yields
     *                  results like:
     *                  {
     *                      status: 'Error'|'Loading'|'Complete'
     *                      message: string
     *                      [completion?]: percentage complete
     *                      [data?]: on complete, returns ConstantQData
     *                  }
     */
    static messageProcessing(buffer: AudioBuffer,
        minPitch: Pitch = ConstantQ.DEFAULT_MIN_FREQ,
        maxPitch: Pitch = ConstantQ.DEFAULT_MAX_FREQ,
        bins: number = ConstantQ.DEFAULT_BINS,
        thresh: number = ConstantQ.DEFAULT_THRESH,
        fps: number = ConstantQ.DEFAULT_FPS) : Observable<ConstantQMessage> {

        const subject = new Subject<ConstantQMessage>();

        try {
                
            let amplitudeBuffer = new (<any> window).Module.VectorDouble();
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                let floatData = buffer.getChannelData(c);
                for (let i = 0; i < buffer.length; i++) {
                    if (c == 0)
                        amplitudeBuffer.push_back(floatData[i])
                    else
                        amplitudeBuffer[i] = amplitudeBuffer[i] + floatData[i];
                }
            }

            let retArr = [];
            let count = 0;
            let totCount = 0;

            let dataUpdate = (i,b,val) => {
                while (retArr.length <= i)
                    retArr[i] = [];

                while (retArr[i].length < b)
                    retArr.push(undefined);
                
                retArr[i][b] = val;
            }

            let statusUpdate = (status, num) => {
                switch (status) {
                    case 0: 
                        subject.next({status:"Loading", message:"Calculating Sparse Kernel"});
                        break;
                    case 1: 
                        totCount = num;
                        subject.next({status:"Loading", message:"Parsing Constant Q Data", completion:0});
                        break;
                    case 2: 
                        count += num;
                        if (count >= totCount) {
                            (<any> window).removeFunction(statusUpdate);
                            (<any> window).removeFunction(dataUpdate);
                            let paddedArr = ConstantQDataUtil.padAudioArray(
                                                retArr, 1/fps, buffer.duration);

                            let constantqdata = new ConstantQData(paddedArr, 1/fps, minPitch, maxPitch);
                            subject.next({status:"Complete", data: constantqdata});
                        }
                        else {
                            subject.next({status:"Loading", message:"Parsing Constant Q Data", completion:count / totCount});
                        }
                            
                        break;
                }
            };

            let statUpdateFunc = (<any> window).addFunction(statusUpdate, 'vii');
            let dataUpdateFunc = (<any> window).addFunction(dataUpdate, 'viid');

            (<any> window).Module.evaluate(
                buffer.sampleRate, minPitch.frequency, maxPitch.frequency, bins, thresh, 
                buffer.sampleRate / fps, 20, amplitudeBuffer, 
                statUpdateFunc.toString(), dataUpdateFunc.toString());
        }
        catch (e) {
            subject.next({status:"Error", message:e.toString()});
        }
        
        return subject;
    }





    /**
     * process an audio buffer and generate a ConstantQData object 
     * representing all the audio data for song
     * @param buffer    the buffer to analyze
     * @param minFreq   the minimum frequency to utilize in constant q
     * @param maxFreq   the maximum frequency to utilize in constant q
     * @param bins      the number of bins
     * @param thresh    the threshold for constant q
     * @param sampleInterval        the number of frames between analysis 
     *                              (if undefined use sparse kernel length)
     * @returns         the generated ConstantQData
     */
    static process(buffer: AudioBuffer,
        minPitch: Pitch = ConstantQ.DEFAULT_MIN_FREQ,
        maxPitch: Pitch = ConstantQ.DEFAULT_MAX_FREQ,
        bins: number = ConstantQ.DEFAULT_BINS,
        thresh: number = ConstantQ.DEFAULT_THRESH,
        sampleInterval: number = undefined) {
            
        // create the sparse kernel
        const sparseKernel = ConstantQ.sparseKernel(
            buffer.sampleRate, minPitch.frequency, maxPitch.frequency, bins, thresh);

        if (!sampleInterval)
            sampleInterval = sparseKernel.size;
            
        // create a buffer to hold amplitude data from the audio buffer
        const complexBuff = new Array<Complex>(sparseKernel.size);

        // get basic information about the audio like number of channels and length of audio
        const channels = buffer.numberOfChannels;
        const bufferLength = buffer.getChannelData(0).length;

        // the constant q data
        const constantQData = new Array<Array<number>>();

        // the current start position within
        var bufferStartPos = 0;

        // iterate through audio buffer and determine constant q data
        while (bufferStartPos + sparseKernel.size  <= bufferLength) {
            for (let c = 0; c < channels; c++) {
                const bufferData = buffer.getChannelData(c);

                for (let i = 0; i < complexBuff.length; i++) {
                    if (c === 0)
                        complexBuff[i] = new Complex(bufferData[bufferStartPos + i] / channels, 0);
                    else
                        complexBuff[i] = complexBuff[i].add(new Complex(bufferData[bufferStartPos + i] / channels, 0));
                }
            }

            constantQData.push(ConstantQ.constantQ(complexBuff, sparseKernel).map(c => c.abs()));

            bufferStartPos += sampleInterval;
        }

        // return the pertinent constant q data
        return new ConstantQData(constantQData, sampleInterval / buffer.sampleRate, 
            minPitch, maxPitch);
    }
}
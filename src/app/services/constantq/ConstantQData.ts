import { Pitch } from './Pitch';

/**
 * holds constant q data for an entire song
 */
export default class ConstantQData {
    /**
     * the constant q data for an entire audio buffer
     * @param constQData        the buffer data.  
     *                          index 1 represents each time step
     *                          index 2 is each bin of constant q data
     * @param secResolution     the length of a time step
     */
    constructor(
        public readonly constQData : number[][], 
        public readonly secResolution: number,
        public readonly lowPitch: Pitch,
        public readonly highPitch: Pitch) {}

    /**
     * gets the constant q data for the second position provided
     * @param secPos        the second position
     * @returns             the constant q data 
     *                      (array where each bin is amplitude for that bin's frequency)
     */
    getData(secPos : number) {
        return this.constQData[Math.max(0, Math.floor(secPos / this.secResolution))];
    }
}
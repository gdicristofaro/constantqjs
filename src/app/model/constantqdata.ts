import { Pitch } from './pitch';

/**
 * holds constant q data for an entire song
 */
export default interface ConstantQData {
  constQData: number[][];
  secResolution: number;
  lowPitch: Pitch;
  highPitch: Pitch;
}

/**
 * gets the constant q data for the second position provided
 * @param constantQData    the constant q data.
 * @param secPos        the second position
 * @returns             the constant q data
 *                      (array where each bin is amplitude for that bin's frequency)
 */
export function getData(constantQData?: ConstantQData, secPos?: number) {
  return constantQData?.constQData[
    Math.max(0, Math.floor((secPos ?? 0) / constantQData.secResolution))
  ];
}

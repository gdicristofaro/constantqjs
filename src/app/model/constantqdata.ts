/**
 * Contains Constant-Q transform analysis results
 * @interface ConstantQData
 * @property {number[][]} constantQData - 2D array where each row is a time frame and columns are frequency bins
 * @property {number} graphMax - The maximum value across all bins for scaling visualization
 */
export interface ConstantQData {
  constantQData: number[][];
  graphMax: number;
}

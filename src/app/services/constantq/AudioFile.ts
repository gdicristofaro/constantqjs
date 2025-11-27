import {MegabytesPipe} from '../megabytes.pipe';

interface BaseAudioFile {
    
}

/**
 * defines an audio file record with pertinent details gathered from archive.org
 */
interface BaseAudioFile {  
    // the display file name
    filename?: string;

    // the file size
    size?: number;
}

type FileSource = {file: File};
type UrlSource = {url: string};
export {FileSource, UrlSource};

type AudioFile = (BaseAudioFile & FileSource) | (BaseAudioFile & UrlSource);
export default AudioFile;


const bytesPipe = new MegabytesPipe();

/**
 * provides a simple file formatter to display the file name with file size
 * @param val   the audio file to display
 * @returns     the string representing the file
 */
export const fileFormatter = (val : AudioFile) => {
    return `${val.filename}${(val.size) ? ` (${bytesPipe.transform(val.size, undefined)})` : ""}`;
}

/**
 * a date comparator for audio files sorting files newest to oldest. 
 * undefined AudioFiles / dates are set to oldest
 * 
 * @param a     audio file a
 * @param b     audio file b
 */
export const dateComparator = (a: AudioFile, b: AudioFile) => {
    if (!a || !a["date"])
        return -1;

    if (!b || !b["date"])
        return 1;

    const dateA = a["date"];
    const dateB = b["date"];

    if (dateA < dateB) return 1;
    else if (dateA > dateB) return -1;
    else return 0;
}
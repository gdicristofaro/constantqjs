import { HttpClient } from '@angular/common/http';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * A class that defines playback and playback controls for an audio file
 */
export default class AudioPlayback {
    static _audioContext : AudioContext = undefined;
    /**
     * defines the audio context to use for audio playback
     */
    static get audioCtx() {
        if (!AudioPlayback._audioContext)
            AudioPlayback._audioContext = new AudioContext();

        return AudioPlayback._audioContext;
    } 

    /**
     * defines the default refresh rate for an fft window in milliseconds
     */
    static MS_REFRESH = 500;

    static getFileBufferNode(file: File) : Observable<AudioBuffer> {
        return AudioPlayback.arrayToDecodeData(AudioPlayback.readFile(file));
    }

    // taken from https://gist.github.com/iansinnott/3d0ba1e9edc3e6967bc51da7020926b0
    static readFile(blob: Blob): Observable<ArrayBuffer> {
        return Observable.create(obs => {
            if (!(blob instanceof Blob)) {
                obs.error(new Error('`blob` must be an instance of File or Blob.'));
                return;
            }

            const reader = new FileReader();

            reader.onerror = err => obs.error(err);
            reader.onabort = err => obs.error(err);
            reader.onload = () => obs.next(reader.result);
            reader.onloadend = () => obs.complete();

            return reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * obtains an observable returning an audio buffer based on the url of the audio file
     * @param http  the http client to obtain the file
     * @param url   the url of the file to obtain
     */
    static getHttpBufferNode(http: HttpClient, url: string) : Observable<AudioBuffer> {
        return AudioPlayback.arrayToDecodeData(http.get(url, {
            responseType: 'arraybuffer'
          }));
    }

    private static arrayToDecodeData(arrBuffer: Observable<ArrayBuffer>) {
        return arrBuffer.pipe(mergeMap((arr) => from(AudioPlayback.audioCtx.decodeAudioData(arr))));
    }

    // updates the position of the playback
    public readonly positionListener: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    // creates the next frame of the fft based on the playback
    public readonly fftListener: BehaviorSubject<Uint8Array>;
    
    // listener for whether or not item is still playing
    public readonly isPlayingListener : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    // current position of playback
    private curPos: number = 0;

    // the data array to use for fft data
    private _dataArray : Uint8Array;

    // the analyzer node to provide fft data
    private _analyzer : AnalyserNode = undefined;

    // the interval object that will periodically update fft data, is  playing, position
    private _interval;

    // the node where audio will be connected (either an analyzer node or directly to audio context)
    private sink : AudioNode;

    // the start position relative to the audio context time
    private contextStart: number;

    // the start position relative to the audio file
    private audioStart: number;

    // the actual plaback node (only operational during playback not on pause)
    private playbackNode : AudioBufferSourceNode = undefined;
    

    constructor(
        private source : AudioBuffer, 
        // ms for refresh of playback position and fft
        public readonly msRefresh : number = AudioPlayback.MS_REFRESH,
        public readonly fftSize?: number,
        public readonly context? : AudioContext) {

            // set up context if not set up
            if (!this.context)
                this.context = AudioPlayback.audioCtx;

            this.sink = this.context.destination;
            this.positionListener.subscribe((num) => this.curPos = num);

            if (fftSize) {
                this._analyzer = this.context.createAnalyser();
                // so we get the right size for the bin count
                this._analyzer.fftSize = fftSize * 2;

                var bufferLength = this._analyzer.frequencyBinCount;
                this._dataArray = new Uint8Array(bufferLength);
                this.fftListener = new BehaviorSubject<Uint8Array>(this._dataArray);

                this._analyzer.connect(this.sink);
                this.sink = this._analyzer;
            }
            else {
                this.fftListener = undefined;
            }
    }

    /**
     * @returns the duration of the audio file
     */
    get duration() : number {
        return this.source.duration;
    }

    /**
     * @returns the current position of playback in the audio file
     */
    get currentPosition() : number {
        return this.curPos;
    }

    /**
     * sets the current position for playback
     */
    set currentPosition(value: number) {
        this.seek(value);
    }

    /**
     * @returns whether or not audio is playing
     */
    get isPlaying() : boolean {
        return this.isPlayingListener.getValue();
    }

    /**
     * @returns whether or not an actual audio buffer has been set for playback
     */
    get hasSource() : boolean {
        return (this.source) ? true : false;
    }

    /**
     * the function that updates listeners during the playback process
     */
    private onUpdate() {
        // update position
        this.positionListener.next(
            this.context.currentTime - this.contextStart + this.audioStart);

        // if there is an fft listener, update accordingly
        if (this.fftListener) {
            this._analyzer.getByteFrequencyData(this._dataArray);
            this.fftListener.next(this._dataArray);
        }
    }

    /**
     * handles playing audio
     * @param pos   the position of playback; if none set, current position is used
     */
    play(pos:number = undefined) {
        // can't play with no source
        if (!this.source)
            return false;

        // if playing, pause to properly restart
        if (this.isPlaying)
            this.pause();

        // establish starting position
        var startPos = (pos) ? pos : this.curPos;
        if (startPos >= this.duration)
            startPos = 0;

        // set up playback node
        this.playbackNode = this.context.createBufferSource();
        this.playbackNode.buffer = this.source;
        this.playbackNode.connect(this.sink);

        // establish context items for listeners
        this.contextStart = this.context.currentTime;
        this.audioStart = startPos;
        this.isPlayingListener.next(true);
        this.playbackNode.start(0, startPos);

        this.playbackNode.onended = () => {
            this.pause();
        }

        this._interval = setInterval(() => 
            this.onUpdate(), 
            this.msRefresh);

        return true;
    }

    /**
     * pauses audio playback at current location
     */
    pause() {
        // clear out interval for updates
        if (this._interval)
            clearInterval(this._interval);
        
        // if playing, trigger one last update and stop
        if (this.isPlaying) {
            this.isPlayingListener.next(false);

            if (this.source) {
                this.onUpdate();
                this.playbackNode.disconnect();
                this.playbackNode.stop(0);
            }
        }

        this.playbackNode = undefined;
        return true;
    }

    /**
     * seeks to the given position
     * @param pos   the new position for playback
     */
    seek(pos: number) {
        // bound appropriately to length of song
        const boundedPos = Math.min(Math.max(0, pos), this.duration);

        if (this.isPlaying)
            this.play(boundedPos);
        else
            this.curPos = boundedPos;
    }
}
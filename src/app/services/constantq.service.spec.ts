import { TestBed } from '@angular/core/testing';
import { DEFAULT_BINS, DEFAULT_THRESH } from '../model/defaults';
import { PitchDataMap } from '../model/pitch';
import { ConstantqService } from './constantq.service';
import WasmWorkerInterface from './wasm-worker-interface.service';

describe('ConstantqService', () => {
  let service: ConstantqService;
  let wasmWorker: WasmWorkerInterface;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConstantqService);
    wasmWorker = new WasmWorkerInterface();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function insertSin(buff: Float32Array, fs: number, maxAmplitude: number, freq: number) {
    const sz = buff.length;
    for (let x = 0; x < sz; x++) {
      buff[x] += maxAmplitude * Math.sin((Math.PI * x * 2 * freq) / fs);
    }
  }

  function generateSin(size: number, fs: number, freqs: number[]): AudioBuffer {
    const ctx = new AudioContext({ sampleRate: fs });
    const buffer = ctx.createBuffer(1, size, fs);
    const channelData = buffer.getChannelData(0);
    for (const freq of freqs) {
      insertSin(channelData, fs, 0.3, freq);
    }
    return buffer;
  }

  const sampleRates = [48000, 44100, 32000];

  for (const fs of sampleRates) {
    it(`should correctly identify C5, E5, and G5 at ${fs}Hz`, async () => {
      const freqs = [
        PitchDataMap['C5'].frequency,
        PitchDataMap['E5'].frequency,
        PitchDataMap['G5'].frequency,
      ];
      const audioBuffer = generateSin(fs, fs, freqs);

      const processing = await wasmWorker.messageProcessing(
        audioBuffer,
        PitchDataMap['C2'],
        PitchDataMap['C6'],
        DEFAULT_BINS,
        DEFAULT_THRESH,
        16, // default fps
      );

      const result = await new Promise<any>(resolve => {
        processing.data.subscribe({
          next: msg => {
            console.log('Received', msg);
            if (msg.status === 'Complete') {
              resolve(msg.data);
            }
          },
        });
      });

      // // Bins are mapped C2, C#2, D2... (2 bins per semitone)
      // // C5 is 3 octaves above C2 -> 36 semitones -> bin 72
      // // E5 is 40 semitones -> bin 80
      // // G5 is 43 semitones -> bin 86

      // grab a frame from the middle of the audio
      const frame = result.constantQData[8];

      const c5Peak = frame[72];
      const e5Peak = frame[80];
      const g5Peak = frame[86];

      const asharp4Peak = frame[68];
      const d5Peak = frame[76];
      const f5Peak = frame[82];

      expect(c5Peak).toBeGreaterThan(asharp4Peak);
      expect(e5Peak).toBeGreaterThan(d5Peak);
      expect(g5Peak).toBeGreaterThan(f5Peak);

      expect(c5Peak).toBeGreaterThan(0.01);
      expect(e5Peak).toBeGreaterThan(0.01);
      expect(g5Peak).toBeGreaterThan(0.01);
    });
  }
});

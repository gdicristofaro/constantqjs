import { expect, vi } from 'vitest';

import { Note, Pitch } from '../model/pitch';
import WasmWorkerInterface, { ConstantQMessage } from './wasm-worker-interface.service';

describe('WasmWorkerInterface', () => {
  let service: WasmWorkerInterface;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWorkerInstance: any;

  // Stub constants for predictable data testing
  const mockPitch: Pitch = { frequency: 440, note: Note.A, octave: 4 };
  let mockAudioBuffer: {
    length: number;
    numberOfChannels: number;
    sampleRate: number;
    getChannelData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = new WasmWorkerInterface();

    // 1. Create a structured mock for the HTML5 Worker instance
    mockWorkerInstance = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    };

    // 2. Intercept the global Worker constructor
    vi.spyOn(window, 'Worker').mockImplementation(function() { return mockWorkerInstance; } as unknown as typeof Worker);

    // 3. Setup a mock AudioBuffer with 2 channels
    mockAudioBuffer = {
      length: 4,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: vi.fn(),
    };

    // Channel 0 and Channel 1 distinct arrays to verify custom addition/mixing logic
    mockAudioBuffer.getChannelData.mockImplementation((channel: number) => {
      return channel === 0
        ? new Float32Array([0.1, 0.2, 0.3, 0.4])
        : new Float32Array([0.01, 0.02, 0.03, 0.04]);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('messageProcessing Initialization', () => {
    it('should instantiate the Web Worker with the correct path asset', async () => {
      await service.messageProcessing(mockAudioBuffer as unknown as AudioBuffer, mockPitch, mockPitch);

      expect(window.Worker).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringMatching(/assets\/wasm\/constantq\.worker\.intercept\.js$/),
        }),
      );
    });

    it('should return a cancel function and a data observable stream', async () => {
      const result = await service.messageProcessing(mockAudioBuffer as unknown as AudioBuffer, mockPitch, mockPitch);

      expect(result.data).toBeTruthy();
      expect(typeof result.cancel).toBe('function');
    });
  });

  describe('Cancellation Flow', () => {
    it('should terminate the worker and emit Cancelled payload when cancel() is invoked', async () => {
      const result = await service.messageProcessing(mockAudioBuffer as unknown as AudioBuffer, mockPitch, mockPitch);

      let lastEmittedMessage: ConstantQMessage | undefined;
      result.data.subscribe(msg => (lastEmittedMessage = msg));

      result.cancel();

      expect(mockWorkerInstance.terminate).toHaveBeenCalled();
      expect(lastEmittedMessage).toEqual({
        status: 'Cancelled',
        data: { constantQData: [], graphMax: 0, keyboardIntensity: [] },
      });
    });
  });

  describe('Worker Execution Lifecycle', () => {
    let messageStream: ConstantQMessage[];

    beforeEach(async () => {
      messageStream = [];
      const result = await service.messageProcessing(mockAudioBuffer as unknown as AudioBuffer, mockPitch, mockPitch);
      result.data.subscribe({
        next: msg => messageStream.push(msg),
        error: (err: unknown) => { throw new Error('Should not throw error stream: ' + String(err)); },
      });
    });

    it('should handle the full compilation loop: initialization, partial loading, and completion', () => {
      // Step 1: Trigger worker initialization handshake
      mockWorkerInstance.onmessage({} as MessageEvent);

      // Extract the arguments from the most recent call
      const [calledObj, transferList] = mockWorkerInstance.postMessage.mock.calls.at(-1);

      expect(calledObj.workerArgs).toEqual(expect.objectContaining({ fs: 44100 }));
      expect(transferList).toEqual([calledObj.audioData.buffer]);

      const expectedValues = [0.11, 0.22, 0.33, 0.44];
      expect(calledObj.audioData.length).toBe(expectedValues.length);

      calledObj.audioData.forEach((actualVal: number, index: number) => {
        expect(actualVal).toBeCloseTo(expectedValues[index], 5);
      });

      // Step 2: Simulate an intermediate data progress chunk from the worker
      const intermediatePayload = {
        data: {
          metadata: { totalSamples: 10, bins: 2, sampleStart: 0 },
          constantQData: new Float64Array([1.5, 2.5, 3.5, 4.5]), // 2 frames of 2 bins each
        },
      };

      mockWorkerInstance.onmessage(intermediatePayload as MessageEvent);

      expect(messageStream.length).toBe(1);
      expect(messageStream[0].status).toBe('Loading');
      if (messageStream[0].status === 'Loading') {
        expect(messageStream[0].completion).toBe(0.2); // (0 + 2 samples) / 10 totalSamples
        expect(messageStream[0].data.graphMax).toBe(4.5);
        expect(messageStream[0].data.constantQData[0]).toEqual([1.5, 2.5]);
        expect(messageStream[0].data.constantQData[1]).toEqual([3.5, 4.5]);
      }

      // Step 3: Simulate the final chunk causing completion (completion reaches 1.0)
      const finalPayload = {
        data: {
          metadata: { totalSamples: 10, bins: 2, sampleStart: 2 },
          constantQData: new Float64Array([
            5.0, 6.0, 7.0, 8.0, 1.0, 2.0, 3.0, 4.0, 0.5, 0.5, 0.5, 0.5, 0.1, 0.1, 0.1, 0.1,
          ]), // 8 frames
        },
      };

      mockWorkerInstance.onmessage(finalPayload as MessageEvent);

      expect(messageStream.length).toBe(2);
      expect(messageStream[1].status).toBe('Complete');
      if (messageStream[1].status === 'Complete') {
        expect(messageStream[1].data.graphMax).toBe(8.0); // Verifies graphMax tracking updates dynamically
      }
      expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1); // Auto-terminates on complete
    });

    it('should catch error messages dispatched via worker.onerror', () => {
      // Step 1: Initialize worker context loop
      mockWorkerInstance.onmessage({} as MessageEvent);

      // Step 2: Trigger error
      const mockErrorEvent = {
        message: 'WASM memory compilation allocation failure',
      } as ErrorEvent;
      mockWorkerInstance.onerror(mockErrorEvent);

      expect(messageStream.length).toBe(1);
      expect(messageStream[0]).toEqual({
        status: 'Error',
        message:
          'An error occurred while processing the audio buffer: WASM memory compilation allocation failure',
      });
    });
  });
});

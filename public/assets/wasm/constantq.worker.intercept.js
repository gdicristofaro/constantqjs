// Import the Emscripten generated glue code
importScripts('constantq.worker.js');

Module.onRuntimeInitialized = function () {
  self.onmessage = function (e) {
    const {
      data: {
        audioData,
        workerArgs: { fs, minFreq, maxFreq, bins, thresh, frameInterval, progressMessageCount },
      },
    } = e; // This is the incoming Float64Array
    const len = audioData.length;
    const bytesPerElement = Float64Array.BYTES_PER_ELEMENT;

    // Allocate space inside the Worker's unique WASM heap
    const workerPtr = Module._malloc(len * bytesPerElement);
    const heapIndex = workerPtr / bytesPerElement;

    // Stream the incoming data directly into the worker's HEAPF64
    Module.HEAPF64.set(audioData, heapIndex);

    // Run the C++ code
    Module.ccall(
      'constantq_worker_message',
      null,
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [workerPtr, len, fs, minFreq, maxFreq, bins, thresh, frameInterval, progressMessageCount],
    );

    // Clean up worker memory
    Module._free(workerPtr);
  };

  self.postMessage({ initialized: true });
};

// Import the Emscripten generated glue code
importScripts('constantq.worker.js');

// Wait for the WASM module to initialize
Module.onRuntimeInitialized = function () {
  self.onmessage = function (e) {
    const { number } = e.data;

    // Call the C++ function using ccall
    const result = Module.ccall('constantq_worker_message', null, ['number', 'number'], [number]);

    // Send the result back to the main thread
    self.postMessage({ result });
  };
};

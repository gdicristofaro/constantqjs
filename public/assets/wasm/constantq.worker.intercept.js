// Import the Emscripten generated glue code
importScripts('constantq.worker.js');

Module.onRuntimeInitialized = function () {
  self.onmessage = function (e) {
    console.log('Received message', e);
    const { data } = e; // This is the incoming Float64Array
    const len = data.length;
    const bytesPerElement = Float64Array.BYTES_PER_ELEMENT;

    // 1. Allocate space inside the Worker's unique WASM heap
    const workerPtr = Module._malloc(len * bytesPerElement);
    const heapIndex = workerPtr / bytesPerElement;

    // 2. Stream the incoming data directly into the worker's HEAPF64
    Module.HEAPF64.set(data, heapIndex);

    // 3. Run the C++ code
    Module.ccall('constantq_worker_message', null, ['number', 'number'], [workerPtr, len]);

    // 4. Extract the modified data back out into a clean JS array
    // const resultView = new Float64Array(Module.HEAPF64.buffer, workerPtr, len);
    // const finalOutput = new Float64Array(resultView); // Deep copy before freeing pointer

    // 5. Clean up worker memory
    Module._free(workerPtr);

    // 6. Transfer the buffer back to the main thread with 0ms copy overhead
    // self.postMessage({ result: finalOutput }, [finalOutput.buffer]);
  };
};

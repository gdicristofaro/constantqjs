# Building ConstantQ with CMake

This project uses CMake for build configuration, supporting both WebAssembly (WASM) compilation with emscripten and native testing with catch2.

## Prerequisites

### For WebAssembly Build

- Emscripten SDK (download from https://emscripten.org/docs/getting_started/downloads.html)
- Set up the EMSDK environment: `source /path/to/emsdk/emsdk_env.sh`

### For Testing

- CMake 3.15 or higher
- C++23 compatible compiler (GCC, Clang, or MSVC)
- catch2 will be automatically downloaded by CMake

## Building

### Option 1: CMake with WebAssembly Target (recommended)

```bash
# Create and enter build directory
mkdir build-wasm
cd build-wasm

# Configure with emscripten toolchain
cmake -DCMAKE_TOOLCHAIN_FILE=../cmake/Emscripten.cmake -DBUILD_TESTS=OFF ..

# Build WASM
cmake --build . --config Release

# Output: public/assets/wasm/constantq.worker.js
```

### Option 2: CMake with Native Tests

```bash
# Create and enter build directory
mkdir build-tests
cd build-tests

# Configure for native build (no WASM)
cmake -DBUILD_WASM=OFF -DBUILD_TESTS=ON ..

# Build and run tests
cmake --build .
ctest --output-on-failure
```

### Option 3: Build Both WASM and Tests

```bash
# Create and enter build directory
mkdir build
cd build

# Configure to build both
cmake -DCMAKE_TOOLCHAIN_FILE=../cmake/Emscripten.cmake -DBUILD_WASM=ON -DBUILD_TESTS=ON ..

# Build WASM
cmake --build . --target constantq.worker.js

# Build and run tests (requires native compiler)
# Note: You may need a separate build directory for tests if cross-compilation is active
```

### Option 4: Using npm scripts (legacy Makefile method)

The original Makefile is still available and can be used:

```bash
npm run buildwasm
```

This runs `make clean && make` which uses the traditional Makefile approach.

## CMake Build Options

- `BUILD_WASM` (default: ON) - Build WebAssembly target
- `BUILD_TESTS` (default: ON) - Build catch2 tests
- `DEBUG` (default: OFF) - Build with debug symbols

Example with options:

```bash
cmake -DBUILD_WASM=ON -DBUILD_TESTS=ON -DDEBUG=ON ..
```

## Running Tests

After building with `BUILD_TESTS=ON`:

```bash
cd build
ctest --output-on-failure
```

Or run the test executable directly:

```bash
./run_tests
```

## Project Structure

```
src/cppwasm/
├── ConstantQ.cpp/hpp          # Core ConstantQ transform
├── ConstantQSession.cpp/hpp   # Session management
├── ConstantQWorker.cpp        # WebAssembly worker entry point
├── KernelEntry.cpp/hpp        # Kernel entry data structure
├── MathUtil.cpp/hpp           # Math utilities
├── SparseKernel.cpp/hpp       # Sparse kernel implementation
└── Tests.cpp                   # catch2 test suite

public/assets/wasm/
└── constantq.worker.js        # Generated WebAssembly output
```

## Troubleshooting

### EMSDK not found

Make sure to source the emsdk environment:

```bash
source /path/to/emsdk/emsdk_env.sh
```

### catch2 download fails

Check your internet connection. catch2 is downloaded from GitHub releases.

### CMake can't find compiler

Ensure em++ is in your PATH and EMSDK is properly configured.

## Migration from Makefile

The original Makefile is still functional for building WebAssembly. The CMake setup provides:

- Better dependency management (automatic catch2 download)
- More flexible build options
- Native test compilation
- Better IDE integration

To maintain backward compatibility, both the Makefile and CMake configurations are supported.

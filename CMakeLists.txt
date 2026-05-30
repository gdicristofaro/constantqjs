cmake_minimum_required(VERSION 3.15)
project(ConstantQ CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Options
option(BUILD_WASM "Build WebAssembly target" ON)
option(BUILD_TESTS "Build tests" ON)
option(DEBUG "Build with debug symbols" OFF)

# Optimization flags
set(CMAKE_CXX_FLAGS_INIT "-O3")

# Debug configuration
if(DEBUG)
    add_compile_definitions(DEBUG)
endif()

# Source files
set(CPPWASM_DIR "${CMAKE_CURRENT_SOURCE_DIR}/src/cppwasm")

# Common sources (used by both WASM and tests)
set(SOURCES_COMMON
    "${CPPWASM_DIR}/ConstantQ.cpp"
    "${CPPWASM_DIR}/ConstantQSession.cpp"
    "${CPPWASM_DIR}/KernelEntry.cpp"
    "${CPPWASM_DIR}/MathUtil.cpp"
    "${CPPWASM_DIR}/SparseKernel.cpp"
)

# WASM-specific sources
set(SOURCES_WASM
    "${CPPWASM_DIR}/ConstantQWorker.cpp"
)

set(SOURCES ${SOURCES_COMMON} ${SOURCES_WASM})

set(HEADERS
    "${CPPWASM_DIR}/ConstantQ.hpp"
    "${CPPWASM_DIR}/ConstantQSession.hpp"
    "${CPPWASM_DIR}/KernelEntry.hpp"
    "${CPPWASM_DIR}/MathUtil.hpp"
    "${CPPWASM_DIR}/SparseKernel.hpp"
)

# WebAssembly target
if(BUILD_WASM)
    # Check if we're using emscripten
    if(NOT DEFINED ENV{EMSDK})
        message(WARNING "EMSDK environment variable not set. WebAssembly build may fail.")
    endif()

    add_executable(constantq.worker ${SOURCES})
    
    # Emscripten-specific settings
    target_compile_options(constantq.worker PRIVATE
        -O3
        -std=c++23
    )
    
    target_link_options(constantq.worker PRIVATE
        "-sEXPORTED_FUNCTIONS=['_constantq_worker_message','_malloc','_free']"
        "-sEXPORTED_RUNTIME_METHODS=['ccall','HEAPF64']"
        "-sENVIRONMENT=worker"
        "-sALLOW_MEMORY_GROWTH=1"
    )
    
    # Set output directory
    set_target_properties(constantq.worker PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/public/assets/wasm"
    )
endif()

# Tests target
if(BUILD_TESTS)
    # Include FetchContent for catch2
    include(FetchContent)
    
    FetchContent_Declare(
        Catch2
        GIT_REPOSITORY https://github.com/catchorg/Catch2.git
        GIT_TAG        v3.15.0
    )
    FetchContent_MakeAvailable(catch2)
    
    # Collect per-file test sources (*.test.cpp) and test helpers
    file(GLOB TEST_SOURCES "${CPPWASM_DIR}/*.test.cpp")

    add_executable(run_tests
        ${HEADERS}
        ${SOURCES_COMMON}
        "${CPPWASM_DIR}/TestHelpers.hpp"
        "${CPPWASM_DIR}/TestHelpers.cpp"
        ${TEST_SOURCES}
    )
    
    target_link_libraries(run_tests PRIVATE Catch2::Catch2WithMain)
    
    target_compile_options(run_tests PRIVATE
        -std=c++23
    )
    
    # Enable testing
    enable_testing()
    add_test(NAME ConstantQTests COMMAND run_tests)
endif()

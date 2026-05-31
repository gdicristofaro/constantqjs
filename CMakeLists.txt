cmake_minimum_required(VERSION 3.16)
project(ConstantQ CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options
option(BUILD_WASM "Build WebAssembly target" ON)
option(BUILD_TESTS "Build tests" ON)
option(BUILD_DEBUG "Build with debug symbols" OFF)

# Debug configuration
if(BUILD_DEBUG)
    add_compile_options(-g)
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

set(HEADERS
    "${CPPWASM_DIR}/ConstantQ.hpp"
    "${CPPWASM_DIR}/ConstantQSession.hpp"
    "${CPPWASM_DIR}/KernelEntry.hpp"
    "${CPPWASM_DIR}/MathUtil.hpp"
    "${CPPWASM_DIR}/SparseKernel.hpp"
)

# WebAssembly target
if(BUILD_WASM)
    if(NOT CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
        message(WARNING "Not using Emscripten toolchain. WebAssembly build may fail.")
    endif()

    add_executable(constantq.worker ${SOURCES_COMMON} ${SOURCES_WASM})
    
    target_compile_options(constantq.worker PRIVATE
        -O3
    )
    
    target_link_options(constantq.worker PRIVATE
        "-sEXPORTED_FUNCTIONS=['_constantq_worker_message','_malloc','_free']"
        "-sEXPORTED_RUNTIME_METHODS=['ccall','HEAPF64']"
        "-sENVIRONMENT=worker"
        "-sALLOW_MEMORY_GROWTH=1"
        $<$<BOOL:${BUILD_DEBUG}>:-g>
    )
    
    set_target_properties(constantq.worker PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/public/assets/wasm"
    )
endif()

# Tests target
if(BUILD_TESTS)
    include(FetchContent)
    
    FetchContent_Declare(
        Catch2
        GIT_REPOSITORY https://github.com/catchorg/Catch2.git
        GIT_TAG        v3.15.0
        GIT_SHALLOW    TRUE
    )
    FetchContent_MakeAvailable(Catch2)
    
    file(GLOB TEST_SOURCES "${CPPWASM_DIR}/*.test.cpp")

    add_executable(run_tests
        ${SOURCES_COMMON}
        "${CPPWASM_DIR}/TestHelpers.cpp"
        ${TEST_SOURCES}
    )

    target_include_directories(run_tests PRIVATE "${CPPWASM_DIR}")
    
    target_link_libraries(run_tests PRIVATE Catch2::Catch2WithMain)
    
    target_compile_options(run_tests PRIVATE
        -Wall
        -Wextra
        $<$<BOOL:${BUILD_DEBUG}>:-g>
    )
    
    enable_testing()
    add_test(NAME ConstantQTests COMMAND run_tests)

    include(Catch)
    catch_discover_tests(run_tests)
endif()
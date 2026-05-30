# Emscripten CMake Toolchain
# This toolchain file configures CMake to use emscripten for cross-compilation

# Use emscripten's cmake toolchain if available
if(DEFINED ENV{EMSDK} AND NOT "$ENV{EMSDK}" STREQUAL "")
    set(EMSCRIPTEN "$ENV{EMSDK}/upstream/emscripten")
    if(EXISTS "${EMSCRIPTEN}/cmake/Modules/Platform/Emscripten.cmake")
        include("${EMSCRIPTEN}/cmake/Modules/Platform/Emscripten.cmake")
    else()
        message(WARNING "Emscripten toolchain file not found at ${EMSCRIPTEN}/cmake/Modules/Platform/Emscripten.cmake")
    endif()
else()
    message(WARNING "EMSDK environment variable not set or empty. Using system em++/emcc compiler commands if available.")
endif()

# Prefer explicit emscripten compiler executables if available
find_program(EMCC_EXECUTABLE emcc)
find_program(EMPP_EXECUTABLE em++)

if(EMCC_EXECUTABLE AND EMPP_EXECUTABLE)
    set(CMAKE_C_COMPILER "${EMCC_EXECUTABLE}" CACHE STRING "C compiler")
    set(CMAKE_CXX_COMPILER "${EMPP_EXECUTABLE}" CACHE STRING "C++ compiler")
else()
    message(FATAL_ERROR "Emscripten compiler tools not found in PATH. Install Emscripten or set EMSDK correctly.")
endif()

# Disable CMake's compiler checks for emscripten
set(CMAKE_CXX_COMPILER_WORKS 1 CACHE BOOL "")
set(CMAKE_C_COMPILER_WORKS 1 CACHE BOOL "")

# Set system name
set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_SYSTEM_PROCESSOR wasm32)

# Set executable suffix
set(CMAKE_EXECUTABLE_SUFFIX ".js")

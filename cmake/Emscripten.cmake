# Emscripten CMake Toolchain
# This toolchain file configures CMake to use Emscripten for cross-compilation

set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_SYSTEM_PROCESSOR wasm32)

set(CMAKE_CXX_COMPILER_WORKS 1 CACHE BOOL "" FORCE)
set(CMAKE_C_COMPILER_WORKS 1 CACHE BOOL "" FORCE)

# ============================================================
# Locate the EMSDK and include Emscripten's own toolchain module
# ============================================================

if(DEFINED ENV{EMSCRIPTEN} AND NOT "$ENV{EMSCRIPTEN}" STREQUAL "")
    set(_EM_ROOT "$ENV{EMSCRIPTEN}")
elseif(DEFINED ENV{EMSDK} AND NOT "$ENV{EMSDK}" STREQUAL "")
    set(_EM_ROOT "$ENV{EMSDK}/upstream/emscripten")
else()
    message(FATAL_ERROR
        "Neither EMSCRIPTEN nor EMSDK environment variables are set. "
        "Run: source <emsdk_dir>/emsdk_env.sh"
    )
endif()

set(_EM_TOOLCHAIN "${_EM_ROOT}/cmake/Modules/Platform/Emscripten.cmake")
if(EXISTS "${_EM_TOOLCHAIN}")
    include("${_EM_TOOLCHAIN}")
else()
    message(FATAL_ERROR
        "Emscripten CMake toolchain not found at:\n  ${_EM_TOOLCHAIN}\n"
        "Your Emscripten installation may be incomplete or outdated."
    )
endif()

# ============================================================
# Compiler executables
# ============================================================

find_program(CMAKE_C_COMPILER
    NAMES emcc
    HINTS "${_EM_ROOT}"
    DOC "Emscripten C compiler"
)
find_program(CMAKE_CXX_COMPILER
    NAMES em++
    HINTS "${_EM_ROOT}"
    DOC "Emscripten C++ compiler"
)

if(NOT CMAKE_C_COMPILER OR NOT CMAKE_CXX_COMPILER)
    message(FATAL_ERROR
        "Emscripten compiler tools not found.\n"
        "  emcc:  ${CMAKE_C_COMPILER}\n"
        "  em++:  ${CMAKE_CXX_COMPILER}\n"
        "Ensure Emscripten is installed and emsdk_env.sh has been sourced."
    )
endif()

# ============================================================
# Output configuration
# ============================================================
set(CMAKE_EXECUTABLE_SUFFIX ".js")

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)  # Still find host tools (emcc etc.)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)   # Only find wasm-compatible libs
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)   # Only find wasm-compatible headers
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)   # Only find wasm-compatible packages
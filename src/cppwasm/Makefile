CXX      = em++
CXXFLAGS = -O3 -std=c++23 
# can run with -DDEBUG 

OUT_DIR  = ../../public/assets/wasm

# --bind            → enables Embind (required for val + EMSCRIPTEN_BINDINGS)
# MODULARIZE        → wraps output in a factory fn so multiple instances are safe
# EXPORT_NAME       → name of the JS factory function (matches the TS declare)
# ALLOW_TABLE_GROWTH→ required if you ever use addFunction(); safe to include
# EXPORTED_RUNTIME_METHODS → expose 'addFunction' to JS if needed later

#-s ENVIRONMENT='web'   # or 'node' if running in Node
#   -DDEBUG=1 \

EMFLAGS = \
  --bind \
  --emit-tsd ../../../src/app/services/constantq/constantq.wasm.interface.d.ts \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createProcessorModule" \
  -s ALLOW_TABLE_GROWTH=1 \
  -s WASM_WORKERS=1 \
  -s EXIT_RUNTIME=1 \
  -s EXPORTED_RUNTIME_METHODS='["addFunction","removeFunction"]'

EM_WORKER_FLAGS = \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ALLOW_TABLE_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_initializeSession"]' \
  -s EXIT_RUNTIME=1 \
  -s BUILD_AS_WORKER=1 

  # 1. Get all cpp and hpp files
ALL_HPP_FILES =  $(wildcard *.hpp)
ALL_CPP_FILES = $(wildcard *.cpp)

# 2. Filter out the two specific files
ALL_CPP_WORKER_FILES = $(filter-out Tests.cpp ConstantQOrchestrator.cpp, $(ALL_CPP_FILES))

.PHONY: all clean
all: $(OUT_DIR)/constantq.js $(OUT_DIR)/worker.js

$(OUT_DIR)/constantq.js: ConstantQOrchestrator.cpp | $(OUT_DIR)
	$(CXX) $(CXXFLAGS) $(EMFLAGS) $< -o $@

$(OUT_DIR)/worker.js: $(ALL_CPP_WORKER_FILES) $(ALL_HPP_FILES) | $(OUT_DIR)
	$(CXX) $(CXXFLAGS) $(EM_WORKER_FLAGS) $(ALL_CPP_WORKER_FILES) -o $@

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

clean:
	rm -f $(OUT_DIR)/*.js $(OUT_DIR)/*.wasm
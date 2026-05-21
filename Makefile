CXX      = em++
CXXFLAGS = -O3 -std=c++23 

OUT_DIR  = public/assets/wasm
SRC_DIR = src/cppwasm
INTERFACE_PATH = ../../../src/app/services/constantq/constantq.wasm.interface.d.ts

# can be run with make DEBUG=1
ifeq ($(DEBUG), 1)
    override CXXFLAGS += -DDEBUG
endif


EM_WORKER_FLAGS = \
  -s EXPORTED_FUNCTIONS='["_constantq_worker_message","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "HEAPF64"]' \
  -s ENVIRONMENT='worker' \
  -s ALLOW_MEMORY_GROWTH=1


  # 1. Get all cpp and hpp files
ALL_HPP_FILES =  $(wildcard $(SRC_DIR)/*.hpp)
ALL_CPP_FILES = $(wildcard $(SRC_DIR)/*.cpp)

# 2. Filter out the two specific files
ALL_CPP_WORKER_FILES = $(filter-out $(SRC_DIR)/Tests.cpp, $(ALL_CPP_FILES))

.PHONY: all clean
all: $(OUT_DIR)/constantq.worker.js

$(OUT_DIR)/constantq.worker.js: $(ALL_CPP_WORKER_FILES) $(ALL_HPP_FILES) | $(OUT_DIR)
	$(CXX) $(CXXFLAGS) $(EM_WORKER_FLAGS) $(ALL_CPP_WORKER_FILES) -o $@

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

clean:
	rm -f $(OUT_DIR)/constantq.worker.js $(OUT_DIR)/constantq.worker.wasm
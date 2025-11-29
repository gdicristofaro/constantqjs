import { exec, ExecException } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const emcc = 'emcc';
const cppDir = '/cppwasm/';

const wasmOutdir = '/src/assets/wasm';
const workerOutFile = 'worker.js';
const orchestratorOutFile = 'constantq.js';

const orchestratorCppFile = 'ConstantQOrchestrator.cpp';
const workerExcludeCppFiles = ['Tests.cpp', orchestratorCppFile];

const workerParams = [
  '-s ALLOW_MEMORY_GROWTH=1',
  '-std=c++17',
  "-s EXPORTED_FUNCTIONS=\"['_initializeSession', '_sessionAnalyze']\"",
  '-s BUILD_AS_WORKER=1',
];

const orchestratorParams = [
  '--bind',
  '-s RESERVED_FUNCTION_POINTERS=20',
  '-s ALLOW_MEMORY_GROWTH=1',
  '-std=c++17',
];

function baseExec(
  command: string,
  cwd: string | undefined,
  callback: ((error: ExecException | null, stdout: string, stderr: string) => void) | undefined,
  showError: boolean,
  showStd: boolean,
) {
  exec(command, { cwd }, (error, stdout, stderr) => {
    if (stderr && showError) {
      console.error(stderr);
    }

    if (error && showError) {
      console.error(error);
    }

    if (stdout && showStd) {
      console.log(stdout);
    }

    if (callback) {
      callback(error, stdout, stderr);
    }
  });
}

function emccBuild(emccPath: string, sourceFiles: string[], outFile: string, params: string[]) {
  const command = [emccPath, ...params, ...sourceFiles, '-o', outFile].join(' ');

  console.log(`Executing: ${command}`);
  baseExec(command, undefined, undefined, true, true);
}

const workerSourceFiles = fs
  .readdirSync(path.join(__dirname, cppDir))
  .filter(file => file.endsWith('.cpp') && workerExcludeCppFiles.indexOf(file) < 0)
  .map(f => path.join(__dirname, cppDir, f));

emccBuild(emcc, workerSourceFiles, path.join(__dirname, wasmOutdir, workerOutFile), workerParams);
emccBuild(
  emcc,
  [path.join(__dirname, cppDir, orchestratorCppFile)],
  path.join(__dirname, wasmOutdir, orchestratorOutFile),
  orchestratorParams,
);

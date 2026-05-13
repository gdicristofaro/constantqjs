# ConstantQJs

In this project, someone can view all the pitches in a piece of music. ConstantQJs utilizes Benjamin Blankertz's [algorithm](http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf) implementing the [Constant Q Transform](https://en.wikipedia.org/wiki/Constant-Q_transform).

## Live Demo

**The live demo can be found [here](http://gdicristofaro.github.io/constantqjs/).**

## How it works

Audio file data is imported utilizing the Web Audio API. Then the audio data is analyzed for pitch information utilizing Benjamin Blankertz's [algorithm](http://doc.ml.tu-berlin.de/bbci/material/publications/Bla_constQ.pdf) where a sparse kernel is generated depending on the pitch range to consider as well as the frame rate of the audio. Then, the audio is processed split into segments and processed. This implementation utilizes C++ code compiled to web assembly utilizing [emscripten](https://emscripten.org/) in combination with web workers for performance and parallelization.

## Setup and install

The project can be built with `npm install` and ran with `npm start`. The compiled web assembly is included, however the web assembly code can be built from the C++ code using `npm buildwasm`. Building the web assembly from the C++ code will require the [emscripten SDK](https://github.com/emscripten-core/emsdk).

## Music

The recommended files includes the following:

- A C major chord generated using [Audacity](https://www.audacityteam.org/)
- [Laura Denardis Performing Bach Chorale](https://archive.org/details/LauradenardisperformingbachChorale)
- [For Elise)](https://archive.org/details/lp_greatest-hits-of_frederic-chopin-ludwig-van-beethoven-jo/disc2/)

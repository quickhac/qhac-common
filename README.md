# QuickHAC Common Library

The QuickHAC Common library aims to be a robust reference implementation of an API to work with GradeSpeed (and eventually, also with txConnect) written in TypeScript. It provides functionality such as logging in and retrieving grades from a server, parsing them into a nice JSON format, recalculating grade averages based on edited grades, and calculating grade point averages.

Currently, Round Rock ISD and Austin ISD are supported, although new districts should be easy to add (see `src/districts.ts`).

## Requirements
TypeScript
TypeDoc, which is installed by `npm install typedoc --global` (you might need sudo).

## Compiling

Run `make prepare` once to create the `build\` directory (you only need to do this once) and then run `make` to compile and build the documentation.

## Usage

See the Wiki for details on how to use qhac-common. Or, read the source code itself; it's not that hard to read (I hope). Additionally, there is documentation in the doc/ folder, but it is a bit messy. To see the API for GradeService, click on "Globals" on the left side, and under "Classes" click on GradeService. NOTE: This cannot run on node.js, because it relies on XHR and DOM Parsing.

## License

Copyright (c) 2013, Xuming Zeng.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of QuickHAC nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
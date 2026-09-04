#!/bin/sh
set -e

exec node --import @swc-node/register/esm-register --enable-source-maps dist/src/main.js

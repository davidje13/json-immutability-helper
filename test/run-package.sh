#!/bin/sh
set -e

echo "Running package test...";
echo;

BASE_DIR="$(cd "$(dirname "$0")/.."; pwd)";
cd "$BASE_DIR";
rm json-immutability-helper-*.tgz 2>/dev/null || true;
npm pack;
rm test/package/json-immutability-helper.tgz 2>/dev/null || true;
mv json-immutability-helper-*.tgz test/package/json-immutability-helper.tgz;
cd - >/dev/null;

cd "$BASE_DIR/test/package";
rm -rf node_modules || true;
npm install --audit=false;
rm json-immutability-helper.tgz || true;
npm test;
cd - >/dev/null;

echo;
echo "Package test complete";
echo;

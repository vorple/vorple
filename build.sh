#! /bin/sh

export NODE_ENV=production

# This is needed to get Typescript use the correct version number without importing package.json
# Probably only works on MacOS
echo "Setting the version number..."
VORPLE_VERSION=$(grep version package.json | sed 's/.*"version": "\(.*\)".*/\1/')
sed -i '' -E "s/(const VORPLE_VERSION =) \"(.*)\"/\1 \"$VORPLE_VERSION\"/" src/index.ts

echo "Cleaning up build directories..."
rm -rf dist lib web

echo "Building interpreter files with Webpack..."
yarn webpack

echo "Building JavaScript source files with tsc..."
tsc -p tsconfig.json

echo "Copying other files to correct places..."
cp -r src/quixe lib
mkdir -p lib/css
cp web/interpreter/roboto-*.woff* lib/css/

echo "Concatenating the CSS files..."
cat web/interpreter/roboto.css web/interpreter/jquery.powertip.css web/interpreter/toastr.css web/interpreter/vex.css web/interpreter/vex-theme-plain.css web/interpreter/haven.css web/interpreter/vorple.css > lib/css/vorple.css 

echo "Done."

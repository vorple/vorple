#! /bin/sh

export NODE_ENV=production

echo "Cleaning up the dist and lib directories..."
rm -rf dist lib

echo "Building interpreter files with Webpack..."
yarn webpack

echo "Building JavaScript source files with tsc..."
tsc -p tsconfig.json

echo "Copying other files to correct places..."
cp -r src/quixe lib
mkdir -p lib/css
cp dist/interpreter/roboto-*.woff* lib/css/

echo "Concatenating the CSS files..."
cat dist/interpreter/roboto.css dist/interpreter/jquery.powertip.css dist/interpreter/toastr.css dist/interpreter/vex.css dist/interpreter/vex-theme-plain.css dist/interpreter/haven.css dist/interpreter/vorple.css > lib/css/vorple.css 

echo "Done."

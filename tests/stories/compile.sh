#! /bin/bash

# go to correct directory if the script was run from somewhere else
cd "$( dirname "${BASH_SOURCE[0]}" )"

# use the Inform 7 project to build
cd ../../../inform7/tests/stories

# set the environment variables from .env file in the project root (see .env.example)
set -o allexport
. ../../.env
set +o allexport

# exit if any of the following commands return an error
set -e

# remove temporary and Inform-generated directories when the script ends, even if compilation failed
function cleanup {
  rm -rf tmp/
  rm -rf ../Documentation/
  rm -rf ../Telemetry/
}
trap cleanup EXIT

# create a temporary directory and the directory structure I7 compiler requires
mkdir -p tmp/unittest.inform/Source
mkdir -p tmp/unittest.materials

# link the development extensions to the unit test project
cp -r ../../Extensions tmp/unittest.materials/

# copy unit tests source to where I7 compiler expects to find it
cp ../../../vorple/tests/stories/js-tests.i7 tmp/unittest.inform/Source/story.ni

# run the I7 compiler to create the intermediary I6 source
$I7_EXEC_DIR/ni -internal $I7_INTERNALS -external ../ -project tmp/unittest.inform -format=ulx

# run the I6 compiler to create the story file
$I7_EXEC_DIR/inform6 -kE2SDwG +include_path=$I7_INCLUDE_PATH tmp/unittest.inform/Build/auto.inf ../../../vorple/tests/stories/js-tests.i7.ulx


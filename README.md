# Vorple

> **Note:** This readme describes how to develop the Vorple library itself. If you're interested in developing games using Vorple, see [the documentation at vorple-if.com](https://vorple-if.com/docs/) instead.


## Setting up the development environment

These instructions assume a Unix environment (Linux or macOS). Setting up the environment on a Windows machine should follow similar steps.

The entire Vorple system is comprised of several parts:

* A Glulx engine [Quixe](https://github.com/erkyrath/quixe) that runs the Inform game files 
* A custom web interpreter [Haven](https://github.com/vorple/haven) that handles displaying the game output and getting input from the player
* The Vorple JavaScript library itself (this repository) that supports the non-standard features which allow the Inform game files to communicate with the browser environment 
* [Inform 6](https://github.com/vorple/inform6) and [Inform 7](https://github.com/vorple/inform7) extensions that allow game authors to use Vorple from within Inform

The project includes [webpack-dev-server](https://github.com/webpack/webpack-dev-server) that re-runs the build step automatically whenever Vorple or Haven sources change and creates a local server that lets you run the development version directly on the computer.

To set up the development environment:

1. Install [Node.js](https://nodejs.org)
2. Install the rest of the packages with `npm install`. [npm](https://www.npmjs.com) should come with the Node.js installation.  
3. Run `npm install` to install packages

Now you can do `npm start` to start the development server at http://localhost:9000. The server restarts automatically when changes are made to source files.

The development server exposes files from the `library` directory. For example, if you place `zork.ulx` in this directory you can play it from the address `http://localhost:9000/?story=zork.ulx` when the server is running.

You can also substitute npm with [Yarn](https://yarnpkg.com) (recommended). 


## Building release versions

The `npm run build` script compiles the Vorple and Haven source code and copies everything into a `dist` directory. It also creates the files in the `lib` directory that are needed in the npm distribution package.


## Test suite

Tests for the JavaScript library are in the `tests/specs` directory. The test runner stack is [WebDriver](http://webdriver.io) + [Selenium](https://www.seleniumhq.org) + [Mocha](https://mochajs.org) + [Chai](http://www.chaijs.com).

To run the tests:

1. `npm install` packages if you haven't already. This will download and install required test software. 
2. `npm start:test` to start the development server (keep it running while the tests run)
3. In another window run `npm test` to start the tests

You should now see a bunch of browser windows pop up, load Vorple, and close soon after. The terminal where you ran `npm test` should show whether the tests pass or fail.

`npm test` runs the tests using Firefox, `npm test:chrome` uses Chrome, `npm test:safari` uses Safari and `npm test:all` runs tests once with all browsers. To run tests in Safari, you need to enable WebDriver support [as per these instructions](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari#2957277).

The test drivers must match the version of Chrome that's installed on the machine that runs the tests. If the test runner complains about incompatible browsers, run `npm install chromedriver wdio-chromedriver-service` to update the drivers.

There are two separate story files for the Inform 6 and Inform 7 libraries. The Inform 7 tests file is used by default. The environment variable `INFORM_VERSION` defines which file to use, e.g. `INFORM_VERSION=6 npm test:chrome` tests the Inform 6 story file using Chrome. 

Hint: running the entire test set might take some time, so if you're working on only one feature you can temporarily skip other tests by changing `'./tests/specs/**/*.js'` near the start of the wdio.conf.js file to point to a specific test file.  

The tests in this repository test the individual JavaScript library methods. There are many more tests in the [Inform 7 repository](https://github.com/vorple/inform7) for the extensions.

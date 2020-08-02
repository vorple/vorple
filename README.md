# Vorple

> **Note:** This readme describes how to develop the Vorple library itself. If you're interested in developing games using Vorple, see the documentation at [vorple-if.com](https://vorple-if.com) instead.


## Building release versions

These instructions assume a Unix environment (Linux or MacOS). Setting up the environment on a Windows machine should follow similar steps.

The entire Vorple system is comprised of several parts:

* A Glulx engine [Quixe](https://github.com/erkyrath/quixe) that runs the Inform game files 
* A custom web interpreter [Haven](https://github.com/vorple/haven) that handles displaying the game output and getting input from the player
* The Vorple JavaScript library itself (this repository) that supports the non-standard features which allow the Inform game files to communicate with the browser environment 
* [Inform 6](https://github.com/vorple/inform6) and [Inform 7](https://github.com/vorple/inform7) extensions that allow game authors to use Vorple from within Inform

Building the entire thing from scratch happens as follows:

1. Install [Node.js](https://nodejs.org)
2. Install the rest of the packages with `npm install`. [npm](https://www.npmjs.com) should come with the Node.js installation.  
3. After you've cloned this repository, download all the submodules (`git submodule update --recursive --remote`)
4. Run `npm install` inside the `haven` directory
5. Run `npm run build` to build the release

The `npm run build` script compiles the Vorple and Haven source code and copies everything into a `dist` directory.  

You can also substitute npm with [Yarn](https://yarnpkg.com) (recommended). 


## Setting up the development environment

The above chapter describes how to generate the final product, but the reason you're reading this instead of downloading the already compiled zip file is probably that you want to make some modifications to the source code. The project includes [webpack-dev-server](https://github.com/webpack/webpack-dev-server) that re-runs the build step automatically whenever Vorple or Haven sources change and creates a local server that lets you try the development version locally.

Follow the instructions in the prevous chapter to set up the environment, but in the last step instead of `npm run build` command `npm start`. That starts the development server at http://localhost:9000. The server restarts automatically when changes are made to source files.

The development server exposes files from the `library` directory. For example, if you place `zork.ulx` in this directory you can play it from the address `http://localhost:9000/?story=zork.ulx` when the server is running.


## Using Vorple as a part of a JavaScript project

The build script generates `vorple.min.js` that contains Vorple, Haven and all necessary third party libraries. If you would like to use Vorple in a larger project where it's a part of a bigger machinery, you can include the source code directly instead of the full minified package.

The minimum you need is the `src` directory, the JavaScript files from [Haven](https://github.com/vorple/haven), and Git's engine files (`engine.bin`, `engine.js` and `engine.js.mem`). Vorple's JS modules assume that Haven is located in a directory called `haven` one directory down. In other words, you should have two directories, `haven` and `src` on the same level and Vorple's source files in the `src` directory (although it can be renamed to anything else, e.g. `vorple`. Haven's directory must be called exactly that.) 

Vorple and Haven source files use latest ECMAScript features like `import`. It's best to use Babel (which Webpack uses by default) to transpile the source into browser-readable JavaScript.    

You should also install the same npm libraries that Vorple and Haven have included in their `package.json` files. 


## Test suite

Tests for the JavaScript library are in the `tests/specs` directory. The test runner stack is [WebDriver](http://webdriver.io) + [Selenium](https://www.seleniumhq.org) + [Mocha](https://mochajs.org) + [Chai](http://www.chaijs.com).

To run the tests:

1. `npm install` packages if you haven't already. This will download and install required test software. 
2. `npm start` to start the development server
3. In another window run `npm test` to start the tests

You should now see a bunch of browser windows pop up, load Vorple, and close soon after. The terminal where you ran `npm test` should show whether the tests pass or fail.

`npm test` runs the tests using Firefox, `npm test:chrome` uses Chrome, `npm test:safari` uses Safari and `npm test:all` runs tests once with all browsers. To run tests in Safari, you need to enable WebDriver support [as per these instructions](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari#2957277).

There are two separate story files for the Inform 6 and Inform 7 libraries. The Inform 7 tests file is used by default. The environment variable INFORM_VERSION defines which file to use, e.g. `INFORM_VERSION=6 npm test:chrome` tests the Inform 6 story file using Chrome. 

Hint: running the entire test set might take some time, so if you're working on only one feature you can temporarily skip other tests by changing `'./tests/specs/**/*.js'` near the start of the wdio.conf.js file to point to a specific test file.  

The tests in this repository test the individual JavaScript library methods. There are many more tests in the [Inform 7 repository](https://github.com/vorple/inform7) for the extensions.
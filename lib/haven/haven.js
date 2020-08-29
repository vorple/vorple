"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;
exports.engineStops = engineStops;

var _assets = require("./assets");

var inputMethods = _interopRequireWildcard(require("./input"));

var bufferMethods = _interopRequireWildcard(require("./buffer"));

var _loader = require("./loader");

var _options = require("./options");

var promptMethods = _interopRequireWildcard(require("./prompt"));

var _style = require("./style");

var windowMethods = _interopRequireWildcard(require("./window"));

var _fastclick = _interopRequireDefault(require("./vendor/fastclick"));

var fileMethods = _interopRequireWildcard(require("./file"));

var stateMethods = _interopRequireWildcard(require("./state"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// hook that's called when the game ends (engine stops)
var quitHook = null;
/**
 * Starts the C engine. The engine should have replaced main() with an
 * otherwise empty function that only stores the command line arguments
 * for passing to the real main() later.
 *
 * startEngine() calls haven_start() in the C code, which should run
 * the real main() function that has been renamed to something else.
 *
 * Example:
 *
 * static char **my_argv;
 *
 * int main(int argc, char *argv[])
 * {
     *    my_argv = argv;
     *    return 0;
     * }
 *
 * int EMSCRIPTEN_KEEPALIVE haven_start()
 * {
     *    return real_main(2, my_argv);
     * }
 *
 * int real_main(int argc, char *argv[])  // renamed from main()
 */

function startEngine() {
  _haven_start();
}
/**
 * Start the game. If assets haven't loaded yet, the game starts
 * as soon as they're ready.
 */


function start(_x) {
  return _start.apply(this, arguments);
}

function _start() {
  _start = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(opt) {
    var havenElement, outputElement, windowElement, loaderContainer, loaderMessageElement, spinnerElement, storyFile;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // create the HTML structure
            havenElement = document.getElementById('haven');

            if (!havenElement) {
              havenElement = document.createElement('main');
              havenElement.id = 'haven';
              document.body.appendChild(havenElement);
            }

            outputElement = document.getElementById('output');

            if (!outputElement) {
              outputElement = document.createElement('div');
              outputElement.id = 'output';
              havenElement.appendChild(outputElement);
            }

            windowElement = document.getElementById('window0');

            if (!windowElement) {
              windowElement = document.createElement('div');
              windowElement.id = 'window0';
              windowElement.setAttribute('aria-live', 'polite');
              windowElement.setAttribute('aria-atomic', 'false');
              windowElement.setAttribute('aria-relevant', 'additions');
              outputElement.appendChild(windowElement);
            }

            loaderContainer = document.getElementById('loader');

            if (!loaderContainer) {
              loaderContainer = document.createElement('div');
              loaderContainer.id = 'loader';
              havenElement.appendChild(loaderContainer);
            }

            loaderMessageElement = document.getElementById('loader-message');

            if (!loaderMessageElement) {
              loaderMessageElement = document.createElement('h2');
              loaderMessageElement.id = 'loader-message';
              loaderContainer.appendChild(loaderMessageElement);
            }

            spinnerElement = document.getElementById('spinner');

            if (!spinnerElement) {
              spinnerElement = document.createElement('h2');
              spinnerElement.id = 'spinner';
              spinnerElement.innerText = '|';
              loaderContainer.appendChild(spinnerElement);
            }

            loaderMessageElement.innerText = 'Loading interpreter and game file'; // read options from URL

            (0, _options.init)(opt.options); // load the story file

            _context.next = 16;
            return opt.loadStoryFile(opt.virtualStoryfile);

          case 16:
            storyFile = _context.sent;
            // set up window elements
            (0, windowMethods.init)(); // set up input handlers

            (0, inputMethods.init)({
              expectHook: opt.hooks && opt.hooks.expectKeypress,
              submitHook: opt.hooks && opt.hooks.submitKeypress
            }); // set up output handlers

            (0, bufferMethods.init)({
              outputFilter: opt.hooks && opt.filters.output
            }); // set up the prompt

            (0, promptMethods.init)({
              enginePrompt: !!opt.enginePrompt,
              expectHook: opt.hooks && opt.hooks.expectCommand,
              inputFilter: opt.filters && opt.filters.input,
              submitHook: opt.hooks && opt.hooks.submitCommand,
              unicode: !!opt.unicode
            }); // initialize style options

            (0, _style.init)({
              engineColors: !!opt.engineColors,
              engineFontFamily: !!opt.engineFontFamily
            }); // remove the loader

            (0, _assets.addCallback)(function (cb) {
              (0, _loader.remove)();
              cb();
            }); // add the quit hook

            quitHook = opt.hooks.quit; // start the engine

            (0, _assets.finalCallback)(function () {
              return opt.startEngine(storyFile);
            });
            /**
             * fastclick.js initializer - fixes tapping issues in mobile browsers
             */

            if ('addEventListener' in document) {
              document.addEventListener('DOMContentLoaded', function () {
                _fastclick["default"].attach(document.body);
              }, false);
            }

            (0, _assets.finished)('storyfile');

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _start.apply(this, arguments);
}

function startEmpterpreter() {
  // load the Emterpreter engine
  var xhr = new XMLHttpRequest(); // use the Module config's locateFile to find engine files if it exists

  var locateFile = Module.locateFile || function (name) {
    return name;
  };

  xhr.open('GET', locateFile('engine.bin'), true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function () {
    Module.emterpreterFile = xhr.response;
    var script = document.createElement('script');
    script.src = locateFile('engine.js');
    document.body.appendChild(script);
  };

  xhr.send(null);
}

// expose methods for the C engine to use
window.haven = {
  buffer: bufferMethods,
  file: fileMethods,
  input: inputMethods,
  prompt: promptMethods,
  state: stateMethods,
  window: windowMethods
};
/**
 * Called by the engine to tell that the game has ended
 */

function engineStops() {
  if (typeof quitHook === 'function') {
    quitHook();
  }
}
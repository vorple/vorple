"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEventListener = addEventListener;
exports.evaluate = evaluate;
exports.getInformVersion = getInformVersion;
exports.init = init;
exports.removeEventListener = removeEventListener;
exports.requireVersion = requireVersion;
exports.setInformVersion = setInformVersion;
exports.triggerEvent = triggerEvent;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _haven = require("../haven/haven");

var _assets = require("../haven/assets");

var _debug = require("./debug");

var _prompt = require("./prompt");

var _haven2 = require("./haven");

var _package = require("../../package.json");

var _file = require("./file");

var _output = require("./output");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var informVersion;
/**
 * Containers for the custom event listeners.
 * @private
 */

var eventListeners = {
  init: [],
  expectCommand: [],
  submitCommand: [],
  expectKeypress: [],
  submitKeypress: [],
  quit: []
};
/**
 * Adds or removes one listener from one event.
 * 
 * @returns {boolean} False if trying to remove a listener that hasn't been registered, true otherwise 
 * @since 3.2.0
 * @private
 */

function addOrRemoveListener(eventName, listener, action) {
  if (!eventName || typeof eventName === "function") {
    return (0, _debug.error)("Event name missing when trying to ".concat(action, " an event listener"));
  }

  if (!eventListeners[eventName]) {
    return (0, _debug.error)("Tried to ".concat(action, " a listener to an unknown event ").concat(eventName));
  }

  if (typeof listener !== "function") {
    return (0, _debug.error)("Missing callback function when trying to ".concat(action, " listener for event ").concat(eventName));
  }

  if (action === "add") {
    eventListeners[eventName].push(listener);
    return true;
  } else {
    var index = eventListeners[eventName].indexOf(listener);

    if (index === -1) {
      return false;
    }

    eventListeners[eventName].splice(index, 1);
    return true;
  }
}
/**
 * Converts a number in scientific notation (e.g. 1e+30) to a decimal string.
 *
 * From http://stackoverflow.com/a/1685917
 *
 * @param {number} x
 * @returns {string}
 * @private
 */


function eToInt(x) {
  var e;

  if (Math.abs(x) < 1.0) {
    e = parseInt(x.toString().split('e-')[1]);

    if (e) {
      x *= Math.pow(10, e - 1);
      x = '0.' + new Array(e).join('0') + x.toString().substring(2);
    }
  } else {
    e = parseInt(x.toString().split('+')[1]);

    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join('0');
    }
  }

  return x;
}
/**
 * Registers a listener for an event. See "Filters and event listeners" in the documentation for details.
 * 
 * @param {string|string[]} eventNames The event name or an array of event names where to add the listener
 * @param {function} listener The listener to register
 * @returns {function} A function that can be called to remove the listeners
 * @since 3.2.0
 */


function addEventListener(eventNames, listener) {
  if (!Array.isArray(eventNames)) {
    eventNames = [eventNames];
  }

  eventNames.forEach(function (name) {
    return addOrRemoveListener(name, listener, "add");
  });
  return function () {
    return removeEventListener(eventNames, listener);
  };
}
/**
 * Evaluates JavaScript code and writes the return value and its type to the
 * virtual filesystem for the story file to read.
 *
 * @param {string} filename
 */


function evaluate(code) {
  /**
   * @private
   * Stringify a value, or return null if the value can't be stringified
   */
  var safeStringify = function safeStringify(value) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return null;
    }
  };

  var retval;
  var header = getHeader(code);
  code = code.substr(header.length);
  (0, _debug.log)('Evaluating: ' + code);
  var i7type = "nothing"; // Evaluate the JavaScript code.

  try {
    retval = new Function("'use strict';\n" + code)();
  } catch (e) {
    (0, _debug.error)('JavaScript code from story file threw an error: ' + e.message + '\n\n' + code);
  }

  var type = (0, _typeof2["default"])(retval); // build the return value

  if (type === 'undefined') {
    (0, _debug.log)('The code did not return anything');
    return;
  } else if (type === 'string') {
    retval = '"' + retval + '"';
    i7type = "text";
  } else if (type === 'function' || type === 'symbol') {
    retval = retval.toString();
    i7type = "function";
  } else if (typeof Set !== 'undefined' && retval instanceof Set) {
    retval = safeStringify(Array.from(retval));
    i7type = "list";
  } else if (retval === Infinity) {
    retval = 'Infinity';
    i7type = "infinity";
  } else if (retval === -Infinity) {
    retval = '-Infinity';
    i7type = "infinity";
  } else if (retval !== retval) {
    // NaN !== NaN
    retval = 'NaN';
    i7type = "NaN";
  } else if (type === "boolean") {
    retval = String(retval);
    i7type = "truth state";
  } else if (type === 'number') {
    if (Math.abs(retval) > 1e20) {
      // more than 20 digits are displayed in scientific notation
      retval = eToInt(retval);
    } else {
      retval = "" + retval;
    }

    i7type = "number";
  } else {
    retval = safeStringify(retval);

    if (retval) {
      var firstChar = retval.charAt(0);

      if (firstChar === "[") {
        i7type = "list";
      } else if (firstChar === "{") {
        i7type = "object";
      }
    }
  }

  (0, _debug.log)("Return value (".concat(i7type, "): ").concat(retval));
  (0, _file.write)(_file.JS_RETURN_VALUE_TYPE_FILENAME, i7type, {
    cwd: _file.VORPLE_PATH
  });
  (0, _file.write)(_file.JS_RETURN_VALUE_FILENAME, retval, {
    cwd: _file.VORPLE_PATH
  });
}
/**
 * Inform 7 adds the game's IFID to the text file which we must remove
 * before evaluating the actual content. We'll use the same header
 * to build the response file to make Inform think it's its own file.
 *
 * @param {string} content  The contents of the file
 * @private
 */


function getHeader(content) {
  if (content.charAt(0) === '*') {
    return content.substr(0, content.indexOf('\n') + 1);
  }

  return "";
}
/**
 * Returns the Inform version, detected at handshake.
 * Before the handshake the value is undefined.
 * 
 * @returns {number|undefined} 6 or 7
 * @since 3.2.0
 */


function getInformVersion() {
  return informVersion;
}
/**
 * Initializes and starts Vorple.
 */


function init() {
  return _init.apply(this, arguments);
}
/**
 * Removes a registered event listener.
 * 
 * @param {string|string[]} [eventNames] The event name or an array of event names from where to remove the listener.
 * Leaving this parameter out completely (i.e. passing the listener function as the first and only parameter)
 * removes the listener from all events where it's been registered.
 * @param {function} listener The listener to remove
 * @returns {boolean} True if the listener was removed from at least one event
 * @since 3.2.0
 */


function _init() {
  _init = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // use Haven's init listeners to trigger our own listeners
            (0, _assets.addCallback)( /*#__PURE__*/function () {
              var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(cb) {
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return triggerEvent('init');

                      case 2:
                        cb();

                      case 3:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function (_x2) {
                return _ref.apply(this, arguments);
              };
            }()); // initialize submodules

            (0, _prompt.init)();
            _context2.next = 4;
            return (0, _file.init)();

          case 4:
            // start up Haven
            (0, _haven.start)({
              // we use Vorple's custom prompt, not what the engine provides
              enginePrompt: false,
              // ignore font family
              engineFontFamily: false,
              filters: {
                input: _prompt.applyInputFilters,
                output: _output.applyOutputFilters
              },
              // have Haven trigger listeners
              hooks: {
                expectCommand: function expectCommand() {
                  triggerEvent('expectCommand');
                },
                expectKeypress: function expectKeypress() {
                  triggerEvent('expectKeypress');
                },
                quit: function quit() {
                  triggerEvent('quit');
                },
                submitCommand: function submitCommand(meta) {
                  return triggerEvent('submitCommand', meta);
                },
                submitKeypress: function submitKeypress(meta) {
                  return triggerEvent('submitKeypress', meta);
                }
              },
              // the function that loads the story file
              loadStoryFile: _haven2.loadStoryFile,
              // user-provided options
              options: vorple.options,
              // the callback that starts the interpreter after assets have loaded
              startEngine: _haven2.initQuixe,
              // Glulx has Unicode support
              unicode: true
            });

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _init.apply(this, arguments);
}

function removeEventListener(eventNames, listener) {
  // if the first parameter is a function, remove all listeners
  if (typeof eventNames === "function") {
    listener = eventNames;
    eventNames = Object.keys(eventListeners);
  } else if (!Array.isArray(eventNames)) {
    eventNames = [eventNames];
  } // if an empty array was passed, the operation is still successful even though there's nothing to do


  if (eventNames.length === 0) {
    return true;
  } // return true if at least one of the events was removed


  return eventNames.map(function (name) {
    return addOrRemoveListener(name, listener, "remove");
  }).includes(true);
}
/**
 * Require a minimum version of Vorple. Minor updates are accepted if
 * they're not specified in the request. In other words, if version "3.1"
 * is requested, then any Vorple version below 3.2 (3.1, 3.1.1, 3.1.2 etc)
 * will pass. If version "3" is requested, every version 3.x.x will pass.
 *
 * If an optional callback is passed to the function, it will be run with
 * one boolean parameter: true if version matches, false otherwise.
 * Otherwise an error is thrown if the version doesn't match.
 *
 * @param {string} requiredVersion  The minimum version of Vorple that's required.
 * @param {function} [callback]  A custom callback
 * @returns {boolean} True if version matches
 */


function requireVersion(requiredVersion, callback) {
  var thisVer = _package.version.split('.').map(function (str) {
    return Number(str);
  });

  var reqVer = ("" + requiredVersion).split('.').map(function (str) {
    return Number(str);
  });

  var cb = callback || function (match) {
    if (!match) {
      (0, _debug.error)("Vorple version ".concat(requiredVersion, " was requested, but Vorple is at version ").concat(_package.version));
    }
  };

  if (thisVer[0] < reqVer[0]) {
    cb(false);
    return false;
  }

  if (thisVer[0] > reqVer[0] || reqVer.length === 1) {
    cb(true);
    return true;
  }

  if (thisVer[1] < reqVer[1]) {
    cb(false);
    return false;
  }

  if (thisVer[1] > reqVer[1] || reqVer.length === 2 || thisVer.length === 2) {
    cb(true);
    return true;
  }

  if (thisVer[2] < reqVer[2]) {
    cb(false);
    return false;
  }

  cb(true);
  return true;
}
/**
 * Sets the Inform version.
 * 
 * @param {number} version 
 * @since 3.2.0
 * @private
 */


function setInformVersion(version) {
  informVersion = version;
}
/**
 * Runs all custom event listeners for the given event.
 * 
 * @param {string} eventName 
 * @param {object} [meta={}]
 * @since 3.2.0
 * @private
 */


function triggerEvent(_x) {
  return _triggerEvent.apply(this, arguments);
}

function _triggerEvent() {
  _triggerEvent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(eventName) {
    var meta,
        i,
        _args3 = arguments;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            meta = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {};
            i = 0;

          case 2:
            if (!(i < eventListeners[eventName].length)) {
              _context3.next = 8;
              break;
            }

            _context3.next = 5;
            return eventListeners[eventName][i](_objectSpread(_objectSpread({}, meta), {}, {
              type: eventName
            }));

          case 5:
            ++i;
            _context3.next = 2;
            break;

          case 8:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _triggerEvent.apply(this, arguments);
}
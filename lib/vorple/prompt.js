"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addInputFilter = addInputFilter;
exports.applyInputFilters = applyInputFilters;
exports.clearCommandQueue = clearCommandQueue;
exports.clearKeyQueue = clearKeyQueue;
exports.hide = hide;
exports.init = init;
exports.queueCommand = queueCommand;
exports.queueKeypress = queueKeypress;
exports.removeInputFilter = removeInputFilter;
exports.setPrefix = setPrefix;
exports.setValue = setValue;
exports.submit = submit;
exports.unhide = unhide;

var _input = require("../haven/input");

var _prompt = require("../haven/prompt");

var _vorple = require("./vorple");

var _debug = require("./debug");

var _layout = require("./layout");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var inputFilters = [];
var commandQueue = [];
var keyQueue = [];
/**
 * If there is a command waiting in the queue, submit it to the parser.
 * The command is then removed from the queue.
 */

function runCommandQueue() {
  if (commandQueue.length > 0) {
    var command = commandQueue.shift();
    submit(command.cmd, command.silent);
    return false;
  }
}
/**
 * If there is a keypress waiting in the queue, send it to the parser.
 * The key is then removed from the queue.
 * 
 * @since 3.2.0
 */


function runKeyQueue() {
  if (keyQueue.length > 0) {
    var key = keyQueue.shift();

    _input.keypress.send({
      keyCode: key.charCodeAt(0),
      force: true
    });

    return false;
  }

  return true;
}
/**
 * Registers a new input filter.
 * 
 * @param {function} filter 
 * @returns {function} A function that can be called to remove the filter
 * @since 3.2.0
 */


function addInputFilter(filter) {
  inputFilters.push(filter);
  return function () {
    return removeInputFilter(filter);
  };
}
/**
 * Runs input through all input filters.
 * 
 * @param {string} originalInput 
 * @since 3.2.0
 * @private
 */


function applyInputFilters(_x, _x2) {
  return _applyInputFilters.apply(this, arguments);
}
/**
 * Clear the command queue.
 * 
 * @since 3.2.0
 */


function _applyInputFilters() {
  _applyInputFilters = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(originalInput, meta) {
    var finalInput, i, filtered, type;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            finalInput = originalInput; // block the UI while filters run, to prevent the player from typing before the previous command has resolved

            (0, _layout.block)();
            i = 0;

          case 3:
            if (!(i < inputFilters.length)) {
              _context.next = 29;
              break;
            }

            filtered = inputFilters[i](finalInput, _objectSpread(_objectSpread({}, meta), {}, {
              input: finalInput,
              original: originalInput,
              type: "line"
            })); // resolve the value if the return value was a promise,
            // this leaves other values untouched

            _context.prev = 5;
            _context.next = 8;
            return Promise.resolve(filtered);

          case 8:
            filtered = _context.sent;
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](5);
            throw _context.t0;

          case 14:
            _context.prev = 14;
            (0, _layout.unblock)();
            return _context.finish(14);

          case 17:
            _context.t1 = filtered;
            _context.next = _context.t1 === undefined ? 20 : _context.t1 === null ? 20 : _context.t1 === true ? 20 : _context.t1 === false ? 21 : 22;
            break;

          case 20:
            return _context.abrupt("break", 26);

          case 21:
            return _context.abrupt("return", false);

          case 22:
            type = _typeof(filtered);

            if (type === "object" && filtered.then) {
              (0, _debug.error)("Input filter promise resolved into another promise, which is not allowed");
            }

            if (type === "string") {
              finalInput = filtered;
            } else {
              (0, _debug.error)("Input filter returned a value of type " + type);
            }

            return _context.abrupt("break", 26);

          case 26:
            ++i;
            _context.next = 3;
            break;

          case 29:
            (0, _layout.unblock)();
            return _context.abrupt("return", finalInput);

          case 31:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 11, 14, 17]]);
  }));
  return _applyInputFilters.apply(this, arguments);
}

function clearCommandQueue() {
  commandQueue.length = 0;
}
/**
 * Clear the keypress queue.
 * 
 * @since 3.2.0
 */


function clearKeyQueue() {
  keyQueue.length = 0;
}
/**
 * Manually hide the prompt. It won't be shown until unhide() is called.
 */


function hide() {
  $((0, _prompt.get)()).addClass('force-hidden');
}
/**
 * Hook into Haven's input listeners
 */


function init() {
  // Hook into the lineinput's ready event for passing commands from the queue.
  (0, _vorple.addEventListener)('expectCommand', runCommandQueue); // Run the key queue when the engine expects a keypress

  (0, _vorple.addEventListener)("expectKeypress", runKeyQueue);
}
/**
 * Add a command to the command queue. If the line input is ready, execute
 * the command immediately.
 *
 * @param {string} cmd
 * @param {boolean} [silent=false]  If true, the command isn't shown on the
 *      screen. The result of the command will still print normally.
 */


function queueCommand(cmd) {
  var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  commandQueue.push({
    cmd: cmd,
    silent: !!silent
  });

  if ((0, _prompt.isReady)()) {
    runCommandQueue();
  }
}
/**
 * Add a keypress to the command queue. If the engine is waiting for a keypress,
 * send it immediately.
 *
 * @param {string} key A one-character string containing the pressed character
 * @since 3.2.0
 */


function queueKeypress(key) {
  keyQueue.push(key);

  if ((0, _input.getMode)() === 'getkey') {
    runKeyQueue();
  }
}
/**
 * Removes a filter from the registered input filters.
 * 
 * @param {function} filter The filter to remove
 * @since 3.2.0
 */


function removeInputFilter(filter) {
  var index = inputFilters.indexOf(filter);

  if (index === -1) {
    return false;
  }

  inputFilters.splice(index, 1);
  return true;
}
/**
 * Set the prefix of the command prompt. The prefix is usually a greater-than
 * character (>) at the start of the command prompt.
 *
 * The currently active command prompt is changed, and the new prefix is used
 * for all future command prompts until changed again.
 *
 * @param prefix
 * @param {boolean} [html=false]  If true, the prefix is inserted into the DOM
 *   as HTML. Otherwise HTML is escaped and shown as-is.
 *
 *  @returns {string} The new prefix.
 */


function setPrefix(prefix) {
  var html = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var newPrefix = prefix;

  if (!html) {
    newPrefix = $('<div>').text(prefix).html();
  }

  _prompt.prefix.set(newPrefix);

  return newPrefix;
}
/**
 * Set the lineinput's value.
 *
 * @param value
 */


function setValue(value) {
  $((0, _prompt.get)()).find('#lineinput-field').val(value);
}
/**
 * Trigger the submit event of the lineinput.
 *
 * @param {string|null} [command] The command to send, if null or left out
 *      the lineinput field's value is used.
 * @param {boolean} [silent=false]  If true, the command isn't shown on the
 *      screen. The result of the command will still print normally.
 */


function submit(command) {
  var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  (0, _prompt.sendCommand)(new CustomEvent('submit', {
    detail: {
      silent: !!silent,
      userAction: false
    }
  }), command);
}
/**
 * Remove manual hiding of the prompt. It's called rather clumsily "unhide"
 * instead of "show" to stress that it only undoes what the hide() method did,
 * and it doesn't force the prompt to appear if it has been hidden or removed
 * by some other means.
 */


function unhide() {
  $((0, _prompt.get)()).removeClass('force-hidden');
}
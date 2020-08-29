"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.error = error;
exports.log = log;
exports.off = off;
exports.on = on;
exports.status = status;
exports.toggle = toggle;

var _error = _interopRequireDefault(require("../haven/error"));

var _buffer = require("../haven/buffer");

/**
 * @module debug
 */

/**
 * @private
 * @type {boolean}
 */
var debugState = false;
/**
 * Show an error in the console and on the screen.
 *
 * @param {string} text  Error message
 * @returns {boolean} Always returns true, for consistency with log()
 */

function error(text) {
  console.error(text);
  (0, _error["default"])(text);
  return true;
}
/**
 * Print a logging message to console and on the screen if debugging mode is on.
 *
 * @param {string} text  Text to log
 * @returns {boolean} True if a debugging message was printed, false otherwise
 */


function log(text) {
  if (!debugState) {
    return false;
  }

  console.log(text);
  (0, _buffer.append)('[' + text + ']\n', 0);
  return true;
}
/**
 * Set the debugging status off.
 *
 * @returns {boolean} the new status (always false)
 */


function off() {
  debugState = false;
  return status();
}
/**
 * Set the debugging status on.
 *
 * @returns {boolean} the new status (always true)
 */


function on() {
  debugState = true;
  return status();
}
/**
 * Returns the current state of the debugging flag.
 *
 * @returns {boolean}
 */


function status() {
  return debugState;
}
/**
 * Set or unset the the debugging flag.
 *
 * @returns {boolean} The new status of the debugging flag.
 */


function toggle() {
  debugState = !debugState;
  return status();
}
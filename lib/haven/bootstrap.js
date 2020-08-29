"use strict";

var _assets = require("./assets");

var _error = _interopRequireDefault(require("./error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

window.Module = {
  arguments: [],
  preRun: [],
  postRun: [function () {
    (0, _assets.finished)('engine');
  }],
  print: function print(text) {
    // The engine should always use the custom text printing methods.
    // Anything printed to stdout is an error.
    (0, _error["default"])("Unexpected engine output to stdout: " + text);
  },
  printErr: function printErr() {
    console.log(arguments);
    (0, _error["default"])(Array.prototype.slice.call(arguments).join(' '));
  },
  TOTAL_MEMORY: 33554432 // Twice the default; this is enough to run any existing Glulx game.

};
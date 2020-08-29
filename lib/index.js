"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _vexJs = _interopRequireDefault(require("vex-js"));

var _package = require("../../package.json");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

window.vorple = _objectSpread(_objectSpread({}, require("./vorple")), {}, {
  audio: require("./audio"),
  debug: require("./debug"),
  file: require("./file"),
  haven: require("./haven"),
  layout: require("./layout"),
  output: require("./output"),
  prompt: require("./prompt"),
  options: {},
  version: _package.version
}); // initialize Vex modal windows

_vexJs["default"].registerPlugin(require("vex-dialog"));

window.vex = _vexJs["default"];
_vexJs["default"].defaultOptions.className = "vex-theme-plain"; // load the PowerTip tooltip library

require("jquery-powertip"); // expose Toastr notification library


window.toastr = require("toastr");
var _default = window.vorple;
exports["default"] = _default;
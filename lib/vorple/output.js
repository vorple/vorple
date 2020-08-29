"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addOutputFilter = addOutputFilter;
exports.applyOutputFilters = applyOutputFilters;
exports.removeOutputFilter = removeOutputFilter;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Output filter methods.
 * 
 * @module output
 * @since 3.2.0
 */
var outputFilters = [];
/**
 * Registers a new output filter.
 * 
 * @param {function} filter 
 * @returns {function} A function that can be called to remove the filter
 */

function addOutputFilter(filter) {
  outputFilters.push(filter);
  return function () {
    return removeOutputFilter(filter);
  };
}
/**
 * Runs output through all output filters.
 * 
 * @param {string} originalOutput 
 * @private
 */


function applyOutputFilters(originalOutput, meta) {
  var finalOutput = originalOutput;

  for (var i = 0; i < outputFilters.length; ++i) {
    var filtered = outputFilters[i](finalOutput, _objectSpread(_objectSpread({}, meta), {}, {
      output: finalOutput,
      original: originalOutput
    })); // a filter that returns false breaks the chain

    if (filtered === false) {
      break;
    }

    if (typeof filtered === "string") {
      finalOutput = filtered;
    }
  }

  return finalOutput;
}
/**
 * Removes a filter from the registered output filters.
 * 
 * @param {function} filter The filter to remove
 */


function removeOutputFilter(filter) {
  var index = outputFilters.indexOf(filter);

  if (index === -1) {
    return false;
  }

  outputFilters.splice(index, 1);
  return true;
}
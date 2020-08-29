"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.append = append;
exports.flush = flush;
exports.init = init;
exports.newline = newline;

var _input = require("./input");

var _style = require("./style");

// output buffers for all windows
var outputBuffer = [""]; // custom output filters

var outputFilter = null;
/**
 * Make text HTML-printable
 *
 * @param text
 * @returns {string}
 */

function encodeHtml(text) {
  var encoded = "";

  for (var i = 0; i < text.length; ++i) {
    // Extended Latin-1 characters need to be added as HTML entities
    if (text.charCodeAt(i) > 127) {
      encoded += "&#" + text.charCodeAt(i) + ";";
    } else {
      switch (text[i]) {
        case '&':
          encoded += '&amp;';
          break;

        case '<':
          encoded += '&lt;';
          break;

        case '>':
          encoded += '&gt;';
          break;

        case '\r':
          encoded += '\n';
          break;

        default:
          encoded += text[i];
          break;
      }
    }
  }

  return encoded;
}
/**
 * Add text to the text buffer
 *
 * @param text
 * @param targetWindow
 */


function append(text) {
  var targetWindow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  if (!outputBuffer[targetWindow]) {
    outputBuffer[targetWindow] = "";
  }

  if (text.indexOf('\n') > -1 || text.indexOf('\r') > -1) {
    var nextLBR = Math.max(text.lastIndexOf('\n'), text.lastIndexOf('\r')) + 1;
    outputBuffer[targetWindow] += encodeHtml(text.substr(0, nextLBR));
    flush(targetWindow);
    outputBuffer[targetWindow] = encodeHtml(text.substr(nextLBR));
  } else {
    outputBuffer[targetWindow] += encodeHtml(text);
  }
}
/**
 * Print out the text buffer
 *
 * @param targetWindow
 */


function flush(targetWindow) {
  if (targetWindow === undefined) {
    for (var i in outputBuffer) {
      flush(+i);
    }
  }

  if (!outputBuffer[targetWindow] || !haven.window.get(targetWindow)) {
    return;
  }

  var output = outputBuffer[targetWindow]; // call output filters

  if (targetWindow === 0 && outputFilter && output !== '') {
    var currentStyles = _style.font.get()[0];

    var filterResult = outputFilter(output, {
      style: {
        bold: Boolean(currentStyles.bold),
        italic: Boolean(currentStyles.italic)
      }
    });

    if (typeof filterResult === "string") {
      output = filterResult;
    }
  } //        console.log('flushing', outputBuffer[ targetWindow ] );


  haven.window.append(output, targetWindow);
  outputBuffer[targetWindow] = "";

  if (targetWindow === 0) {
    (0, _input.textWasPrinted)(true);
  }
}
/**
 * Register the output filter
 */


function init(opt) {
  if (opt && opt.outputFilter) {
    outputFilter = opt.outputFilter;
  }
}
/**
 * Add a newline to the buffer.
 *
 * @param targetWindow
 */


function newline(targetWindow) {
  if (outputBuffer[targetWindow]) {
    outputBuffer[targetWindow] += '\n';
  } else {
    outputBuffer[targetWindow] = '\n';
  }

  flush(targetWindow);
}
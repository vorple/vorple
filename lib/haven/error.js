"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = error;

/**
 * Show an error message and halt.
 */
function error(message) {
  var elem = document.createElement('div');
  var spinner = document.getElementById('spinner');
  var loader = document.getElementById('loader');
  elem.id = 'fatal-error';
  elem.innerHTML = message;
  document.body.appendChild(elem); // remove spinner animation if error happened on load

  if (spinner) {
    spinner.parentNode.removeChild(spinner);
  } // visual notification that loading has stopped


  if (loader) {
    loader.className = 'stopped';
  }

  throw new Error(message);
}
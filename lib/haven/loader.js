"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remove = remove;

function remove() {
  var loaderOverlay = document.getElementById('loader');

  if (loaderOverlay) {
    loaderOverlay.parentNode.removeChild(loaderOverlay);
  }
}
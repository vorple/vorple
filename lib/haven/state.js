"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restoreUI = restoreUI;
exports.autosave = void 0;

var _options = require("./options");

var _prompt = require("./prompt");

var _window = require("./window");

var _style = require("./style");

var autosaveFilename = "";
/**
 * Read the UI state from the filesystem.
 */

function readUIState() {
  try {
    var state = FS.readFile(autosaveFilename + '_uidata', {
      encoding: 'utf8'
    });
    return JSON.parse(state);
  } catch (e) {
    return null;
  }
}

var autosave = {
  /**
   * Delete the autosave files.
   */
  remove: function remove() {
    try {
      FS.unlink(autosaveFilename);
    } catch (e) {}

    try {
      FS.unlink(autosaveFilename + '_uidata');
    } catch (e) {}
  },

  /**
   * Pass the autosave's filename to the engine that takes care of
   * reloading the save.
   */
  restore: function restore() {
    try {
      // Try to open the autosave file.
      // If it doesn't exist, this throws an error.
      FS.stat(autosaveFilename);
      Module.ccall('hugojs_set_autosave_filename', 'null', ['string'], [autosaveFilename]);
    } catch (e) {// autosave file doesn't exist, do nothing
    }
  },
  save: function save() {
    if (!(0, _options.get)('autosave')) {
      return;
    } // trigger engine autosave


    var engineSaveSucceeded = Module.ccall('haven_save_autosave', 'int', ['string'], [autosaveFilename]); // save UI state

    if (engineSaveSucceeded) {
      FS.writeFile(autosaveFilename + '_uidata', JSON.stringify(haven.window.getUIState()), {
        encoding: 'utf8'
      });
    }
  },

  /**
   * Remember the autosave's filename
   * @param filename
   */
  setName: function setName(filename) {
    autosaveFilename = filename;
  }
};
/**
 * Restore saved UI state.
 */

exports.autosave = autosave;

function restoreUI() {
  var savedState = readUIState();
  var windowCount;

  if (!savedState) {
    return;
  } // if windowing has been set off in options, restore only the main window


  if ((0, _options.get)('windowing')) {
    windowCount = savedState.windowContents.length;
  } else {
    windowCount = 1;
  }

  (0, _window.clear)();

  for (var i = 0; i < windowCount; ++i) {
    (0, _window.create)(i, savedState.windowDimensions[i].left, savedState.windowDimensions[i].top, savedState.windowDimensions[i].right, savedState.windowDimensions[i].bottom);
  }

  _style.color.restore(savedState.currentColors);

  (0, _style.restore)(savedState.font);

  _window.position.restore(savedState.position);

  if (savedState.title) {
    document.title = savedState.title;
  }

  for (var _i = 0; _i < savedState.windowContents.length; ++_i) {
    (0, _window.get)(_i).innerHTML = savedState.windowContents[_i];
    (0, _style.apply)(haven.window.get(_i), _i);
  }

  (0, _style.apply)(document.body, 0); // TODO: only for Hugo!
  // set the same style we had when saving

  Module.ccall('hugojs_set_font', 'null', ['int'], [savedState.font[0].original]);
  Module.ccall('hugojs_set_colors', 'null', ['int', 'int'], [savedState.currentColors[0].text, savedState.currentColors[0].background]); // restore command history

  _prompt.history.set(savedState.cmdHistory || []); // scroll to the bottom


  window.scrollTo(0, 9e9);
  (0, _prompt.setDoScroll)();
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initQuixe = initQuixe;
exports.loadStoryFile = loadStoryFile;
exports.setBase64StoryFile = setBase64StoryFile;
exports.setStyle = setStyle;
exports.setStyleHint = setStyleHint;

require("./glk");

var _style = require("../haven/style");

var _error = _interopRequireDefault(require("../haven/error"));

var _options = require("../haven/options");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * @module haven
 * @private
 *
 * Helper functions and monkey patches to the Haven engine
 */
// Inform 7 creates a file that puts the story file in this variable
var base64StoryFile = null;
var stylehints = []; // default

stylehints[0] = {
  bold: false,
  italic: false,
  underline: false //  proportional: true

}; // Emphasized

stylehints[1] = {
  italic: true
}; // Preformatted

stylehints[2] = {// proportional: false
}; // Header

stylehints[3] = {
  bold: true
}; // Subheader

stylehints[4] = {
  bold: true
};
/**
 * Start Quixe. Uses the base64StoryFile data (from Inform 7)
 * if a file hasn't been specified
 * 
 * @since 3.2.0
 * @private
 */

function initQuixe(storyfile) {
  if (!window.Quixe) {
    (0, _error["default"])("Can't find Quixe");
  }

  if (!window.GiDispa) {
    (0, _error["default"])("Can't find GiDispa");
  }

  window.GlkOte = {
    log: function log() {}
  };
  GiLoad.load_run(null, storyfile, typeof storyfile === 'string' ? 'base64' : undefined);
}
/**
 * Load the story file.
 *  
 * @since 3.2.0
 * @private
 */


function loadStoryFile() {
  // use "storyfile" parameter if it exists, to bypass the Quixe file loader
  var url = (0, _options.get)('storyfile') || (0, _options.get)('story');

  if (base64StoryFile) {
    var storydata = base64StoryFile;
    base64StoryFile = null; // no need to keep the original data, free the memory

    return storydata;
  }

  return new Promise(function (resolve, reject) {
    var httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == XMLHttpRequest.DONE) {
        switch (httpRequest.status) {
          case 200:
            resolve(Array.from(new Uint8Array(httpRequest.response)));
            break;

          default:
            reject((0, _error["default"])("Error loading game file. Server returned status code " + httpRequest.status + " (" + httpRequest.statusText + ")"));
            break;
        }
      }
    };

    httpRequest.open("GET", url, true);
    httpRequest.responseType = "arraybuffer"; // this must be exactly here, otherwise IE11 breaks

    httpRequest.send();
  });
}
/**
 * Inform 7 interpreter template calls this to set the story file data.
 * 
 * @since 3.2.0
 * @private
 */


function setBase64StoryFile(data) {
  base64StoryFile = data;
}
/**
 * Based on Glulx style code, set the basic style of the text being printed.
 * 
 * @param {number} style 
 */


function setStyle(style) {
  /*
   #define style_Normal (0)
   #define style_Emphasized (1)
   #define style_Preformatted (2)
   #define style_Header (3)
   #define style_Subheader (4)
   #define style_Alert (5)
   #define style_Note (6)
   #define style_BlockQuote (7)
   #define style_Input (8)
   #define style_User1 (9)
   #define style_User2 (10)
   #define style_NUMSTYLES (11)
   */
  if (!stylehints[style]) {
    return;
  }

  for (var i in stylehints[style]) {
    (0, _style.set)(i, stylehints[style][i], 0);
  }
}
/**
 * Changes the appearance of a default style.
 *
 * @param style
 * @param hint
 * @param value
 */


function setStyleHint(style, hint, value) {
  if (!stylehints[style]) {
    stylehints[style] = {
      bold: false,
      italic: false,
      underline: false //          proportional: true

    };
  }

  var st = stylehints[style];

  switch (hint) {
    case 4:
      // Weight
      st.bold = value === 1;
      break;

    case 5:
      // Oblique
      st.italic = value === 1;
      break;

    case 6:
      // Proportional
      //                st.proportional = (value === 1);
      break;
  }
}
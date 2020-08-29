"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
exports.init = init;
exports.restore = restore;
exports.set = set;
exports.setGlulxStyle = setGlulxStyle;
exports.setGlulxStyleHint = setGlulxStyleHint;
exports.font = exports.color = void 0;

var _buffer = require("./buffer");

var _options = require("./options");

var _prompt = require("./prompt");

// currently set colors
var currentColors = [defaultColors(0)]; // currently set fonts

var currentFont = [defaultStyles()]; // let engine decide text and background colors?

var engineColors = true; // ignore font family settings? (proportional/fixed-width)

var ignoreFontFamily = false;
/**
 * Get the default colors of a font object
 *
 * @param targetWindow
 * @returns {{text: number, background: number}}
 */

function defaultColors(targetWindow) {
  if (targetWindow === 1) {
    // status line
    return {
      text: 15,
      background: 1
    };
  } else {
    return {
      text: 7,
      background: 0
    };
  }
}
/**
 * Default styles of the font
 */


function defaultStyles() {
  return {
    bold: false,
    italic: false,
    underline: false,
    proportional: true,
    original: 0 // the original integer value of the font

  };
}
/**
 * Set currently active font styles and colors to an element.
 *
 * @param elem
 * @param targetWindow
 */


function apply(elem, targetWindow) {
  var newClasses = [];
  var prompt = (0, _prompt.get)().getElementsByTagName('INPUT')[0];
  var setPromptStyle = targetWindow === 0;

  if (!currentColors[targetWindow]) {
    currentColors[targetWindow] = defaultColors(targetWindow);
  }

  if (engineColors) {
    newClasses.push("textcolor-" + currentColors[targetWindow].text);
    newClasses.push("bgcolor-" + currentColors[targetWindow].background);
  } // remove old class styles


  elem.className = elem.className.replace(/\b(text|bg)color-\d+/g, "");
  elem.classList.remove("font-fixed-width");

  if (setPromptStyle) {
    prompt.className = prompt.className.replace(/\b(text|bg)color-\d+/g, "");
    prompt.classList.remove("font-fixed-width");
  }

  if (!currentFont[targetWindow]) {
    currentFont[targetWindow] = defaultStyles();
  }

  for (var prop in currentFont[targetWindow]) {
    if (ignoreFontFamily && prop === 'proportional') {
      continue;
    }

    if (currentFont[targetWindow].hasOwnProperty(prop)) {
      elem.classList.remove("font-" + prop);

      if (setPromptStyle) {
        prompt.classList.remove("font-" + prop);
      }

      if (currentFont[targetWindow][prop]) {
        newClasses.push("font-" + prop);
      }
    }
  }

  if (!ignoreFontFamily && currentFont[targetWindow].hasOwnProperty('proportional') && !currentFont[targetWindow].proportional) {
    newClasses.push("font-fixed-width");
  }

  for (var i = 0; i < newClasses.length; ++i) {
    elem.classList.add(newClasses[i]);

    if (setPromptStyle) {
      prompt.classList.add(newClasses[i]);
    }
  }
}

;
var color = {
  get: function get() {
    return currentColors;
  },
  restore: function restore(oldState) {
    currentColors = oldState;
  },

  /**
   * Set colors in windows
   *
   * @param which
   * @param color
   * @param targetWindow
   */
  set: function set(which, color, targetWindow) {
    if (!currentColors[targetWindow]) {
      currentColors[targetWindow] = defaultColors(targetWindow);
    }

    if (currentColors[targetWindow][which] === color) {
      // the color doesn't change, do nothing
      return;
    }

    (0, _buffer.flush)(targetWindow);
    currentColors[targetWindow][which] = color;
  }
};
exports.color = color;
var font = {
  get: function get() {
    return currentFont;
  }
};
exports.font = font;

function init(options) {
  ignoreFontFamily = !options.engineFontFamily;
  engineColors = options.engineColors;
}
/**
 * Restore the entire style state.
 *
 * @param oldState
 */


function restore(oldState) {
  currentFont = oldState;
}
/**
 * Set a current style attribute.
 *
 * @param {string} type  bold, italic, underline, or proportional
 * @param {boolean} value
 * @param {number} targetWindow
 */


function set(type, value, targetWindow) {
  (0, _buffer.flush)(targetWindow);
  currentFont[targetWindow][type] = value;
}

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

function setGlulxStyle(style) {
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
    set(i, stylehints[style][i], 0);
  }
}
/**
 * Changes the appearance of a default style.
 *
 * @param style
 * @param hint
 * @param value
 */


function setGlulxStyleHint(style, hint, value) {
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
/*
// Set Emscripten's command line arguments that load the story file
window.Module.arguments = [
    '-q',   // quiet (don't print interpreter info)
    '-u',   // with unicode support
    '/storyfile.gblorb'
];

*/
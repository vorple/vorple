"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMode = getMode;
exports.init = init;
exports.setMode = setMode;
exports.textWasPrinted = textWasPrinted;
exports.getTextWasPrinted = getTextWasPrinted;
exports.keypress = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _buffer = require("./buffer");

var _prompt = require("./prompt");

var _error = _interopRequireDefault(require("./error"));

// current mode of input the game expects: buffer, getkey, getline or endgame.
// null is no input accepted (during startup)
var inputMode = null; // stores keypresses pressed when the engine isn't specifically expecting them ("buffer" inputMode)

var keypressBuffer = [];
var isTextPrinted = false; // custom keypress hooks

var submitHook = null;
/**
 * Returns the current input mode.
 *
 * @returns {string}
 */

function getMode() {
  return inputMode;
}
/**
 * Registers listeners and hooks
 * 
 * @param {object} opt 
 */


function init(opt) {
  // register hooks
  keypress.addListener(opt.expectHook);
  submitHook = opt.submitHook; // listen to keypresses and mouse clicks

  document.addEventListener('keydown', keypress.send, false);
  document.addEventListener('click', keypress.send, false);
}

var keypressListeners = [];
var keypress = {
  /**
   * Add a listener that's called when the engine starts waiting for a keypress.
   * 
   * @param {function} listener The function that's called
   * @returns {function} A function that will remove the listener when called.
   */
  addListener: function addListener(listener) {
    keypressListeners.push(listener);
    return function () {
      return keypress.removeListener(listener);
    };
  },

  /**
   * Called when the game starts.
   */
  init: function init() {
    // start expecting keypresses
    if (!inputMode) {
      inputMode = 'buffer';
    }
  },

  /**
   * Check if there's a keypress waiting in the buffer.
   *
   * Called by the engine.
   *
   * @returns {boolean}
   */
  isWaiting: function isWaiting() {
    (0, _buffer.flush)();

    if (isTextPrinted) {
      (0, _prompt.scrollOrFocus)();
    }

    return keypressBuffer.length > 0;
  },

  /**
   * Remove a keypress listener.
   * 
   * @param {function} listener The function to remove
   * @returns {boolean} True if the listener was found and removed, false if it wasn't found as a listener
   */
  removeListener: function removeListener(listener) {
    var index = keypressListeners.indexOf(listener);

    if (index === -1) {
      return false;
    }

    keypressListeners.splice(index, 1);
    return true;
  },

  /**
   * Send the keypress to the engine.
   * 
   * @param {object} e The keypress event.
   */
  send: function send(e) {
    var keyCode = e.keyCode;
    var isClick = e instanceof MouseEvent;
    var doc = document.documentElement;
    var scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    var promptHidden = !(0, _prompt.get)().parentNode;
    var shouldSendChar = false; // don't react to modifier keys

    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }

    switch (inputMode) {
      case 'buffer':
        keypressBuffer.push(keyCode);
        break;

      case 'getline':
      case null:
        // do nothing except scroll
        (0, _prompt.scrollOrFocus)(e);
        return;

      case 'getkey':
        if (e.preventDefault) {
          e.preventDefault();
        } // continue with script


        shouldSendChar = true;
        break;

      case 'endgame':
        window.location = hugojs_options.exit_url;
        return;

      default:
        (0, _error["default"])('Interpreter error: unknown input mode ' + inputMode);
    } // let the scroll handler take this if we're not at the end of the page


    if (scrolltop + window.innerHeight < document.body.clientHeight - (promptHidden ? 0 : 40)) {
      (0, _prompt.scrollOrFocus)(e); // If the force flag is set, continue with the action.
      // Otherwise this was a user action and we can interpret it as
      // "just scroll to bottom".

      if (!e.force) {
        return;
      }
    }

    inputMode = 'buffer';
    /*
    Module.ccall(
        'haven_getkey',
        'null',
        [ 'number' ],
        [ keyCode ]
    );
    */

    if (shouldSendChar) {
      if (typeof submitHook === 'function') {
        var hook = submitHook({
          event: e.force ? null : e,
          input: isClick ? null : keyCode,
          original: isClick ? null : keyCode,
          userAction: !e.force,
          mouseClick: isClick
        });

        if ((0, _typeof2["default"])(hook) === 'object' && hook.then) {
          hook.then(function () {
            return window.Glk.sendChar(keyCode);
          });
          return;
        }
      }

      window.Glk.sendChar(keyCode);
    }
  },
  wait: function wait() {
    inputMode = 'getkey';
    (0, _buffer.flush)();
    (0, _prompt.scrollOrFocus)();
    (0, _prompt.setDoScroll)();
    setTimeout(function () {
      keypressListeners.forEach(function (listener) {
        return listener();
      }); // if there's something in the keypress buffer, "push" that key

      if (keypressBuffer.length > 0) {
        keypress.send({
          keyCode: keypressBuffer.shift()
        });
      }
    }, 1);
  }
};
/**
 * Set a new input mode.
 *
 * @param mode
 */

exports.keypress = keypress;

function setMode(mode) {
  inputMode = mode;
}
/**
 * Makes a note that text has been printed on the screen since last check
 *
 * @param newState
 */


function textWasPrinted() {
  var newState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  isTextPrinted = newState;
}

function getTextWasPrinted() {
  return textWasPrinted;
}
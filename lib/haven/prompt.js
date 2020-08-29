"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expectInput = expectInput;
exports.get = get;
exports.hide = hide;
exports.sendCommand = sendCommand;
exports.init = init;
exports.isReady = isReady;
exports.scrollOrFocus = scrollOrFocus;
exports.setDoScroll = setDoScroll;
exports.show = show;
exports.prefix = exports.history = void 0;

var _buffer = require("./buffer");

var _input = require("./input");

var _state = require("./state");

var _window = require("./window");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// command history
var cmdHistory = []; // current position in the command history.

var currentCmdIndex = 0; // stores the currently typed command when browsing the history

var currentCmdText = ""; // should the screen scroll down? Set to false after screen clear.

var doScroll = false; // does the engine handle printing the prompt prefix?

var enginePrompt = false; // input element

var inputElem = null; // has text been printed on screen?

var isTextPrinted = false; // prefix, i.e. the > or whatever else is shown before the input field

var prefixElem = null; // the parent prompt form element

var promptElem = null; // new event type for others (mainly Vorple) who need to know when line
// input is available

var lineinputReadyEvent = new CustomEvent('lineinputReady'); // the hooks that are called when the engine requests and sends lineinput

var expectHook = null;
var submitHook = null; // the input filter that's applied to input going to the engine

var inputFilter = null;
/**
 * Append the line input to the transcript.
 *
 * @param caret
 * @param inputText
 * @param targetContainer
 */

function appendPrompt(caret, inputText, targetContainer) {
  var target = _window.container.get(targetContainer);

  var lastLineinput = document.createElement('div');
  var lastPrefix = document.createElement('span');
  var lastCommand = document.createElement('span'); // remove the last marker from the previously last input

  var previousLastPrompt = document.querySelector('.lineinput.last');

  if (previousLastPrompt) {
    previousLastPrompt.classList.remove('last');
  }

  lastLineinput.className = 'lineinput last';
  lastPrefix.className = 'prompt-prefix';
  lastCommand.className = 'prompt-input';
  lastPrefix.innerHTML = caret;
  lastCommand.innerHTML = inputText;
  lastLineinput.appendChild(lastPrefix);
  lastLineinput.appendChild(lastCommand);
  target.appendChild(lastLineinput);
}
/**
 * Change the prompt input to next or previous command in the command history.
 *
 * @param delta 1 for next command, -1 for previous
 */


function getCmdFromHistory(delta) {
  var current = currentCmdIndex;
  var new_current = current - delta;
  var historyLength = cmdHistory.length;

  if (current === historyLength) {
    currentCmdText = inputElem.value;
  } // Check it's within range


  if (new_current < historyLength && new_current >= 0) {
    inputElem.value = cmdHistory[new_current];
    currentCmdIndex = new_current;
  } else if (new_current === historyLength) {
    inputElem.value = currentCmdText;
    currentCmdIndex = new_current;
  }
}
/**
 * Scroll down until text content becomes visible.
 */


function scrollToContent() {
  var output = (0, _window.get)(0);
  var statusline = (0, _window.get)(1);
  var nodes = textNodesUnder(output);
  var scrolltop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
  var nonWhitespaceRegex = /\S/;

  for (var i = 0; i < nodes.length; ++i) {
    if (nonWhitespaceRegex.test(nodes[i].textContent)) {
      var newScrollTop = nodes[i].parentNode.getBoundingClientRect().top - window.innerHeight / 3;

      if (statusline) {
        newScrollTop += statusline.getBoundingClientRect().height;
      }

      if (scrolltop < newScrollTop) {
        window.scrollTo(0, newScrollTop);
      }

      return;
    }
  }
}
/**
 * Get all text nodes contained by a DOM node
 *
 * From http://stackoverflow.com/a/10730777
 *
 * @param node
 * @returns {Array}
 */


function textNodesUnder(node) {
  var all = [];

  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === 3) {
      all.push(node);
    } else {
      all = all.concat(textNodesUnder(node));
    }
  }

  return all;
}
/**
 * The engine is expecting lineinput. Show the prompt and trigger custom hooks.
 */


function expectInput() {
  // show the prompt
  show(); // rotate turn markers

  var parentWindow = (0, _window.get)(0);
  var previousTurn = parentWindow.querySelector('.turn.previous');

  if (previousTurn) {
    previousTurn.classList.remove('previous');
  }

  var currentTurn = parentWindow.querySelector('.turn.current');

  if (currentTurn) {
    currentTurn.classList.remove('current');
    currentTurn.classList.add('previous');
  } // trigger hooks


  if (typeof expectHook === 'function') {
    setTimeout(expectHook, 1);
  }
}
/**
 * Getter for the lineinput form element.
 *
 * @returns {Element}
 */


function get() {
  return promptElem;
}
/**
 * Hide the prompt and stop expecting line input.
 */


function hide() {
  (0, _input.setMode)('buffer');

  if (promptElem.parentNode) {
    promptElem.parentNode.removeChild(promptElem);
  }
}

;
/**
 * Add, remove, and clear commands in the history.
 */

var history = {
  /**
   * Add a command to the command history.
   *
   * @param cmd
   * @returns {boolean} True if successful
   */
  add: function add(cmd) {
    if (cmd) {
      cmdHistory.push(cmd);
      return true;
    }

    return false;
  },

  /**
   * Clear the entire command history.
   */
  clear: function clear() {
    cmdHistory = [];
    currentCmdIndex = 0;
  },

  /**
   * Returns a copy of the entire command history.
   *
   * @returns {Array}
   */
  get: function get() {
    return cmdHistory.slice();
  },

  /**
   * Remove a single item from the command history.
   *
   * @param {number} index The index of the command to remove. If empty,
   *  the last command will be removed.
   * @returns {boolean} True if removal was successful.
   */
  remove: function remove(index) {
    if (cmdHistory.length === 0) {
      return false;
    }

    if (typeof index !== 'number') {
      cmdHistory.pop();

      if (currentCmdIndex > cmdHistory.length) {
        currentCmdIndex = cmdHistory.length;
      }

      return true;
    }

    if (index < 0 || index >= cmdHistory.length) {
      return false;
    }

    cmdHistory.splice(index, 1); // if this caused the history elements to shift and the current index
    // was in the part that shifted, move the index to match the old spot

    if (currentCmdIndex > index) {
      currentCmdIndex--;
    }

    return true;
  },

  /**
   * Sets a completely new command history.
   *
   * @param {Array} newHistory An array of strings that becomes the new
   *  command history.
   */
  set: function set(newHistory) {
    cmdHistory = newHistory.slice();
  }
}; // Convert accented characters to plain ASCII. From http://stackoverflow.com/a/18391901

exports.history = history;
var defaultDiacriticsRemovalMap = [{
  base: 'A',
  letters: "A\u24B6\uFF21\xC0\xC1\xC2\u1EA6\u1EA4\u1EAA\u1EA8\xC3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\xC4\u01DE\u1EA2\xC5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F"
}, {
  base: 'AA',
  letters: "\uA732"
}, {
  base: 'AE',
  letters: "\xC6\u01FC\u01E2"
}, {
  base: 'AO',
  letters: "\uA734"
}, {
  base: 'AU',
  letters: "\uA736"
}, {
  base: 'AV',
  letters: "\uA738\uA73A"
}, {
  base: 'AY',
  letters: "\uA73C"
}, {
  base: 'B',
  letters: "B\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181"
}, {
  base: 'C',
  letters: "C\u24B8\uFF23\u0106\u0108\u010A\u010C\xC7\u1E08\u0187\u023B\uA73E"
}, {
  base: 'D',
  letters: "D\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779"
}, {
  base: 'DZ',
  letters: "\u01F1\u01C4"
}, {
  base: 'Dz',
  letters: "\u01F2\u01C5"
}, {
  base: 'E',
  letters: "E\u24BA\uFF25\xC8\xC9\xCA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\xCB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E"
}, {
  base: 'F',
  letters: "F\u24BB\uFF26\u1E1E\u0191\uA77B"
}, {
  base: 'G',
  letters: "G\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E"
}, {
  base: 'H',
  letters: "H\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D"
}, {
  base: 'I',
  letters: "I\u24BE\uFF29\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197"
}, {
  base: 'J',
  letters: "J\u24BF\uFF2A\u0134\u0248"
}, {
  base: 'K',
  letters: "K\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2"
}, {
  base: 'L',
  letters: "L\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780"
}, {
  base: 'LJ',
  letters: "\u01C7"
}, {
  base: 'Lj',
  letters: "\u01C8"
}, {
  base: 'M',
  letters: "M\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C"
}, {
  base: 'N',
  letters: "N\u24C3\uFF2E\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4"
}, {
  base: 'NJ',
  letters: "\u01CA"
}, {
  base: 'Nj',
  letters: "\u01CB"
}, {
  base: 'O',
  letters: "O\u24C4\uFF2F\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C"
}, {
  base: 'OI',
  letters: "\u01A2"
}, {
  base: 'OO',
  letters: "\uA74E"
}, {
  base: 'OU',
  letters: "\u0222"
}, {
  base: 'OE',
  letters: "\x8C\u0152"
}, {
  base: 'oe',
  letters: "\x9C\u0153"
}, {
  base: 'P',
  letters: "P\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754"
}, {
  base: 'Q',
  letters: "Q\u24C6\uFF31\uA756\uA758\u024A"
}, {
  base: 'R',
  letters: "R\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782"
}, {
  base: 'S',
  letters: "S\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784"
}, {
  base: 'T',
  letters: "T\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786"
}, {
  base: 'TZ',
  letters: "\uA728"
}, {
  base: 'U',
  letters: "U\u24CA\uFF35\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244"
}, {
  base: 'V',
  letters: "V\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245"
}, {
  base: 'VY',
  letters: "\uA760"
}, {
  base: 'W',
  letters: "W\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72"
}, {
  base: 'X',
  letters: "X\u24CD\uFF38\u1E8A\u1E8C"
}, {
  base: 'Y',
  letters: "Y\u24CE\uFF39\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE"
}, {
  base: 'Z',
  letters: "Z\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762"
}, {
  base: 'a',
  letters: "a\u24D0\uFF41\u1E9A\xE0\xE1\xE2\u1EA7\u1EA5\u1EAB\u1EA9\xE3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\xE4\u01DF\u1EA3\xE5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250"
}, {
  base: 'aa',
  letters: "\uA733"
}, {
  base: 'ae',
  letters: "\xE6\u01FD\u01E3"
}, {
  base: 'ao',
  letters: "\uA735"
}, {
  base: 'au',
  letters: "\uA737"
}, {
  base: 'av',
  letters: "\uA739\uA73B"
}, {
  base: 'ay',
  letters: "\uA73D"
}, {
  base: 'b',
  letters: "b\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253"
}, {
  base: 'c',
  letters: "c\u24D2\uFF43\u0107\u0109\u010B\u010D\xE7\u1E09\u0188\u023C\uA73F\u2184"
}, {
  base: 'd',
  letters: "d\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A"
}, {
  base: 'dz',
  letters: "\u01F3\u01C6"
}, {
  base: 'e',
  letters: "e\u24D4\uFF45\xE8\xE9\xEA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\xEB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD"
}, {
  base: 'f',
  letters: "f\u24D5\uFF46\u1E1F\u0192\uA77C"
}, {
  base: 'g',
  letters: "g\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F"
}, {
  base: 'h',
  letters: "h\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265"
}, {
  base: 'hv',
  letters: "\u0195"
}, {
  base: 'i',
  letters: "i\u24D8\uFF49\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131"
}, {
  base: 'j',
  letters: "j\u24D9\uFF4A\u0135\u01F0\u0249"
}, {
  base: 'k',
  letters: "k\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3"
}, {
  base: 'l',
  letters: "l\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747"
}, {
  base: 'lj',
  letters: "\u01C9"
}, {
  base: 'm',
  letters: "m\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F"
}, {
  base: 'n',
  letters: "n\u24DD\uFF4E\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5"
}, {
  base: 'nj',
  letters: "\u01CC"
}, {
  base: 'o',
  letters: "o\u24DE\uFF4F\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\xF8\u01FF\u0254\uA74B\uA74D\u0275"
}, {
  base: 'oi',
  letters: "\u01A3"
}, {
  base: 'ou',
  letters: "\u0223"
}, {
  base: 'oo',
  letters: "\uA74F"
}, {
  base: 'p',
  letters: "p\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755"
}, {
  base: 'q',
  letters: "q\u24E0\uFF51\u024B\uA757\uA759"
}, {
  base: 'r',
  letters: "r\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783"
}, {
  base: 's',
  letters: "s\u24E2\uFF53\xDF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B"
}, {
  base: 't',
  letters: "t\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787"
}, {
  base: 'tz',
  letters: "\uA729"
}, {
  base: 'u',
  letters: "u\u24E4\uFF55\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289"
}, {
  base: 'v',
  letters: "v\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C"
}, {
  base: 'vy',
  letters: "\uA761"
}, {
  base: 'w',
  letters: "w\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73"
}, {
  base: 'x',
  letters: "x\u24E7\uFF58\u1E8B\u1E8D"
}, {
  base: 'y',
  letters: "y\u24E8\uFF59\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF"
}, {
  base: 'z',
  letters: "z\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763"
}];
var diacriticsMap = {};

for (var i = 0; i < defaultDiacriticsRemovalMap.length; i++) {
  var letters = defaultDiacriticsRemovalMap[i].letters;

  for (var j = 0; j < letters.length; j++) {
    diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap[i].base;
  }
}

function sendCommand(_x, _x2) {
  return _sendCommand.apply(this, arguments);
}

function _sendCommand() {
  _sendCommand = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e, command) {
    var isSilent, userAction, originalValue, finalValue, transcriptCommand;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            isSilent = Boolean(e.detail && e.detail.silent);
            userAction = e.detail && e.detail.userAction;
            originalValue = command || inputElem.value;
            finalValue = originalValue; // userAction is true if not specifically given

            if (typeof userAction !== 'boolean') {
              userAction = true;
            } // Change accented characters to plain ASCII.
            // The Hugo engine doesn't receive non-ASCII characters correctly.


            if (!useUnicode) {
              finalValue = finalValue.replace(/[^\u0000-\u007E]/g, function (a) {
                return diacriticsMap[a] || a;
              });
            }
            /*
            // pass the command to the engine
            Module.ccall(
                'haven_getline',
                'null',
                [ 'string' ],
                [ inputElem.value + '\n' ]
            );
            */
            // run input filters


            if (!(typeof inputFilter === 'function')) {
              _context.next = 18;
              break;
            }

            finalValue = inputFilter(finalValue, {
              silent: isSilent,
              userAction: userAction
            });

            if (!(_typeof(finalValue) === 'object' && typeof finalValue.then === 'function')) {
              _context.next = 18;
              break;
            }

            _context.prev = 9;
            _context.next = 12;
            return Promise.resolve(finalValue);

          case 12:
            finalValue = _context.sent;
            _context.next = 18;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](9);
            return _context.abrupt("return");

          case 18:
            if (!(finalValue === false)) {
              _context.next = 20;
              break;
            }

            return _context.abrupt("return");

          case 20:
            // the value shown in the transcript
            transcriptCommand = command || inputElem.value; // cleanup

            if (userAction) {
              inputElem.value = "";
            }

            hide(); // trigger submit hook

            if (!(typeof submitHook === 'function')) {
              _context.next = 26;
              break;
            }

            _context.next = 26;
            return submitHook({
              input: finalValue,
              original: originalValue,
              silent: isSilent,
              userAction: userAction
            });

          case 26:
            // save input to history
            if (originalValue !== cmdHistory[0] && /\S/.test(originalValue)) {
              history.add(originalValue);
            } // reset the current spot in the command history


            currentCmdIndex = cmdHistory.length; // Turn has ended, create a new container for the next turn.
            // Do this before appending the command to the transcript so that
            // the command and its response are in the same container.

            (0, _window.newTurnContainer)(0); // append the command to the transcript, unless the submit events tells us not to

            if (!enginePrompt && !isSilent) {
              appendPrompt(prefix.get(), transcriptCommand, 0);
            } // send the final command to the interpreter


            window.Glk.sendLine(finalValue);

          case 31:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[9, 15]]);
  }));
  return _sendCommand.apply(this, arguments);
}

var useUnicode = true;
/**
 * Initialize line input event handlers.
 */

function init(opt) {
  // find elements
  promptElem = document.getElementById('lineinput');
  prefixElem = document.getElementById('lineinput-prefix');
  inputElem = document.getElementById('lineinput-field');

  if (!promptElem) {
    promptElem = document.createElement('form');
    promptElem.id = 'lineinput';
    document.getElementById('output').appendChild(promptElem);
  }

  if (!prefixElem) {
    prefixElem = document.createElement('label');
    prefixElem.id = 'lineinput-prefix';
    prefixElem.setAttribute('for', 'lineinput-field');
    promptElem.appendChild(prefixElem);
  }

  if (!inputElem) {
    inputElem = document.createElement('input');
    inputElem.id = 'lineinput-field';
    inputElem.setAttribute('name', 'lineinput');
    inputElem.setAttribute('type', 'text');
    inputElem.setAttribute('autocapitalize', 'none');
    inputElem.setAttribute('autocomplete', 'off');
    promptElem.appendChild(inputElem);
  } // save references to hooks


  expectHook = opt.expectHook;
  submitHook = opt.submitHook; // save the reference to the input filter

  inputFilter = opt.inputFilter; // make a note if the engine handles printing the prompt or not

  enginePrompt = !!opt.enginePrompt;
  useUnicode = !!opt.unicode; // handle line input submission

  promptElem.addEventListener('submit', function (e) {
    e.preventDefault();
    sendCommand(e);
  }, false); // Command history. Adapted from Parchment.

  inputElem.addEventListener('keydown', function (e) {
    var keyCode = e.which || e.keyCode; // Check for up/down to use the command history

    if (keyCode === 38) // up -> prev
      {
        getCmdFromHistory(1);
        e.preventDefault();
      }

    if (keyCode === 40) // down -> next
      {
        getCmdFromHistory(-1);
        e.preventDefault();
      }
  }, false); // fix Mobile Safari bug that breaks fixed positioning when the virtual keyboard pops up

  if ('ontouchstart' in window) {
    // the focus event at the start of the game doesn't open the keyboard
    var firstFocus = true;
    inputElem.addEventListener('focus', function () {
      if (!firstFocus) {
        document.body.classList.add("safarifix");
      } else {
        firstFocus = false;
      }
    });
    inputElem.addEventListener('blur', function () {
      document.body.classList.remove("safarifix");
    });
  } // remove the prompt from the DOM


  promptElem.parentNode.removeChild(promptElem);
}

;
/**
 * Returns true if the command prompt is ready for line input.
 */

function isReady() {
  return (0, _input.getMode)() === 'getline';
}

;
var prefix = {
  /**
   * Get the current prompt prefix, or empty string if the engine is
   * handling printing the prompt.
   *
   * @returns {string}
   */
  get: function get() {
    if (enginePrompt) {
      return "";
    }

    return prefixElem.innerHTML;
  },

  /**
   * Set the prefix (>) that's shown before the command input.
   * The caret is expected to be "clean" i.e. it's safe to use innerHTML
   * to place it in the element.
   *
   * @param {string} prefix
   */
  set: function set(prefix) {
    if (!enginePrompt) {
      prefixElem.innerHTML = prefix;
    }
  }
};
/**
 * Either scroll the page down one page, or if the prompt is visible,
 * set focus to the prompt.
 *
 * @param e
 */

exports.prefix = prefix;

function scrollOrFocus(e) {
  var doc = document.documentElement;
  var scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

  var selection = window.getSelection || function () {
    return document.selection ? document.selection.createRange().text : '';
  };

  var promptHidden = !promptElem.parentNode;
  var playAreaHeight = window.innerHeight;

  if ((0, _window.get)(1)) {
    playAreaHeight = window.innerHeight - haven.window.get(1).getBoundingClientRect().height;
  } // let non-ASCII keycodes, navigation keys, keys pressed with ctrl/alt/cmd pass
  // so that they don't block browser shortcuts


  if (e && (e.keycode === 32 || e.keyCode > 127 || e.altKey || e.ctrlKey || e.metaKey)) {
    return;
  } // Only intercept on things that aren't inputs and if the user isn't selecting text
  // and if the prompt is available


  if (!e || !e.target || e.target.nodeName !== 'INPUT' && selection().toString() === '') {
    // If the input box is close to the viewport then focus it
    if (promptHidden || scrolltop + window.innerHeight > document.body.clientHeight - 60) {
      setTimeout(function () {
        return window.scrollTo(0, 9e9);
      }, 1);

      if (promptElem.parentNode) {
        // Manually reset the target in case focus/trigger don't - we don't want the trigger to recurse
        inputElem.focus(); // Stop propagating after re-triggering it, so that the trigger will work for all keys

        if (e && e.stopPropagation && document.activeElement !== inputElem) {
          e.stopPropagation();
        }
      }
    } else {
      // if there's no prompt, scroll down one pageful
      if (doScroll) {
        window.scrollTo(0, scrolltop + playAreaHeight - 40); // focus on the prompt if it's visible

        if (promptElem.parentNode && scrolltop + playAreaHeight + window.innerHeight - 40 >= document.body.clientHeight) {
          inputElem.focus();
        }

        if (e && e.preventDefault) {
          e.preventDefault();
        }
      } // otherwise just scroll the content into view
      else {
          scrollToContent();
        } // Intercept the backspace key


      if (e && e.type === 'keydown' && (e.which || e.keyCode) === 8) {
        return false;
      }
    }
  }

  isTextPrinted = false;
}

;
/**
 * Set the "doScroll" status which tells whether a keypress scrolls the page.
 */

function setDoScroll(status) {
  doScroll = status;
}
/**
 * Show the prompt and start expecting line input.
 */


function show() {
  (0, _input.setMode)('getline');
  (0, _buffer.flush)();
  (0, _window.get)(0).appendChild(promptElem); // scroll page down or give the prompt focus

  scrollOrFocus();
  doScroll = true; // do autosave when line input is expected

  _state.autosave.save();

  promptElem.dispatchEvent(lineinputReadyEvent);
}

;
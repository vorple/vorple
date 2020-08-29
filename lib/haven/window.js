"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.append = append;
exports.clear = clear;
exports.create = create;
exports.get = get;
exports.getUIState = getUIState;
exports.init = init;
exports.measureDimensions = measureDimensions;
exports.newTurnContainer = newTurnContainer;
exports.setTitle = setTitle;
exports.position = exports.container = void 0;

var _buffer = require("./buffer");

var _options = require("./options");

var _prompt = require("./prompt");

var _style = require("./style");

// DOM containers for windows
var outputWindows = []; // the parent of all windows

var currentContainers = [];
var windowDimensions = [];
var mainContainer = null;
var cursorPosition = [];
/**
 * Add lines to the output.
 *
 * @param amount Number of lines
 * @param column Number of spaces that are added to the last line
 * @param havenWindow
 */

function createLines(amount, column, havenWindow) {
  for (var i = 0; i < amount; ++i) {
    var newlineFiller = document.createElement('span');
    newlineFiller.className = 'font-fixed-width';
    newlineFiller.innerHTML = '\n';
    outputWindows[havenWindow].appendChild(newlineFiller);
  }

  if (column > 0) {
    var spaceFiller = document.createElement('span');
    spaceFiller.innerHTML = Array(column).join(" ");
    spaceFiller.className = 'font-fixed-width';
    outputWindows[havenWindow].appendChild(spaceFiller);
  }

  position.reset(havenWindow);
}
/**
 * Prints text to a specific spot in the text window.
 *
 * @param line
 * @param col
 * @param newContent
 * @param havenWindow
 */


function replacePart(line, col, newContent, havenWindow) {
  //        console.log( 'Replacing line', line, 'col', col, 'with', newContent.innerHTML, 'in window', havenWindow );
  var output = outputWindows[havenWindow];
  var nodes = textNodesUnder(output);
  var range = document.createRange();
  var currentLine = 1;
  var currentCol = 1;
  var startFound = false;
  var endCounter = 0; // check if the new content goes on top of existing content or does the
  // container "overflow" (i.e. new lines need to be created as a padding)

  var overflow = function () {
    for (var i = 0; i < nodes.length; ++i) {
      var textContent = nodes[i].textContent;

      if (currentLine === line) {
        for (var j = 0; j < textContent.length; ++j) {
          if (startFound) {
            endCounter++;

            if (endCounter === newContent.textContent.length || textContent[j] === '\n') {
              range.setEnd(nodes[i], j);
              return false;
            }
          } else if (currentCol === col) {
            range.setStart(nodes[i], j);
            startFound = true;

            if (j === textContent.length - 1) {
              range.setEnd(nodes[i], j);
              return false;
            }
          } else if (textContent[j] === '\n') {
            var filler = document.createTextNode(Array(col - currentCol + 1).join(' ') + '\n');
            nodes[i].textContent = textContent.substr(0, j) + ' ';
            nodes[i].parentNode.insertBefore(filler, nodes[i].nextSibling);
            range.setStart(filler, col - currentCol - 1);
            range.setEnd(filler, col - currentCol - 1);
            return false;
          }

          currentCol++;
        }
      } else {
        if (textContent.indexOf('\n') > -1) {
          currentLine++;
        }
      }
    }

    return true;
  }();

  if (overflow) {
    createLines(cursorPosition[havenWindow].line - currentLine, col, havenWindow);
    output.appendChild(newContent);
    return;
  }

  if (newContent.textContent.indexOf('\n') > -1) {
    newContent.textContent = newContent.textContent.replace('\n', '');
    cursorPosition[havenWindow].line++;
    cursorPosition[havenWindow].col = 1;
  } else {
    cursorPosition[havenWindow].col += newContent.textContent.length;
  }

  range.deleteContents();
  range.insertNode(newContent);

  if (!newContent.nextSibling) {
    cursorPosition[havenWindow].line = null;
    cursorPosition[havenWindow].col = null;
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
 * Append content to a window.
 *
 * @param content
 * @param targetWindow
 */


function append(content, targetWindow) {
  var textContainer = document.createElement('span');

  if (!cursorPosition[targetWindow]) {
    cursorPosition[targetWindow] = {
      col: null,
      line: null
    };
  }

  (0, _style.apply)(textContainer, targetWindow);
  textContainer.innerHTML = content;

  if (cursorPosition[targetWindow].col !== null && cursorPosition[targetWindow].line !== null) {
    replacePart(cursorPosition[targetWindow].line, cursorPosition[targetWindow].col, textContainer, targetWindow);
  } else {
    currentContainers[targetWindow].appendChild(textContainer);
  }
}

;
/**
 * Clears an output window.
 *
 * @param targetWindow
 */

function clear(targetWindow) {
  if (targetWindow === undefined) {
    (0, _buffer.flush)(0);
    mainContainer.innerHTML = "";
    mainContainer.appendChild(outputWindows[0]);
    (0, _style.apply)(outputWindows[0], 0);
    (0, _style.apply)(document.body, 0);
    position.reset();
  } else {
    if (!outputWindows[targetWindow]) {
      return;
    } // console.log( 'clear window', targetWindow );


    (0, _buffer.flush)(targetWindow);
    outputWindows[targetWindow].innerHTML = "";
    (0, _style.apply)(outputWindows[targetWindow], targetWindow); // when clearing the main window, set the entire page's style

    if (targetWindow === 0) {
      (0, _style.apply)(document.body, 0);
    }

    position.reset(targetWindow);
  } // don't scroll automatically right after clearing the main window


  if (targetWindow < 1) {// hugoui.doScroll = false;
  }
}

;
/**
 * Create a new window (Hugo only).
 *
 * @param outputWindow
 * @param left
 * @param top
 * @param right
 * @param bottom
 */

function create(outputWindow, left, top, right, bottom) {
  //        console.log( 'creating window', outputWindow + ':  left', left, 'top', top, 'right', right, 'bottom', bottom );
  var dimensions = measureDimensions();
  var charHeight = dimensions["char"].height;
  var mainContainer = get(0).parentNode;
  var newWindow;
  windowDimensions[outputWindow] = {
    left: left,
    top: top,
    right: right,
    bottom: bottom
  };

  if (!(0, _options.get)('windowing')) {
    return false;
  } // the main window only changes size


  if (outputWindow === 0) {
    //                outputWindow[0].style.paddingLeft = ( left - 1 ) + 'px';
    get(0).style.paddingTop = (top - 1) * dimensions["char"].height + 'px'; //                outputWindow[0].style.width = ( ( right + 1 ) * dimensions.char.width ) + 'px';

    return;
  }

  if (get(outputWindow)) {
    mainContainer.removeChild(get(outputWindow));
  }

  newWindow = document.createElement('div');
  newWindow.id = 'window' + outputWindow;
  newWindow.className = 'havenwindow font-fixed-width';
  newWindow.style.height = charHeight * (bottom - top + 1) + 'px';
  newWindow.style.top = (top - 1) * charHeight + 'px';
  newWindow.style.marginLeft = left - 1 + 'px';
  newWindow.style.width = (right - left + 2) * dimensions["char"].width + 'px';
  outputWindows[outputWindow] = newWindow;
  currentContainers[outputWindow] = newWindow;
  container.append(newWindow, mainContainer);
}

;
/**
 * Output containers inside the windows.
 */

var container = {
  append: function append(container, target) {
    if (typeof target === 'number') {
      outputWindows[target].appendChild(container);
    } else {
      target.appendChild(container);
    }
  },
  get: function get(targetWindow) {
    return currentContainers[targetWindow];
  },
  set: function set(newContainer, targetWindow) {
    currentContainers[targetWindow] = newContainer;
  }
};
/**
 * Returns the output window element.
 *
 * @param targetWindow
 * @returns {*}
 */

exports.container = container;

function get(targetWindow) {
  return outputWindows[targetWindow];
}
/**
 * Get all data required to later reconstruct the UI state.
 */


function getUIState() {
  var windowContents = [];
  var promptElem = (0, _prompt.get)();
  var promptParent = promptElem.parentNode; // put prompt away during the save

  if (promptParent) {
    promptParent.removeChild(promptElem);
  } // remove the >


  var lastChild = outputWindows[0].lastChild;
  outputWindows[0].removeChild(lastChild);

  for (var i = 0; i < outputWindows.length; ++i) {
    windowContents[i] = outputWindows[i].innerHTML;
  } // put back what was removed


  outputWindows[0].appendChild(lastChild);

  if (promptParent) {
    promptParent.appendChild(promptElem);
  } // this should be done better, but remove the last line break
  // because restoring adds one back again


  var lastLbr = windowContents[0].lastIndexOf('\n');
  windowContents[0] = windowContents[0].substring(0, lastLbr) + windowContents[0].substring(lastLbr + 1);
  return {
    cmdHistory: _prompt.history.get(),
    currentColors: _style.color.get(),
    font: _style.font.get(),
    position: cursorPosition,
    title: document.title,
    windowDimensions: windowDimensions,
    windowContents: windowContents
  };
}
/**
 * Save references to HTML elements.
 */


function init() {
  mainContainer = document.getElementById('output');
  outputWindows.push(document.getElementById('window0'));
  currentContainers.push(outputWindows[0]);
  newTurnContainer(0);
}
/**
 * When the window size changes, measure the window width in characters (Hugo only)
 */


function measureDimensions() {
  var outputContainer = get(0).parentNode;
  var dimensions = {
    window: {
      width: parseInt(window.getComputedStyle(outputContainer).width, 10),
      height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    },
    line: {},
    "char": {}
  };
  var measureElem = document.createElement('span');
  var outputDimensions = dimensions.window;
  var measureElemHeight;
  measureElem.innerHTML = '00000<br>00000<br>00000';
  measureElem.className = 'font-fixed-width';
  measureElem.style.display = 'inline-block';
  outputContainer.appendChild(measureElem);
  dimensions["char"].width = measureElem.offsetWidth / 5;
  dimensions.line.width = Math.floor((outputDimensions.width - 1) / dimensions["char"].width);
  measureElem.style.display = 'block';
  measureElemHeight = measureElem.clientHeight;
  measureElem.innerHTML += '<br>00000<br>00000';
  dimensions["char"].height = (measureElem.clientHeight - measureElemHeight) / 2 + 3;
  dimensions.line.height = Math.floor(outputDimensions.height / dimensions["char"].height);
  measureElem.parentNode.removeChild(measureElem);
  return dimensions;
}
/**
 * Creates a container for a single turn's content and appends it to the window
 * and sets the classes of previous containers to match the new situation.
 */


function newTurnContainer(targetWindow) {
  var parentWindow = outputWindows[targetWindow];
  var newTurn = document.createElement('div');
  newTurn.className = "turn current";
  parentWindow.appendChild(newTurn);
  container.set(newTurn, targetWindow);
  return newTurn;
}
/**
 * Set the cursor position inside the target window. Hugo only.
 */


var position = {
  reset: function reset(targetWindow) {
    // if no window specified, reset all positions
    if (targetWindow === undefined) {
      cursorPosition = [{
        col: null,
        line: null
      }];
    } else {
      position.set(null, null, targetWindow);
    }
  },
  restore: function restore(oldState) {
    cursorPosition = oldState;
  },
  set: function set(col, line, havenWindow) {
    if (!cursorPosition[havenWindow]) {
      cursorPosition[havenWindow] = {};
    }

    cursorPosition[havenWindow].col = col;
    cursorPosition[havenWindow].line = line;
  }
};
/**
 * Set the window title
 *
 * @param title
 */

exports.position = position;

function setTitle(title) {
  document.title = title;
}
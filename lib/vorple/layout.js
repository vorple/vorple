"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.block = block;
exports.closeTag = closeTag;
exports.focus = focus;
exports.openTag = openTag;
exports.scrollTo = scrollTo;
exports.scrollToEnd = scrollToEnd;
exports.unblock = unblock;

var _buffer = require("../haven/buffer");

var _window = require("../haven/window");

/**
 * @module layout
 */

/**
 * Blocks the UI so that the user can't type anything or click any elements.
 *
 * Use layout.unblock to remove the block.
 */
function block() {
  // prevent keypresses
  $(document).on('keydown.vorple.uiblock', function (e) {
    e.stopImmediatePropagation();
    return false;
  }); // add an invisible layer that catches clicks

  $('<div class="uiblock">').on('click.vorple.uiblock', function (e) {
    e.stopImmediatePropagation();
    return false;
  }).appendTo('body');
}
/**
 * Close a tag that is currently open.
 *
 * Because the tags are added as DOM elements, the tag isn't really "open"
 * in the sense that it would be missing the closing tag. Instead we jump
 * out of the tag and set output focus back to its parent element.
 *
 * @param {number} [targetWindow=0]
 * @returns {boolean} True if a tag was open, false if we were already
 *  at the top window level and nothing was done
 */


function closeTag() {
  var targetWindow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

  var current = _window.container.get(targetWindow);

  if (current.id === 'window0') {
    return false;
  }

  (0, _buffer.flush)(targetWindow);

  _window.container.set(current.parentNode, targetWindow);

  return true;
}
/**
 * Set output focus to an element.
 *
 * @param {string|object} targetElement
 * @param {number} [targetWindow=0]
 *
 * @returns {boolean} True if the focus was set successfully, false if the
 *   element wasn't found
 */


function focus(targetElement) {
  var targetWindow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var $target = $(targetElement);

  if ($target.length === 0) {
    return false;
  }

  (0, _buffer.flush)();

  _window.container.set($target.last().get(0), targetWindow);

  return true;
}
/**
 * Create a new HTML element, append it to the target window, and set the output
 * focus to the element.
 *
 * Example:
 *  layout.openTag( 'div', 'vorple', 0 )  -->  <div class="vorple"></div>
 *
 * @param {string} tagName  Name of the tag to create
 * @param {string} classes  Class names to add to the element
 * @param {number} [targetWindow=0]  The number of the target window
 *
 * @see layout.closeTag
 *
 * @returns {boolean} True
 */


function openTag(tagName, classes) {
  var targetWindow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var elem = document.createElement(tagName);

  var current = _window.container.get(targetWindow);

  elem.className = classes;
  (0, _buffer.flush)(targetWindow);

  _window.container.append(elem, current);

  _window.container.set(elem, targetWindow);

  return true;
}
/**
 * Scroll an element into view. Scrolling is initiated only if the element
 * isn't already fully in view or its top position is not in the top
 * half of the page.
 *
 * If the element doesn't exist, the function doesn't do anything.
 *
 * @param {string|object} target  The target element
 * @param {number} [speed=500]  The duration of the scroll animation in milliseconds 
 *
 * @returns {promise} A promise that resolves to true when the scroll animation
 *   ends, or resolves to false if no scrolling was needed (element doesn't
 *   exist or is already in view.)
 */


function scrollTo(target) {
  var speed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
  var $target = $(target); // if the element doesn't exist, do nothing

  if ($target.length === 0) {
    return Promise.resolve(false);
  }

  var pagePosition = $('body').scrollTop();
  var targetPosition = $target.offset().top;
  var targetHeight = $target.height();
  var windowHeight = $(window).height();
  var pageBottom = $(document).height() - windowHeight;
  var halfway = windowHeight / 2 + pagePosition;
  var offset = 30; // don't scroll if the element is in the top half of the page
  // and it fits into the page completely

  if (targetPosition >= pagePosition + offset && targetPosition <= halfway && targetPosition + targetHeight <= pagePosition + windowHeight) {
    return Promise.resolve(false);
  }

  return $('html, body').stop().animate({
    scrollTop: Math.min(Math.max(targetPosition - offset, 0), pageBottom)
  }, speed).promise().then(function () {
    return true;
  });
}
/**
 * Scroll to the end of the document.
 * 
 * @param {number} [speed=500]  The duration of the scroll animation in milliseconds
 * @returns {promise} A promise that resolves when the scroll animation ends
 */


function scrollToEnd() {
  var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 500;
  return $('html, body').stop().animate({
    scrollTop: $(document).height() - $(window).height()
  }, speed).promise();
}
/**
 * Unblock the UI.
 *
 * @see layout.block
 */


function unblock() {
  $('.uiblock').remove();
  $(document).off('keydown.vorple.uiblock');
}
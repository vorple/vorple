/**
 * @module layout
 */
import { flush } from "../haven/buffer";
import { 
    block as inputBlock,
    isBlocked as isInputBlocked,
    unblock as inputUnblock
} from "../haven/input";
import { container } from "../haven/window";


/**
 * Blocks the UI so that the user can't type anything or click any elements.
 * Note that this only applies to built-in input and features, for custom
 * features use vorple.layout.isBlocked() to check whether input should be
 * accepted.
 *
 * Use vorple.layout.unblock() to remove the block.
 */
export function block() {
    $( '.vorple-link' ).addClass( 'disabled' );
    inputBlock();
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
export function closeTag( targetWindow = 0 ) {
    const current = container.get( targetWindow );

    if( current.id === 'window0' ) {
        return false;
    }

    flush( targetWindow );
    container.set( current.parentNode, targetWindow );

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
export function focus( targetElement, targetWindow = 0 ) {
    const $target = $( targetElement );

    if( $target.length === 0 ) {
        return false;
    }

    flush();
    container.set( $target.last().get( 0 ), targetWindow );

    return true;
}


/**
 * Returns whether user input is blocked.
 * 
 * @returns {boolean} True if input is blocked
 * 
 * @since 3.2.6
 */
export function isBlocked() {
    return isInputBlocked();
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
export function openTag( tagName, classes, targetWindow = 0 ) {
    const elem = document.createElement( tagName );
    const current = container.get( targetWindow );

    elem.className = classes;

    flush( targetWindow );
    container.append( elem, current );
    container.set( elem, targetWindow );

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
export function scrollTo( target, speed = 500 ) {
    const $target = $( target );

    // if the element doesn't exist, do nothing
    if( $target.length === 0 ) {
        return Promise.resolve( false );
    }

    const pagePosition = $( 'body' ).scrollTop();
    const targetPosition = $target.offset().top;
    const targetHeight = $target.height();
    const windowHeight = $( window ).height();
    const pageBottom = $( document ).height() - windowHeight;
    const halfway = windowHeight / 2 + pagePosition;
    const offset = 30;

    // don't scroll if the element is in the top half of the page
    // and it fits into the page completely
    if( targetPosition >= pagePosition + offset && targetPosition <= halfway &&
        targetPosition + targetHeight <= pagePosition + windowHeight ) {
        return Promise.resolve( false );
    }

    return $( 'html, body' ).stop().animate( {
        scrollTop: Math.min( Math.max( targetPosition - offset, 0 ), pageBottom )
    }, speed ).promise().then( () => true );
}


/**
 * Scroll to the end of the document.
 * 
 * @param {number} [speed=500]  The duration of the scroll animation in milliseconds
 * @returns {promise} A promise that resolves when the scroll animation ends
 */
export function scrollToEnd( speed = 500 ) {
    return $( 'html, body' ).stop().animate( {
        scrollTop: $( document ).height() - $( window ).height()
    }, speed ).promise();
}


/**
 * Unblock the UI.
 *
 * @see layout.block
 */
export function unblock() {
    $( '.vorple-link' ).removeClass( 'disabled' );
    inputUnblock();
}
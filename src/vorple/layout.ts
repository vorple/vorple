/**
 * @module layout
 */
import { flush } from "../haven/buffer";
import {
    block as inputBlock,
    isBlocked as isInputBlocked,
    unblock as inputUnblock
} from "../haven/input";
import {
    container,
    newTurnContainer,
    rotateTurnMarkers
} from "../haven/window";


/**
 * Blocks the UI so that the user can't type anything or click any elements.
 * Note that this only applies to built-in input and features, for custom
 * features use [[isBlocked]] to check whether input should be accepted.
 *
 * Use [[unblock]] to remove the block.
 */
export function block(): void {
    $( ".vorple-link" ).addClass( "disabled" );
    inputBlock();
}


/**
 * Close a tag that is currently open.
 *
 * Because the tags are added as DOM elements, the tag isn't really "open"
 * in the sense that it would be missing the closing tag. Instead we jump
 * out of the tag and set output focus back to its parent element.
 *
 * @see [[openTag]]
 *
 * @param targetWindow  The target window in the Haven engine. This is practically always 0.
 * @returns Returns true if a tag was open, false if we were already at the top window level and nothing was done.
 */
export function closeTag( targetWindow = 0 ): boolean {
    const current = container.get( targetWindow );

    if( current.id === "window0" ) {
        return false;
    }

    flush( targetWindow );
    container.set( current.parentNode, targetWindow );

    return true;
}


/**
 * Creates a new empty turn container. This is useful for splitting output to
 * "turns" outside Inform.
 *
 * @since 4.1.0
 */
export function createNewTurnContainer(): void {
    rotateTurnMarkers();
    newTurnContainer( 0 );
}


/**
 * Set output focus to an element.
 *
 * @param targetElement  A jQuery object or selector
 * @param targetWindow  The target window in the Haven engine. This is practically always 0.
 *
 * @returns Returns true if the focus was set successfully, false if the element wasn't found.
 */
export function focus( targetElement: string | JQuery.PlainObject, targetWindow = 0 ): boolean {
    const $target: JQuery = $( targetElement );

    if( $target.length === 0 ) {
        return false;
    }

    flush( targetWindow );
    container.set( $target.last().get( 0 ), targetWindow );

    return true;
}


/**
 * Checks whether user input is blocked.
 *
 * @returns Returns true if input is blocked, otherwise false.
 * @since 3.2.6
 */
export function isBlocked(): boolean {
    return isInputBlocked();
}


/**
 * Create a new HTML element, append it to the target window, and set the output
 * focus to the element.
 *
 * Example:
 * ```
 * vorple.layout.openTag( 'div', 'vorple' )  -->  <div class="vorple"></div>
 * ```
 *
 * @param tagName  Name of the tag to create
 * @param classes  Class names to add to the element
 * @param targetWindow  The target window in the Haven engine. This is practically always 0.
 *
 * @see [[closeTag]]
 *
 * @returns Returns true.
 */
export function openTag( tagName: string, classes: string, targetWindow = 0 ): true {
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
 * @param target  The target element
 * @param speed  The duration of the scroll animation in milliseconds
 *
 * @returns Returns a promise that resolves to true when the scroll animation
 *   ends, or resolves to false if no scrolling was needed (element doesn't
 *   exist or is already in view.)
 */
export function scrollTo( target: string | JQuery.PlainObject, speed = 500 ): Promise<boolean> {
    const $target = $( target );

    // if the element doesn't exist, do nothing
    if( $target.length === 0 ) {
        return Promise.resolve( false );
    }

    const pagePosition = $( "html" ).scrollTop() || $( "body" ).scrollTop() || 0;
    const targetPosition = $target.offset()?.top || 0;
    const targetHeight = $target.height() || 0;
    const windowHeight = $( window ).height() || 0;
    const documentHeight = $( document )?.height() || 0;
    const pageBottom = documentHeight - windowHeight ;
    const halfway = windowHeight / 2 + pagePosition;
    const offset = 30;

    // don't scroll if the element is in the top half of the page
    // and it fits into the page completely
    if( targetPosition >= pagePosition + offset && targetPosition <= halfway &&
        targetPosition + targetHeight <= pagePosition + windowHeight ) {
        return Promise.resolve( false );
    }

    return new Promise( ( resolve ) => $( "html, body" ).stop().animate({
        scrollTop: Math.min( Math.max( targetPosition - offset, 0 ), pageBottom )
    }, speed ).promise().then( () => resolve( true ) ) );
}


/**
 * Scroll to the end of the document.
 *
 * @param speed  The duration of the scroll animation in milliseconds
 * @returns Returns a promise that resolves when the scroll animation ends.
 */
export function scrollToEnd( speed = 500 ): Promise<void> {
    const documentHeight = $( document ).height() || 0;
    const windowHeight = $( window ).height() || 0;
    return ( async(): Promise<void> => {
        await $( "html, body" ).stop().animate({
            scrollTop: documentHeight - windowHeight
        }, speed ).promise();
    })();
}


/**
 * Unblock the UI.
 *
 * @see [[block]]
 */
export function unblock(): void {
    $( ".vorple-link" ).removeClass( "disabled" );
    inputUnblock();
}

(function() {
    "use strict";

    var layout = {};


    /**
     * Blocks the UI so that the user can't type anything or click any elements.
     *
     * Use layout.unblock to remove the block.
     */
    layout.block = function() {
        // prevent keypresses
        $( document ).on( 'keydown.vorple.uiblock', function( e ) {
            e.stopImmediatePropagation();
            return false;
        });

        // add an invisible layer that catches clicks
        $( '<div class="uiblock">' ).on( 'click.vorple.uiblock', function( e ) {
                e.stopImmediatePropagation();
                return false;
            }).appendTo( 'body' );
    };


    /**
     * Close a tag that is currently open.
     *
     * Because the tags are added as DOM elements, the tag isn't really "open"
     * in the sense that it would be missing the closing tag. Instead we jump
     * out of the tag and set output focus back to its parent element.
     *
     * @param targetWindow {number=0}
     * @returns {boolean} True if a tag was open, false if we were already
     *  at the top window level and nothing was done
     */
    layout.closeTag = function( targetWindow ) {
        var current = haven.window.container.get( targetWindow || 0 );

        if( current.id === 'window0' ) {
            return false;
        }

        haven.buffer.flush( targetWindow || 0 );
        haven.window.container.set( current.parentNode, targetWindow || 0 );
        return true;
    };


    /**
     * Set output focus to an element.
     *
     * @param targetElement
     * @param targetWindow
     *
     * @returns {boolean} True if the focus was set successfully, false if the
     *   element wasn't found
     */
    layout.focus = function( targetElement, targetWindow ) {
        var $target = $( targetElement );

        if( $target.length === 0 ) {
            return false;
        }

        haven.buffer.flush();
        haven.window.container.set( $target.last().get(0), targetWindow || 0 );

        return true;
    };


    /**
     * Create a new tag, append it to the target window, and set the output
     * focus to the element.
     *
     * Example:
     *  layout.openTag( 'div', 'vorple', 0 )  -->  <div class="vorple"></div>
     *
     * @param tagName {string} Name of the tag to create
     * @param classes {string} Class names to add to the element
     * @param targetWindow {number=0} The number of the target window
     *
     * @see layout.closeTag
     */
    layout.openTag = function( tagName, classes, targetWindow ) {
        var elem = document.createElement( tagName ),
            current = haven.window.container.get( targetWindow || 0 );

        elem.className = classes;

        haven.buffer.flush( targetWindow || 0 );
        haven.window.container.append( elem, current );
        haven.window.container.set( elem, targetWindow || 0 );
    };


    /**
     * Scroll an element into view. Scrolling is initiated only if the element
     * isn't already fully in view or its top position is not in the top
     * half of the page.
     *
     * If the element doesn't exist, the function doesn't do anything.
     *
     * @return {boolean} True if scrolling was needed, false otherwise
     */
    layout.scrollTo = function( target ) {
        var $target = $( target );

        // if the element doesn't exist, do nothing
        if( $target.length === 0 ) {
            return false;
        }

        var pagePosition = $( 'body' ).scrollTop(),
            targetPosition = $target.offset().top,
            targetHeight = $target.height(),
            windowHeight = $( window ).height(),
            pageBottom = $( document ).height() - windowHeight,
            halfway = windowHeight / 2 + pagePosition,
            offset = 30;

        // don't scroll if the element is in the top half of the page
        // and it fits into the page completely
        if( targetPosition >= pagePosition + offset && targetPosition <= halfway &&
            targetPosition + targetHeight <= pagePosition + windowHeight ) {
            return false;
        }

        $( 'html, body' ).stop().animate({
            scrollTop: Math.min( Math.max( targetPosition - offset, 0 ), pageBottom )
        }, 500 );

        return true;
    };


    /**
     * Scroll to the end of the document.
     */
    layout.scrollToEnd = function() {
        $( 'html, body' ).stop().animate({
            scrollTop: $( document ).height() - $( window ).height()
        }, 500 );
    };


    /**
     * Unblock the UI.
     *
     * @see layout.block
     */
    layout.unblock = function() {
        $( '.uiblock' ).remove();
        $( document ).off( 'keydown.vorple.uiblock' );
    };

    vorple.layout = layout;
})();
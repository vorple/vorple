(function( vorple ) {
    "use strict";

    var debug = {};

    var DEBUGGING = false;


    /**
     *
     * @returns {boolean} true if a debugging message was printed, otherwise false
     */
    debug.log = function( text ) {
        if( !DEBUGGING ) {
            return false;
        }

        console.log( text );
        haven.buffer.append( '[' + text + ']\n', 0 );

        return true;
    };


    /**
     * Set the debugging status off.
     *
     * @returns {boolean} the new status (false)
     */
    debug.off = function() {
        DEBUGGING = false;

        return true;
    };


    /**
     * Set the debugging status on.
     *
     * @returns {boolean} the new status (true)
     */
    debug.on = function() {
        DEBUGGING = true;

        return true;
    };


    /**
     * Returns the current state of the debugging flag.
     *
     * @returns {boolean}
     */
    debug.status = function() {
        return DEBUGGING;
    };


    /**
     * Set or unset the the debugging flag.
     *
     * @returns {boolean} The new status of the debugging flag.
     */
    debug.toggle = function() {
        DEBUGGING = !DEBUGGING;

        return DEBUGGING;
    };

    vorple.debug = debug;
})( window.vorple );
/**
 * @module debug
 */
import havenError from "../haven/error";
import { append } from "../haven/buffer";

/**
 * @private
 * @type {boolean}
 */
let debugState = false;


/**
 * Show an error in the console and on the screen.
 *
 * @param {string} text  Error message
 * @return {boolean} Always returns true, for consistency with log()
 */
export function error( text ) {
    console.error( text );
    havenError( text );

    return true;
}


/**
 * Print a logging message to console and on the screen if debugging mode is on.
 *
 * @param {string} text  Text to log
 * @returns {boolean} True if a debugging message was printed, false otherwise
 */
export function log( text ) {
    if( !debugState ) {
        return false;
    }

    console.log( text );
    append( '[' + text + ']\n', 0 );

    return true;
}


/**
 * Set the debugging status off.
 *
 * @returns {boolean} the new status (always false)
 */
export function off() {
    debugState = false;

    return status();
}


/**
 * Set the debugging status on.
 *
 * @returns {boolean} the new status (always true)
 */
export function on() {
    debugState = true;

    return status();
}


/**
 * Returns the current state of the debugging flag.
 *
 * @returns {boolean}
 */
export function status() {
    return debugState;
}


/**
 * Set or unset the the debugging flag.
 *
 * @returns {boolean} The new status of the debugging flag.
 */
export function toggle() {
    debugState = !debugState;

    return status();
}
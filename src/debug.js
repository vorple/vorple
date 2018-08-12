import havenError from "../haven/error";
import { append } from "../haven/buffer";

let debugState = false;


/**
 * Show an error in the console and on the screen.
 *
 * @param text Error message
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
 * @returns {boolean} true if a debugging message was printed, otherwise false
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
 * @returns {boolean} the new status (false)
 */
export function off() {
    debugState = false;

    return status();
}


/**
 * Set the debugging status on.
 *
 * @returns {boolean} the new status (true)
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
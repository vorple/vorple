/**
 * @module debug
 */
import havenError from "../haven/error";
import { append } from "../haven/buffer";

let debugState = false;


/**
 * Show an error in the console and on the screen.
 *
 * @param text  The error message
 * @returns Always returns true, for consistency with {@link log}.
 */
export function error( text: string ): true {
    console.error( text );
    havenError( text );

    return true;
}


/**
 * Print a logging message to console and on the screen if debugging mode is on.
 *
 * @param text  Text to log
 * @returns Returns true if a debugging message was printed, false otherwise.
 */
export function log( text: string ): boolean {
    if( !debugState ) {
        return false;
    }

    console.log( text );
    append( "[" + text + "]\n", 0 );

    return true;
}


/**
 * Set the debugging status off.
 *
 * @returns Returns the new status (always false).
 */
export function off(): false {
    debugState = false;

    return false;
}


/**
 * Set the debugging status on.
 *
 * @returns Returns the new status (always true).
 */
export function on(): true {
    debugState = true;

    return true;
}


/**
 * @returns Returns the current state of the debugging flag.
 */
export function status(): boolean {
    return debugState;
}


/**
 * Set or unset the the debugging flag.
 *
 * @param newState  If a boolean is passed as an argument, the debugging flag is set to that value.
 * Otherwise the flag's previous value is flipped (true to false, false to true.)
 *
 * @returns Returns the new status of the debugging flag.
 */
export function toggle( newState?: boolean ): boolean {
    debugState = typeof newState === "boolean" ? newState : !debugState;

    return status();
}

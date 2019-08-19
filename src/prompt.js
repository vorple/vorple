/**
 * @module prompt
 */

import { 
    getMode,
    keypress
} from "../haven/input";
import {
    get as getHavenPrompt,
    isReady,
    prefix as havenPrefix,
    resizeInput,
    sendCommand
} from "../haven/prompt";
import { addEventListener } from "./vorple";
import { error } from "./debug";
import { block, unblock } from "./layout";

const inputFilters = [];
const commandQueue = [];
const keyQueue = [];

export function clearCommandQueue() {
    commandQueue.length = 0;
}

export function clearKeyQueue() {
    keyQueue.length = 0;
}

/**
 * If there is a command waiting in the queue, submit it to the parser.
 * The command is then removed from the queue.
 */
function runCommandQueue() {
    if( commandQueue.length > 0 ) {
        const command = commandQueue.shift();

        setValue( command.cmd );
        submit( command.silent );
        return false;
    }
}


/**
 * If there is a keypress waiting in the queue, send it to the parser.
 * The key is then removed from the queue.
 */
function runKeyQueue() {
    if( keyQueue.length > 0 ) {
        const key = keyQueue.shift();
        keypress.send({ keyCode: key.charCodeAt(0), force: true });
        return false;
    }

    return true;
}


/**
 * Registers a new input filter.
 * 
 * @param {function} filter 
 * @returns {function} A function that can be called to remove the filter
 */
export function addInputFilter( filter ) {
    inputFilters.push( filter );
    return () => removeInputFilter( filter );
}


/**
 * Runs input through all input filters.
 * 
 * @param {string} originalInput 
 * @private
 */
export async function applyInputFilters( originalInput, meta ) {
    let finalInput = originalInput;

    // block the UI while filters run, to prevent the player from typing before the previous command has resolved
    block();

    for( let i = 0; i < inputFilters.length; ++i ) {
        let filtered = inputFilters[ i ]( finalInput, {
            ...meta,
            input: finalInput,
            original: originalInput,
            type: "line"
        });

        // resolve the value if the return value was a promise,
        // this leaves other values untouched
        try {
            filtered = await Promise.resolve( filtered );
        }
        catch( e ) {
            throw e;
        }
        finally {
            unblock();
        }

        switch( filtered ) {
            case undefined:
            case null:
            case true:
                // do nothing
                break;

            case false:
                // event cancelled!
                return false;

            default:
                const type = typeof filtered;

                if( type === "object" && filtered.then ) {
                    error( "Input filter promise resolved into another promise, which is not allowed" );
                }

                if( type === "string" ) {
                    finalInput = filtered;
                }
                else {
                    error( "Input filter returned a value of type " + type );
                }
                break;
        }
    }

    unblock();
    
    return finalInput;
}


/**
 * Manually hide the prompt. It won't be shown until unhide() is called.
 */
export function hide() {
    $( getHavenPrompt() ).addClass( 'force-hidden' );
}


/**
 * Hook into Haven's input listeners
 */
export function init() {
    // Hook into the lineinput's ready event for passing commands from the queue.
    addEventListener( 'expectCommand', runCommandQueue );

    // Run the key queue when the engine expects a keypress
    addEventListener( "expectKeypress", runKeyQueue );
}


/**
 * Add a command to the command queue. If the line input is ready, execute
 * the command immediately.
 *
 * @param {string} cmd
 * @param {boolean} [silent=false]  If true, the command isn't shown on the
 *      screen. The result of the command will still print normally.
 */
export function queueCommand( cmd, silent = false ) {
    commandQueue.push( {
        cmd: cmd,
        silent: !!silent
    } );

    if( isReady() ) {
        runCommandQueue();
    }
}


/**
 * Add a keypress to the command queue. If the engine is waiting for a keypress,
 * send it immediately.
 *
 * @param {string} key A one-character string containing the pressed character
 */
export function queueKeypress( key ) {
    keyQueue.push( key );

    if( getMode() === 'getkey' ) {
        runKeyQueue();
    }
}


/**
 * Removes a filter from the registered input filters.
 * 
 * @param {function} filter The filter to remove
 */
export function removeInputFilter( filter ) {
    const index = inputFilters.indexOf( filter );

    if( index === -1 ) {
        return false;
    }

    inputFilters.splice( index, 1 );
    return true;
}


/**
 * Set the prefix of the command prompt. The prefix is usually a greater-than
 * character (>) at the start of the command prompt.
 *
 * The currently active command prompt is changed, and the new prefix is used
 * for all future command prompts until changed again.
 *
 * @param prefix
 * @param {boolean} [html=false]  If true, the prefix is inserted into the DOM
 *   as HTML. Otherwise HTML is escaped and shown as-is.
 *
 *  @returns {string} The new prefix.
 */
export function setPrefix( prefix, html = false ) {
    let newPrefix = prefix;

    if( !html ) {
        newPrefix = $( '<div>' ).text( prefix ).html();
    }

    havenPrefix.set( newPrefix );

    return newPrefix;
}


/**
 * Set the lineinput's value.
 *
 * @param value
 */
export function setValue( value ) {
    $( getHavenPrompt() ).find( '#lineinput-field' ).val( value );
}


/**
 * Trigger the submit event of the lineinput.
 *
 * @param {boolean} [silent=false]  If true, the command isn't shown on the
 *      screen. The result of the command will still print normally.
 */
export function submit( silent = false ) {
    sendCommand( new CustomEvent( 'submit', { 
        detail: { 
            silent: !!silent,
            userAction: false
        }
    } ) );
}


/**
 * Remove manual hiding of the prompt. It's called rather clumsily "unhide"
 * instead of "show" to stress that it only undoes what the hide() method did,
 * and it doesn't force the prompt to appear if it has been hidden or removed
 * by some other means.
 */
export function unhide() {
    $( getHavenPrompt() ).removeClass( 'force-hidden' );

    // trigger input field resize so that it fits on the line
    resizeInput();
}
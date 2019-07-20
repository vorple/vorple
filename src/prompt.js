/**
 * @module prompt
 */

import {
    get as getHavenPrompt,
    prefix as havenPrefix,
    resizeInput
} from "../haven/prompt";

const commandQueue = [];


/**
 * If there is a command waiting in the queue, submit it to the parser.
 * The command is then removed from the queue.
 */
function runCommandQueue() {
    if( commandQueue.length > 0 ) {
        const command = commandQueue.shift();

        setValue( command.cmd );
        submit( command.silent );
    }
}


/**
 * Manually hide the prompt. It won't be shown until unhide() is called.
 */
export function hide() {
    $( getHavenPrompt() ).addClass( 'force-hidden' );
}


/**
 * Hook into the lineinput's ready event for passing commands from the queue.
 */
export function init() {
    getHavenPrompt().addEventListener( 'lineinputReady', runCommandQueue );
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

    if( haven.prompt.isReady() ) {
        runCommandQueue();
    }
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
 *  @return {string} The new prefix.
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
    getHavenPrompt().dispatchEvent( new CustomEvent( 'submit', { detail: { silent: !!silent } } ) );
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
/**
 * @module prompt
 */

import $ from "jquery";
import {
    getMode,
    keypress
} from "../haven/input";
import {
    get as getHavenPrompt,
    isReady,
    prefix as havenPrefix,
    sendCommand
} from "../haven/prompt";
import { addEventListener } from "./vorple";
import { error } from "./debug";
import { block, unblock } from "./layout";

interface ParserCommand {
    cmd: string;
    silent: boolean;
}

export interface InputFilterMeta {
    input: string;
    original: string;
    type: "line" | "char";
    userAction: boolean;
    silent: boolean;
}

export type InputFilter = ( input: string, meta: InputFilterMeta ) => boolean;


const inputFilters: InputFilter[] = [];
const commandQueue: ParserCommand[] = [];
const keyQueue: string[] = [];


/**
 * If there is a command waiting in the queue, submit it to the parser.
 * The command is then removed from the queue.
 *
 * @internal
 */
function runCommandQueue(): boolean {
    if( commandQueue.length > 0 ) {
        const command = commandQueue.shift() as ParserCommand;

        submit( command.cmd, command.silent );
        return false;
    }

    return true;
}


/**
 * If there is a keypress waiting in the queue, send it to the parser.
 * The key is then removed from the queue.
 *
 * @since 3.2.0
 * @internal
 */
function runKeyQueue(): boolean {
    if( keyQueue.length > 0 ) {
        const key = keyQueue.shift() as string;
        keypress.send({ keyCode: key.charCodeAt( 0 ), force: true });
        return false;
    }

    return true;
}


/**
 * Registers a new input filter.
 *
 * @see https://vorple-if.com/docs/filters.html#input-filters
 * @since 3.2.0
 *
 * @param filter  The input filter to register
 * @returns Returns a function that can be called to remove the filter.
 */
export function addInputFilter( filter: InputFilter ): () => void {
    inputFilters.push( filter );
    return () => removeInputFilter( filter );
}


/**
 * Runs input through all input filters.
 *
 * @since 3.2.0
 * @internal
 * @param originalInput  The original input
 * @param meta  Associated input meta
 */
export async function applyInputFilters( originalInput: string, meta: InputFilterMeta ): Promise<string | false> {
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
            {
                const type = typeof filtered;

                if( type === "object" && "then" in filtered ) {
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
    }

    unblock();

    return finalInput;
}


/**
 * Clear the command queue.
 *
 * @since 3.2.0
 */
export function clearCommandQueue(): void {
    commandQueue.length = 0;
}


/**
 * Clear the keypress queue.
 *
 * @since 3.2.0
 */
export function clearKeyQueue(): void {
    keyQueue.length = 0;
}


/**
 * Manually hide the prompt. It won't be shown until unhide() is called.
 */
export function hide(): void {
    $( getHavenPrompt() ).addClass( "force-hidden" );
}


/**
 * Haven's history API.
 */
export { history } from "../haven/prompt";


/**
 * Hook into Haven's input listeners.
 */
export function init(): void {
    // Hook into the lineinput's ready event for passing commands from the queue.
    addEventListener( "expectCommand", runCommandQueue );

    // Run the key queue when the engine expects a keypress
    addEventListener( "expectKeypress", runKeyQueue );
}


/**
 * Add a command to the command queue. If the line input is ready, execute
 * the command immediately.
 *
 * @param cmd  Command to add
 * @param silent  If true, the command isn't shown on the screen.
 *      The result of the command will still print normally.
 */
export function queueCommand( cmd: string, silent = false ): void {
    commandQueue.push({
        cmd: cmd,
        silent: !!silent
    });

    if( isReady() ) {
        runCommandQueue();
    }
}


/**
 * Add a keypress to the command queue. If the engine is waiting for a keypress,
 * send it immediately.
 *
 * @param key A one-character string containing the pressed character
 * @since 3.2.0
 */
export function queueKeypress( key: string ): void {
    keyQueue.push( key );

    if( getMode() === "getkey" ) {
        runKeyQueue();
    }
}


/**
 * Removes a filter from registered input filters.
 *
 * @param filter  The filter to remove
 * @returns Returns true if the filter was removed, false if the filter wasn't registered.
 * @since 3.2.0
 */
export function removeInputFilter( filter: InputFilter ): boolean {
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
 * Note that calling this function directly with JavaScript changes the prompt
 * in the interpreter, but doesn't pass the information to the story file.
 * Therefore checking what the prefix is in the Inform story might not return
 * correct values because the variable that the story uses to track the prefix
 * content hasn't been changed. In most cases it's recommended to use the Vorple
 * extensions/libraries in Inform to change the prefix.
 *
 * @param prefix  The new prefix
 * @param isHtml  If true, the prefix is inserted into the DOM as HTML.
 *      Otherwise HTML is escaped and shown as-is.
 *
 *  @returns Returns the new prefix.
 */
export function setPrefix( prefix: string, isHtml = false ): string {
    let newPrefix = prefix;

    if( !isHtml ) {
        newPrefix = $( "<div>" ).text( prefix ).html();
    }

    havenPrefix.set( newPrefix );

    return newPrefix;
}


/**
 * Set the lineinput's value.
 *
 * @param value  The new value
 */
export function setValue( value: string ): void {
    $( getHavenPrompt() ).find( "#lineinput-field" ).val( value );
}


/**
 * Trigger the submit event of the lineinput.
 *
 * @param command  The command to send, if null or left out the lineinput field's current value is used.
 * @param silent  If true, the command isn't shown on the screen.
 *      The result of the command will still print normally.
 */
export function submit( command?: string | null, silent = false ): void {
    sendCommand( new CustomEvent( "submit", {
        detail: {
            silent: !!silent,
            userAction: false
        }
    }), command );
}


/**
 * Remove manual hiding of the prompt. It's called rather clumsily "unhide"
 * instead of "show" to stress that it only undoes what the [[hide]] method did,
 * and it doesn't force the prompt to appear if it has been hidden or removed
 * by some other means.
 */
export function unhide(): void {
    $( getHavenPrompt() ).removeClass( "force-hidden" );
}

/**
 * @module vorple
 */
import satisfies from "semver/functions/satisfies";

import { start } from "../haven/haven";
import { addCallback } from "../haven/assets";

import { error, log } from "./debug";
import { init as initPrompt, applyInputFilters } from "./prompt";
import { loadStoryFile, initQuixe } from "./haven";

import packageJson from "../../package.json";
import {
    JS_RETURN_VALUE_FILENAME,
    JS_RETURN_VALUE_TYPE_FILENAME,
    VORPLE_PATH,
    init as initFilesystem,
    write
} from "./file";
import { applyOutputFilters } from "./output";

let informVersion: 6 | 7;

export interface VorpleOptions {
    container?: string | JQuery;
}

export type VorpleEventCategory =
    "init" |
    "expectCommand" |
    "submitCommand" |
    "expectKeypress" |
    "submitKeypress" |
    "quit";

export interface VorpleEventMetadata {
    type: VorpleEventCategory;

    event?: KeyboardEvent | MouseEvent;
    input?: string | number;
    mouseClick?: boolean;
    original?: string | number;
    silent?: boolean;
    userAction?: boolean;
}

export type VorpleEventListener = ( meta: VorpleEventMetadata ) => Promise<unknown> | unknown;

/**
 * Containers for the custom event listeners.
 */
const eventListeners: { [ key in VorpleEventCategory ]: VorpleEventListener[] } = {
    init: [],
    expectCommand: [],
    submitCommand: [],
    expectKeypress: [],
    submitKeypress: [],
    quit: []
};


/**
 * Adds or removes one listener from one event.
 *
 * @returns {boolean} False if trying to remove a listener that hasn't been registered, true otherwise
 * @since 3.2.0
 * @internal
 */
function addOrRemoveListener( eventName: VorpleEventCategory, listener: VorpleEventListener, action: "add" | "remove" ): boolean {
    if( !eventName || typeof eventName === "function" ) {
        return error( `Event name missing when trying to ${action} an event listener` );
    }

    if( !eventListeners[ eventName ] ) {
        return error( `Tried to ${action} a listener to an unknown event ${eventName}` );
    }

    if( typeof listener !== "function" ) {
        return error( `Missing callback function when trying to ${action} listener for event ${eventName}` );
    }

    if( action === "add" ) {
        eventListeners[ eventName ].push( listener );
        return true;
    }
    else {
        const index = eventListeners[ eventName ].indexOf( listener );

        if( index === -1 ) {
            return false;
        }

        eventListeners[ eventName ].splice( index, 1 );
        return true;
    }
}


/**
 * Converts a number in scientific notation (e.g. 1e+30) to a decimal string.
 *
 * Adapted from http://stackoverflow.com/a/1685917
 *
 * @internal
 */
function eToInt( x: number ): string {
    let e;
    let result = "";

    if( Math.abs( x ) < 1.0 ) {
        e = parseInt( x.toString().split( "e-" )[ 1 ] );
        if( e ) {
            x *= Math.pow( 10, e - 1 );
            result = "0." + ( new Array( e ) ).join( "0" ) + x.toString().substring( 2 );
        }
    } else {
        e = parseInt( x.toString().split( "+" )[ 1 ] );
        if( e > 20 ) {
            e -= 20;
            x /= Math.pow( 10, e );
            result = x + ( new Array( e + 1 ) ).join( "0" );
        }
    }

    return result;
}


/**
 * Registers a listener for an event.
 *
 * @see https://vorple-if.com/docs/listeners.html
 * @since 3.2.0
 *
 * @param eventNames  The event name or an array of event names where to add the listener
 * @param listener  The listener to register
 * @returns Returns a function that can be called to remove the listeners.
 */
export function addEventListener( eventNames: VorpleEventCategory | VorpleEventCategory[], listener: VorpleEventListener ): () => void {
    if( !Array.isArray( eventNames ) ) {
        eventNames = [ eventNames ];
    }

    eventNames.forEach( name => addOrRemoveListener( name, listener, "add" ) );

    return () => removeEventListener( eventNames, listener );
}


/**
 * Checks that the library's version matches the given version range.
 * See https://github.com/npm/node-semver#ranges for the full syntax.
 *
 * @example
 * If the library version is e.g. 3.2.8 the following return true:
 *
 * ```
 * vorple.checkVersion("3.2")
 * vorple.checkVersion(">=3.2.8")
 * vorple.checkVersion("<3.3")
 * vorple.checkVersion("3.2.8 || >=4")
 * vorple.checkVersion("3.1 - 3.2")
 * vorple.checkVersion("~3.2.5")
 * ```
 *
 * The following return false:
 *
 * ```
 * vorple.checkVersion(">=4.0")
 * vorple.checkVersion("<3.2.8")
 * vorple.checkVersion("~3.2.9")
 * ```
 *
 * @param versionRange  The version range to check
 * @returns True if version matches the given range, false otherwise.
 * @since 3.2.8
 */
export function checkVersion( versionRange: string ): boolean {
    return satisfies( packageJson.version, versionRange );
}


/**
 * Evaluates JavaScript code and writes the return value and its type to the
 * virtual filesystem for the story file to read.
 *
 * @param code  JavaScript code to evaluate
 */
export function evaluate( code: string ): void {
    /**
     * Stringify a value, or return the string "null" if the value can't be stringified
     * @internal
     */
    const safeStringify = function( value ): string {
        try {
            return JSON.stringify( value );
        }
        catch( e ) {
            return "null";
        }
    };

    let retval: string;
    let evaluationResult: unknown;

    const header = getHeader( code );

    code = code.substring( header.length );

    log( "Evaluating: " + code );

    let i7type = "nothing";

    // Evaluate the JavaScript code.
    try {
        evaluationResult = new Function( "'use strict';\n" + code )();
    }
    catch( e ) {
        error( "JavaScript code from story file threw an error: " + ( e as Error ).message + "\n\n" + code );
    }

    const type = typeof evaluationResult;

    // build the return value
    if( type === "undefined" ) {
        log( "The code did not return anything" );
        return;
    }
    else if( type === "string" ) {
        retval = `"${evaluationResult}"`;
        i7type = "text";
    }
    else if( type === "function" || type === "symbol" ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        retval = ( evaluationResult as any ).toString();
        i7type = "function";
    }
    else if( typeof Set !== "undefined" && evaluationResult instanceof Set ) {
        retval = safeStringify( Array.from( evaluationResult ) );
        i7type = "list";
    }
    else if( evaluationResult === Infinity ) {
        retval = "Infinity";
        i7type = "infinity";
    }
    else if( evaluationResult === -Infinity ) {
        retval = "-Infinity";
        i7type = "infinity";
    }
    else if( evaluationResult !== evaluationResult ) {   // NaN !== NaN
        retval = "NaN";
        i7type = "NaN";
    }
    else if( type === "boolean" ) {
        retval = String( evaluationResult );
        i7type = "truth state";
    }
    else if( type === "number" ) {
        const num = evaluationResult as number;
        if( Math.abs( num ) > 1e20 ) {   // more than 20 digits are displayed in scientific notation
            retval = eToInt( num );
        }
        else {
            retval = num.toString();
        }
        i7type = "number";
    }
    else {
        retval = safeStringify( evaluationResult );

        if( retval && retval !== "null" ) {
            const firstChar = retval.charAt( 0 );

            if( firstChar === "[" ) {
                i7type = "list";
            }
            else if( firstChar === "{" ) {
                i7type = "object";
            }
        }
    }

    log( `Return value (${i7type}): ${retval}` );

    write(
        JS_RETURN_VALUE_TYPE_FILENAME,
        i7type,
        {
            cwd: VORPLE_PATH
        }
    );

    write(
        JS_RETURN_VALUE_FILENAME,
        retval,
        {
            cwd: VORPLE_PATH
        }
    );
}


/**
 * Inform 7 adds the game's IFID to the text file which we must remove
 * before evaluating the actual content. We'll use the same header
 * to build the response file to make Inform think it's its own file.
 *
 * @param content  The contents of the file
 * @retuns Returns the header or an empty string if none present.
 * @internal
 */
function getHeader( content: string ): string {
    if( content.charAt( 0 ) === "*" ) {
        return content.substring( 0, content.indexOf( "\n" ) + 1 );
    }

    return "";
}


/**
 * Returns the Inform version, detected at handshake.
 * Before the handshake the value is undefined.
 *
 * @since 3.2.0
 */
export function getInformVersion(): 6 | 7 | undefined {
    return informVersion;
}


/**
 * Initializes and starts Vorple.
 *
 * @returns The function returns a promise that's resolved when the init event has triggered and the virtual filesystem
 * has started. The promise won't wait for the story file to load.
 */
export async function init(): Promise<void> {
    // use Haven's init listeners to trigger our own listeners
    addCallback( async() => {
        await triggerEvent( "init" );
    });

    // initialize submodules
    initPrompt();
    await initFilesystem();

    // start up Haven
    start({
        // container where the interpreter will be embedded
        container: window.vorple.options.container || "#vorple",

        // we use Vorple's custom prompt, not what the engine provides
        enginePrompt: false,

        // ignore Inform built-in font family features
        engineFontFamily: false,

        // use Glk's sendLine as the input function
        engineInputFunction: window.Glk.sendLine,

        // input and output filter functions
        filters: {
            input: applyInputFilters,
            output: applyOutputFilters
        },

        // have Haven trigger listeners
        hooks: {
            expectCommand: () => { triggerEvent( "expectCommand" ); },
            expectKeypress: () => { triggerEvent( "expectKeypress" ); },
            quit: () => { triggerEvent( "quit" ); },
            submitCommand: meta => triggerEvent( "submitCommand", meta ),
            submitKeypress: meta => triggerEvent( "submitKeypress", meta )
        },

        // the function that loads the story file
        loadStoryFile,

        // user-provided options
        options: {
            ...window.vorple.options,
            autosave: false,
            engineColors: false
        },

        // the callback that starts the interpreter after assets have loaded
        startEngine: initQuixe,

        // Glulx has Unicode support
        unicode: true
    });
}


/**
 * Removes a registered event listener.
 *
 * @param eventNames The event name or an array of event names from where to remove the listener.
 * Leaving this parameter out completely (i.e. passing the listener function as the first and only parameter)
 * removes the listener from all events where it's been registered.
 * @param listener The listener to remove
 * @returns Returns true if the listener was removed from at least one event.
 * @since 3.2.0
 */
export function removeEventListener( eventNames: VorpleEventCategory | VorpleEventCategory[], listener: VorpleEventListener ): boolean {
    // if the first parameter is a function, remove all listeners
    if( typeof eventNames === "function" ) {
        listener = eventNames;
        eventNames = Object.keys( eventListeners ) as VorpleEventCategory[];
    }
    else if( !Array.isArray( eventNames ) ) {
        eventNames = [ eventNames ];
    }

    // if an empty array was passed, the operation is still successful even though there's nothing to do
    if( eventNames.length === 0 ) {
        return true;
    }

    // return true if at least one of the events was removed
    return eventNames.map( name => addOrRemoveListener( name, listener, "remove" ) ).includes( true );
}


/**
 * Require a minimum version of Vorple. Minor updates are accepted if
 * they're not specified in the request. In other words, if version "3.1"
 * is requested, then any Vorple version below 3.2 (3.1, 3.1.1, 3.1.2 etc)
 * will pass. If version "3" is requested, every version 3.x.x will pass.
 *
 * If an optional callback is passed to the function, it will be run with
 * one boolean parameter: true if version matches, false otherwise.
 * Otherwise an error is thrown if the version doesn't match.
 *
 * @param requiredVersion  The minimum version of Vorple that's required
 * @param callback  If an optional callback function is passed, it will be run with
 * one boolean parameter: true if version matches, false otherwise. If a callback
 * isn't provided, this function throws an error if the version doesn't match.
 * @returns Returns true if version matches.
 * @deprecated Deprecated since 3.2.8 in favor of the more versatile [[checkVersion]].
 * The equivalent of e.g. `vorple.requireVersion("3.2")` is `vorple.checkVersion(">=3.2")`.
 */
export function requireVersion( requiredVersion: string, callback?: ( versionMatches: boolean ) => void ): boolean {
    const thisVer = packageJson.version.split( "." ).map( str => Number( str ) );
    const reqVer = ( "" + requiredVersion ).split( "." ).map( str => Number( str ) );
    const cb = callback || (
        ( match: boolean ): void => {
            if( !match ) {
                error( `Vorple version ${requiredVersion} was requested, but Vorple is at version ${packageJson.version}` );
            }
        });

    if( thisVer[ 0 ] < reqVer[ 0 ] ) {
        cb( false );
        return false;
    }

    if( thisVer[ 0 ] > reqVer[ 0 ] || reqVer.length === 1 ) {
        cb( true );
        return true;
    }

    if( thisVer[ 1 ] < reqVer[ 1 ] ) {
        cb( false );
        return false;
    }

    if( thisVer[ 1 ] > reqVer[ 1 ] || reqVer.length === 2 || thisVer.length === 2 ) {
        cb( true );
        return true;
    }

    if( thisVer[ 2 ] < reqVer[ 2 ] ) {
        cb( false );
        return false;
    }

    cb( true );
    return true;
}


/**
 * Sets the Inform version.
 *
 * @param version
 * @since 3.2.0
 * @internal
 */
export function setInformVersion( version: 6 | 7 ): void {
    informVersion = version;
}


/**
 * Runs all custom event listeners for the given event.
 *
 * @param eventName  Event to remove
 * @param meta  Event metadata
 * @since 3.2.0
 * @internal
 */
export async function triggerEvent( eventName: VorpleEventCategory, meta: Partial<VorpleEventMetadata> = {}): Promise<void> {
    for( let i = 0; i < eventListeners[ eventName ].length; ++i ) {
        await eventListeners[ eventName ][ i ]({ ...meta, type: eventName });
    }
}

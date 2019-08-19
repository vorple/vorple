/**
 * @module vorple
 */
import { start } from "../haven/haven";
import { addCallback } from "../haven/assets";

import { error, log } from "./debug";
import { init as initPrompt, applyInputFilters } from "./prompt";
import { loadStoryFile, initQuixe } from "./haven";

import { version } from "../package.json";
import {
    JS_RETURN_VALUE_FILENAME,
    JS_RETURN_VALUE_TYPE_FILENAME,
    VORPLE_PATH,
    init as initFilesystem,
    write
} from "./file";
import { applyOutputFilters } from "./output";

let informVersion;


/**
 * Containers for the custom event listeners.
 * @private
 */
const eventListeners = {
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
 * @private
 */
function addOrRemoveListener( eventName, listener, action ) {
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
 * From http://stackoverflow.com/a/1685917
 *
 * @param {number} x
 * @returns {string}
 * @private
 */
function eToInt( x ) {
    let e;

    if( Math.abs( x ) < 1.0 ) {
        e = parseInt( x.toString().split( 'e-' )[ 1 ] );
        if( e ) {
            x *= Math.pow( 10, e - 1 );
            x = '0.' + (new Array( e )).join( '0' ) + x.toString().substring( 2 );
        }
    } else {
        e = parseInt( x.toString().split( '+' )[ 1 ] );
        if( e > 20 ) {
            e -= 20;
            x /= Math.pow( 10, e );
            x += (new Array( e + 1 )).join( '0' );
        }
    }

    return x;
}


/**
 * Registers a listener for an event. See "Filters and event listeners" in the documentation for details.
 * 
 * @param {string|string[]} eventNames The event name or an array of event names where to add the listener
 * @param {function} listener The listener to register
 * @returns {function} A function that can be called to remove the listeners
 */
export function addEventListener( eventNames, listener ) {
    if( !Array.isArray( eventNames ) ) {
        eventNames = [ eventNames ];
    }

    eventNames.forEach( name => addOrRemoveListener( name, listener, "add" ) );

    return () => removeEventListener( eventNames, listener );
}


/**
 * Evaluates JavaScript code and writes the return value and its type to the
 * virtual filesystem for the story file to read.
 *
 * @param {string} filename
 */
export function evaluate( code ) {
    /**
     * @private
     * Stringify a value, or return null if the value can't be stringified
     */
    const safeStringify = function( value ) {
        try {
            return JSON.stringify( value );
        }
        catch( e ) {
            return null;
        }
    };

    let retval;

    const header = getHeader( code );

    code = code.substr( header.length );

    log( 'Evaluating: ' + code );

    let i7type = "nothing";

    // Evaluate the JavaScript code.
    try {
        retval = new Function( "'use strict';\n" + code )();
    }
    catch(e) {
        error( 'JavaScript code from story file threw an error: ' + e.message + '\n\n' + code );
    }

    const type = typeof retval;

    // build the return value
    if( type === 'undefined' ) {
        log( 'The code did not return anything' );
        return;
    }
    else if( type === 'string' ) {
        retval = '"' + retval + '"';
        i7type = "text";
    }
    else if( type === 'function' || type === 'symbol' ) {
        retval = retval.toString();
        i7type = "function";
    }
    else if( typeof Set !== 'undefined' && retval instanceof Set ) {
        retval = safeStringify( Array.from( retval ) );
        i7type = "list";
    }
    else if( retval === Infinity ) {
        retval = 'Infinity';
        i7type = "infinity";
    }
    else if( retval === -Infinity ) {
        retval = '-Infinity';
        i7type = "infinity";
    }
    else if( retval !== retval ) {   // NaN !== NaN
        retval = 'NaN';
        i7type = "NaN";
    }
    else if( type === "boolean" ) {
        retval = String( retval );
        i7type = "truth state";
    }
    else if( type === 'number' ) {
        if( Math.abs( retval ) > 1e20 ) {   // more than 20 digits are displayed in scientific notation
            retval = eToInt( retval );
        }
        else {
            retval = "" + retval;
        }
        i7type = "number";
    }
    else {
        retval = safeStringify( retval );

        if( retval ) {
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
 * @param {string} content  The contents of the file
 * @private
 */
function getHeader( content ) {
    if( content.charAt( 0 ) === '*' ) {
        return content.substr( 0, content.indexOf( '\n' ) + 1 );
    }

    return "";
}


/**
 * Returns the Inform version, detected at handshake.
 * Before the handshake the value is undefined.
 * 
 * @returns {number|undefined} 6 or 7
 */
export function getInformVersion() {
    return informVersion;
}


/**
 * Initializes and starts Vorple.
 */
export async function init() {
    // use Haven's init listeners to trigger our own listeners
    addCallback( async cb => { 
        await triggerEvent( 'init' );
        cb();
    });

    // initialize submodules
    initPrompt();
    await initFilesystem();

    // start up Haven
    start({
        // we use Vorple's custom prompt, not what the engine provides
        enginePrompt: false,

        // ignore font family
        engineFontFamily: false,

        filters: {
            input: applyInputFilters,
            output: applyOutputFilters
        },

        // have Haven trigger listeners
        hooks: {
            expectCommand: () => { triggerEvent( 'expectCommand' ); },
            expectKeypress: () => { triggerEvent( 'expectKeypress' ); },
            quit: () => { triggerEvent( 'quit' ); },
            submitCommand: meta => triggerEvent( 'submitCommand', meta ),
            submitKeypress: meta => triggerEvent( 'submitKeypress', meta )
        },

        // the function that loads the story file
        loadStoryFile, 

        // user-provided options
        options: vorple.options,

        // the callback that starts the interpreter after assets have loaded
        startEngine: initQuixe,

        // Glulx has Unicode support
        unicode: true
    });
}


/**
 * Removes a registered event listener.
 * 
 * @param {string|string[]} [eventNames] The event name or an array of event names from where to remove the listener.
 * Leaving this parameter out completely (i.e. passing the listener function as the first and only parameter)
 * removes the listener from all events where it's been registered.
 * @param {function} listener The listener to remove
 * @returns {boolean} True if the listener was removed from at least one event
 */
export function removeEventListener( eventNames, listener ) {
    // if the first parameter is a function, remove all listeners
    if( typeof eventNames === "function" ) {
        listener = eventNames;
        eventNames = Object.keys( eventListeners );
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
 * @param {string} requiredVersion  The minimum version of Vorple that's required.
 * @param {function} [callback]  A custom callback
 * @returns {boolean} True if version matches
 */
export function requireVersion( requiredVersion, callback ) {
    const thisVer = version.split( '.' ).map( str => Number( str ) );
    const reqVer = ("" + requiredVersion).split( '.' ).map( str => Number( str ) );
    const cb = callback || (
        match => {
            if( !match ) {
                error( `Vorple version ${requiredVersion} was requested, but Vorple is at version ${version}` );
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
 * @param {number} version 
 * @private
 */
export function setInformVersion( version ) {
    informVersion = version;
}


/**
 * Runs all custom event listeners for the given event.
 * 
 * @param {string} eventName 
 * @param {object} [meta={}]
 * @private
 */
export async function triggerEvent( eventName, meta = {} ) {
    for( let i = 0; i < eventListeners[ eventName ].length; ++i ) {
        await eventListeners[ eventName ][ i ]({ ...meta, type: eventName });
    }
}
/**
 * @module vorple
 */
import { start } from "../haven/haven";

import { error, log } from "./debug";
import { init as initPrompt } from "./prompt";
import { loadStoryFile, initQuixe } from "./haven";

import { version } from "../package.json";
import {
    JS_RETURN_VALUE_FILENAME,
    JS_RETURN_VALUE_TYPE_FILENAME,
    VORPLE_PATH,
    init as initFilesystem,
    write
} from "./file";

let informVersion;

/**
 * @private
 * Converts a number in scientific notation (e.g. 1e+30)
 * to a decimal string.
 *
 * From http://stackoverflow.com/a/1685917
 *
 * @param {number} x
 * @returns {string}
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
 * @private
 * Inform 7 adds the game's IFID to the text file which we must remove
 * before evaluating the actual content. We'll use the same header
 * to build the response file to make Inform think it's its own file.
 *
 * @param {string} content  The contents of the file
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
 * 
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
 * Initializes and starts Vorple.
 */
export async function init() {
    // initialize submodules
    initPrompt();
    await initFilesystem();

    // start up Haven
    start({
        // we use Vorple's custom prompt, not what the engine provides
        enginePrompt: false,

        // ignore font family
        engineFontFamily: false,

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
 * @return {boolean} True if version matches
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
 * @private
 * Sets the Inform version.
 * 
 * @param {number} version 
 */
export function setInformVersion( version ) {
    informVersion = version;
}

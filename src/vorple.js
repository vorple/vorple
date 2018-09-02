import vex from "vex-js";

import { addCallback } from "../haven/assets";
import { start } from "../haven/haven";

import { error, log } from "./debug";
import { init as initPrompt } from "./prompt";

import { version } from "../package.json";

const HANDSHAKE_FILENAME = 'VpHndshk';
const JS_EVAL_FILENAME = 'VpJSEval';
const JS_RETURN_VALUE_FILENAME = 'VpJSRtrn';
const FILE_EXTENSION = '.glkdata';


/**
 * Converts a number in scientific notation (e.g. 1e+30)
 * to a decimal string.
 *
 * From http://stackoverflow.com/a/1685917
 *
 * @param x
 * @returns {*}
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
 * Inform 7 adds the game's IFID to the text file which we must remove
 * before evaluating the actual content. We'll use the same header
 * to build the response file to make Inform think it's its own file.
 */
function getHeader( content ) {
    if( content.charAt( 0 ) === '*' ) {
        return content.substr( 0, content.indexOf( '\n' ) + 1 );
    }

    return "";
}


/**
 * Receive a handshake from the game and write our response.
 * The game should write "Callooh!" to the handshake file
 * and we respond with "Callay!" (yes, it's cheesy)
 *
 * @param filename
 */
function handshake( filename ) {
    const gameHandshake = FS.readFile( filename, {encoding: 'utf8'} );
    const header = getHeader( gameHandshake );
    const content = gameHandshake.substr( header.length );

    if( content === "Callooh!" ) {
        log( 'Handshake passed, Vorple story confirmed' );

        FS.unlink( filename );
        FS.writeFile( filename, header + "Callay!", {encoding: 'utf8'} );

        return true;
    }
    else {
        log( 'Handshake failed, expected "Callooh!" but received "' + content + '" instead' );

        return false;
    }
}


/**
 * The story file has closed a file. If it's a handshake file, initiate
 * handshake. If it's the eval file, evaluate the JavaScript it contains.
 *
 * @param filename
 */
export function fileClosed( filename ) {
    if( filename.indexOf( HANDSHAKE_FILENAME + FILE_EXTENSION ) !== -1 ) {
        handshake( filename );
        return;
    }

    /**
     * Stringify a value, or return null if the value can't be stringified
     */
    const safe_stringify = function( value ) {
        try {
            return JSON.stringify( value );
        }
        catch( e ) {
            return null;
        }
    };

    if( filename.indexOf( JS_EVAL_FILENAME + FILE_EXTENSION ) !== -1 ) {
        let code = FS.readFile( filename, { encoding: 'utf8' });
        let retval;

        const header = getHeader( code );

        code = code.substr( header.length );

        log( 'Evaluating: ' + code );

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
        }
        else if( type === 'number' ) {
            if( Math.abs( retval ) > 1e20 ) {   // more than 20 digits are displayed in scientific notation
                retval = eToInt( retval );
            }
            else {
                retval = "" + retval;
            }
        }
        else if( type === 'function' || type === 'symbol' ) {
            retval = retval.toString();
        }
        else if( typeof Set !== 'undefined' && retval instanceof Set ) {
            retval = safe_stringify( Array.from( retval ) );
        }
        else if( retval === Infinity ) {
            retval = 'Infinity';
        }
        else if( retval === -Infinity ) {
            retval = '-Infinity';
        }
        else if( retval !== retval ) {   // NaN !== NaN
            retval = 'NaN';
        }
        else {
            retval = safe_stringify( retval );
        }

        log( 'Return value: ' + retval );

        FS.writeFile(
            JS_RETURN_VALUE_FILENAME + FILE_EXTENSION,
            header + retval,
            { encoding: 'utf8' }
        );
    }
};


/**
 * Initializes and starts Vorple.
 */
export function init() {
    // initialize submodules
    initPrompt();

    // start up Haven
    start( {
        // we use Vorple's custom prompt, not what the engine provides
        enginePrompt: false,

        // ignore font family
        engineFontFamily: false,

        // user-provided options
        options: vorple.options,

        // Glulx has Unicode support
        unicode: true,

        // the name of the story file in the virtual filesystem
        virtualStoryfile: 'storyfile.gblorb'
    } );

    // create the handshake file when the interpreter has loaded
    // and delete any old control files
    addCallback( function( done ) {
        FS.syncfs( true, function() {
            FS.writeFile( '/gamedata/' + HANDSHAKE_FILENAME + FILE_EXTENSION, "" );

            try {
                FS.unlink( '/gamedata/' + JS_EVAL_FILENAME + FILE_EXTENSION );
            } catch(e) {
            }

            try {
                FS.unlink( '/gamedata/' + JS_RETURN_VALUE_FILENAME + FILE_EXTENSION );
            } catch(e) {
            }

            FS.syncfs( false, done );
        } );
    } );
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
 * @param {string} requiredVersion The minimum version of Vorple that's required.
 * @param {function} callback A custom callback
 * @return {boolean} true if version matches
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
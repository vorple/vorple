(function( vorple ) {
    "use strict";

    const HANDSHAKE_FILENAME = 'VpHndshk',
          JS_EVAL_FILENAME ='VpJSEval',
          JS_RETURN_VALUE_FILENAME = 'VpJSRtrn',
          FILE_EXTENSION = '.glkdata';

    const VERSION = '3.0';


    /**
     * Converts a number in scientific notation (e.g. 1e+30)
     * to a decimal string.
     *
     * From http://stackoverflow.com/a/1685917
     *
     * @param x
     * @returns {*}
     */
    function eToInt(x ) {
        var e;

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
        var gameHandshake = FS.readFile( filename, { encoding: 'utf8' } ),
            header = getHeader( gameHandshake ),
            content = gameHandshake.substr( header.length );

        if( content === "Callooh!" ) {
            vorple.debug.log( 'Handshake passed, Vorple story confirmed' );

            FS.unlink( filename );
            FS.writeFile( filename, header + "Callay!", { encoding: 'utf8' } );
        }
        else {
            vorple.debug.log( 'Handshake failed, expected "Callooh!" but received "' + content + '" instead' );
        }
    }


    /**
     * Prints a debugging message.
     */
    vorple.debug = function( text ) {
        console.log( text );
        haven.buffer.append( '[' + text + ']\n', 0 );
    };


    /**
     * Shows an error message.
     *
     * @param text
     */
    vorple.error = function( text ) {
        haven.error( text );
    };


    /**
     * The story file has closed a file. If it's a handshake file, initiate
     * handshake. If it's the eval file, evaluate the JavaScript it contains.
     *
     * @param filename
     */
    vorple.fileClosed = function( filename ) {
        if( filename.indexOf( HANDSHAKE_FILENAME + FILE_EXTENSION ) !== -1 ) {
            handshake( filename );
            return;
        }

        if( filename.indexOf( JS_EVAL_FILENAME + FILE_EXTENSION ) !== -1 ) {
            var code = FS.readFile( filename, { encoding: 'utf8' } ),
                header = getHeader( code ),
                retval;

            code = code.substr( header.length );

            vorple.debug.log( 'Evaluating: ' + code );

            // Evaluate the JavaScript code.
            // Wrapping the eval in a self-executing function makes sure
            // variables declared in eval don't become global.
            try {
                retval = (function(){
                    return (0, eval)( code ); // (0, eval) guarantees "this" points to window
                })();
            }
            catch( e ) {
                vorple.error( 'JavaScript from story file threw an error: ' + e.message );
            }

            // build the return value
            if( typeof retval === 'string' ) {
                retval = '"' + retval + '"';
            }
            else if( typeof retval === 'number' ) {
                if( Math.abs( retval ) > 1e20 ) {   // more than 20 digits are displayed in scientific notation
                    retval = eToInt( retval );
                }
                else {
                    retval = "" + retval;
                }
            }
            else if( retval === undefined ) {
                retval = 'undefined';
            }
            else if( typeof retval === 'function' || typeof retval === 'symbol' ) {
                retval = retval.toString();
            }
            else if( typeof Set !== 'undefined' && retval instanceof Set ) {
                retval = JSON.stringify( Array.from( retval ) );
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
                retval = JSON.stringify( retval );
            }

            vorple.debug.log( 'Return value: ' + retval );

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
    vorple.init = function() {
        // initialize submodules
        vorple.prompt.init();

        // start up Haven
        haven.start({
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
        });

        // create the handshake file when the interpreter has loaded
        // and delete any old control files
        haven.assets.addCallback( function( done ) {
            FS.syncfs( true, function () {
                FS.writeFile( '/gamedata/' + HANDSHAKE_FILENAME + FILE_EXTENSION, "" );

                try {
                    FS.unlink( '/gamedata/' + JS_EVAL_FILENAME + FILE_EXTENSION );
                } catch(e) {}

                try {
                    FS.unlink( '/gamedata/' + JS_RETURN_VALUE_FILENAME + FILE_EXTENSION );
                } catch(e) {}

                FS.syncfs( false, done );
            });
        });

        // initialize Vex modals
        if( window.vex ) {
            vex.defaultOptions.className = 'vex-theme-plain';
        }
    };


    /**
     * The options object that holds Vorple and Haven options.
     *
     * @type {object}
     */
    vorple.options = {

    };


    /**
     * Require a minimum version of Vorple. Minor updates are accepted if
     * they're not specified in the request. In other words, if version "3.1"
     * is requested, then any Vorple version below 3.2 (3.1, 3.1.1, 3.1.2 etc)
     * will pass. If version "3" is requested, every version that's below 4.0
     * will pass.
     *
     * @param {string} requiredVersion The minimum version of Vorple that's required.
     */
    vorple.requireVersion = function( requiredVersion ) {
        var thisVer = VERSION.split( '.' ),
            reqVer = ("" + requiredVersion).split( '.' ),
            mismatch = function() {
                vorple.error( 'Vorple version ' + requiredVersion + ' was requested, but Vorple is at version ' + VERSION );
            };

        if( thisVer[0] < reqVer[0] ) {
            mismatch();
            return;
        }

        if( thisVer[0] > reqVer[0] || reqVer.length === 1 ) {
            return;
        }

        if( thisVer[1] < reqVer[1] ) {
            mismatch();
            return;
        }

        if( thisVer[1] > reqVer[1] || reqVer.length === 2 || thisVer.length === 2 ) {
            return;
        }

        if( thisVer[2] < reqVer[2] ) {
            mismatch();
        }
    };


    /**
     * Expose version number.
     *
     * @type {string}
     */
    vorple.version = VERSION;

    window.vorple = vorple;
})( window.vorple || {} );
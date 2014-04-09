/* vorple.core.js - Vorple core functions */

var vorple = window.vorple = {};

/**
 * @namespace
 * @name core
 * @description Most of these are used internally
 *  as helper functions and using them directly is often not necessary.
 */
vorple.core = (function($){
    var self = {},
        /**
         * Version number
         *
         * @private
         * @field
         * @name core~version
         * @type string
         */
        version = '2.5',
        engine;

    /**
     * Vorple and story settings.
     *
     * @public
     * @field
     * @name core#settings
     * @type object
     */
    self.settings = {
        /**
         * If set to true or a string, a confirmation dialog pops up
         * before the browser window is closed asking to confirm if the
         * player really wants to quit. If set to a string, the given text is
         * displayed in the confirmation dialog.
         *
         * The dialog is never displayed if the player either has not taken
         * any turns or has just saved the story without taking further turns.
         *
         * NOTE: Firefox ver 4 and above will not display the custom message
         * to the player, but will use its own default instead.
         *
         * @public
         * @field
         * @type boolean
         */
        confirmWindowClose: false,

        /** 
         * Debug state
         *
         * @public
         * @field
         * @type boolean
         */
        debug: false
    };


    /**
     * Initialization functions.
     *
     * @private
     */
    var init = function( initSystem ) {
        // save the engine
        if( typeof initSystem !== 'undefined' ) {
            engine = initSystem;
        }

        // insert the version number to the layout
        $( '.vorple-version' ).html( self.getVersion() );

        // dialog that warns the player they're leaving the page
        window.onbeforeunload = function( e ) {
            if( self.settings.confirmWindowClose && !self.settings.debug ) {
                var msg;

                if( self.settings.confirmWindowClose === true ) {
                    msg = "You are about to leave the story. "
                        + "Any unsaved progress will be lost. "
                        + "Are you sure you want to continue?";
                }
                else {
                    msg = self.settings.confirmWindowClose;
                }

                // For IE and Firefox prior to version 4, according to MDN
                if( e ) {
                    e.returnValue = msg;
                }

                return msg;
            }
        };

        // make sure console.log() exists so that possible debugging commands
        // left in the published story don't halt the execution
        if( typeof window.console === 'undefined' ) {
            window.console = { log: function() {} };
        }
    };

    
    /**
     * Checks which engine is running the story under the hood
     * (Undum or Parchment).
     * 
     * @param {string} [name] Name of an engine to check, in lowercase
     * ("undum" or "parchment").
     * True is returned if we're using this engine.  
     * 
     * @returns {string|boolean|null} The name of the current engine in lowercase,
     * null if no engine is loaded or false if the engine is unknown.
     *  
     * When testing for a specific engine, true or false is returned.
     *
     * @public
     * @method
     * @name core#engine
     */
    self.engine = function( name ) {
        // If the system object contains "setQuality",
        // the engine is most likely Undum.
        var isUndum = !!( engine && typeof engine.Situation === 'function' );

        // Similar test for Parchment
        var isParchment = !!( engine && typeof engine.vms === 'object' );

        if( typeof name === 'string' ) {
            switch( name ) {
                case 'undum':
                    return isUndum;
                case 'parchment':
                    return isParchment;
                default:
                    return false;
            }
        }
        
        if( !engine ) {
            return null;
        }
        
        if( isUndum ) {
            return 'undum';
        }
        
        if( isParchment ) {
            return 'parchment';
        }

        // unknown system
        return false;
    };

    
    /**
     * Generates a random unique id composed of letters and numbers [1-9a-zA-Z].  
     * The first character is never a number.
     * 
     * @param {integer} [length=32] The length of the generated id
     * @returns {string} The generated id
     *
     * @public
     * @method
     * @name core#generateId
     */
    self.generateId = function( length ) {
        if( length === undefined ) {
            length = 32;
        }
    
        var id = '',
            rnd;
        
        for( var i = 0; i < length; ++i ) {
            // make sure the first character is not a number
            if( i === 0 ) {
                rnd = Math.floor( Math.random() * 52 ) + 10;
            }
            else {
                rnd = Math.floor( Math.random() * 62 );
            }
            
            // algorithm by kennebec (http://stackoverflow.com/a/1350278)
            if( rnd < 10 ) {
                id += ''+rnd;
            }
            else if( rnd < 36 ) {
                id += String.fromCharCode( rnd + 55 );
            }
            else {
                id += String.fromCharCode( rnd + 61 );
            }
        }
        
        return id;
    };


    /**
     * Returns the engine object.
     *
     * @returns {object}
     *
     * @public
     * @method
     * @name core#getEngine
     * @since 2.5
     */
    self.getEngine = function() {
        return engine;
    };


    /**
     * Returns the current version number.
     *
     * @returns {string}
     *
     * @public
     * @method
     * @name core#getVersion
     * @since 2.5
     */
    self.getVersion = function() {
        return version;
    };


    /**
     * Initialize and start Vorple.
     *  
     * A custom event 'init.vorple' is triggered after the core
     * initialization has been done. Custom initialization functions can
     * be added using a listener: 
     * <code>
     * $( document ).on( 'init.vorple', function() {
     *     console.log( 'Vorple started!' );
     * });</code> 
     * 
     * @param {object} [system] The engine running the story
     *
     * @public
     * @method
     * @name core#init
     */
    self.init = function( system ) {
        init( system );
        $( document ).trigger( 'init.vorple' );
    };

    
    /**
     * Require a certain version of the Vorple library.
     *
     * The accuracy of the check depends on the given parameter. Exact version
     * number is assumed, except for parts of the version number that are
     * omitted. For example if the actual current version number is 2.4.1, then:
     *
     * vorple.core.requireVersion( "2" )      =>  true
     * vorple.core.requireVersion( "2.4" )    =>  true
     * vorple.core.requireVersion( "2.4.1" )  =>  true
     * vorple.core.requireVersion( "1" )      =>  error
     * vorple.core.requireVersion( "2.3" )    =>  error
     * vorple.core.requireVersion( "2.4.0" )  =>  error
     * vorple.core.requireVersion( "2.4.2" )  =>  error
     *
     * The version number can be given as an array of two version numbers.
     * The version number is then required to be inside the given range (inclusive).
     * 
     * An error is thrown if the current version does not fit within the bounds.
     * A second parameter can be given that contains the error message, or 
     * a function that will be called instead of throwing the error.
     * 
     * @param {string|number|array} requiredVersion The exact allowed version or
     *   an array of [lowest, highest] required version
     * @param {string|function} [message] The error message's text
     *   or a function to call on error
     *
     * @returns {boolean} True if version number is within bounds
     *
     * @public
     * @method
     * @name core#requireVersion
     * @since 2.5
     */
    self.requireVersion = function( requiredVersion, message ) {
        // helper for changing all array values to integers
        var parseArrayInt = function( arr ) {
            return $.map( arr, function( element ) {
                return parseInt( element, 10 );
            });
        };

        var minVersion,
            maxVersion,
            requiredVersionString,
            currentVersion = parseArrayInt( self.getVersion().split( '.' ) ),
            minBoundaryOk = false,
            maxBoundaryOk = false;

        switch( typeof requiredVersion ) {
            case 'object':
                if( $.isArray( requiredVersion ) ) {
                    minVersion = requiredVersion[0];
                    maxVersion = requiredVersion[1];
                    requiredVersionString = minVersion+"-"+maxVersion;
                }
                break;

            case 'number':
                minVersion = requiredVersion.toString();
                maxVersion = requiredVersion.toString();
                requiredVersionString = requiredVersion.toString();
                break;

            case 'string':
                minVersion = requiredVersion;
                maxVersion = requiredVersion;
                requiredVersionString = requiredVersion;
                break;
            
            default:
                throw new Error( "Invalid type " + ( typeof requiredVersion ) + " given as a parameter to vorple.core.requireVersion()" );
        }
        
        minVersion = parseArrayInt( minVersion.split( '.' ) );
        maxVersion = parseArrayInt( maxVersion.split( '.' ) );

        switch( minVersion.length ) {
            case 1:
                minBoundaryOk = ( minVersion[ 0 ] <= currentVersion[ 0 ] );
                break;
            case 2:
                minBoundaryOk =
                    ( minVersion[ 0 ] < currentVersion[ 0 ] )
                    || ( minVersion[ 0 ] === currentVersion[ 0 ] && minVersion[ 1 ] <= currentVersion[ 1 ] );
                break;
            case 3:
                minBoundaryOk =
                    ( minVersion[ 0 ] < currentVersion[ 0 ] )
                    || ( minVersion[ 0 ] === currentVersion[ 0 ] && minVersion[ 1 ] < currentVersion[ 1 ] )
                    || ( minVersion[ 0 ] === currentVersion[ 0 ] && minVersion[ 1 ] === currentVersion[ 1 ] && minVersion[ 2 ] <= currentVersion[ 2 ] );
                break;
        }

        switch( maxVersion.length ) {
            case 1:
                maxBoundaryOk = ( maxVersion[ 0 ] >= currentVersion[ 0 ] );
                break;
            case 2:
                maxBoundaryOk =
                    ( maxVersion[ 0 ] > currentVersion[ 0 ] )
                    || ( maxVersion[ 0 ] === currentVersion[ 0 ] && maxVersion[ 1 ] >= currentVersion[ 1 ] );
                break;
            case 3:
                maxBoundaryOk =
                    ( maxVersion[ 0 ] > currentVersion[ 0 ] )
                    || ( maxVersion[ 0 ] === currentVersion[ 0 ] && maxVersion[ 1 ] > currentVersion[ 1 ] )
                    || ( maxVersion[ 0 ] === currentVersion[ 0 ] && maxVersion[ 1 ] === currentVersion[ 1 ] && maxVersion[ 2 ] >= currentVersion[ 2 ] );
                break;
        }
        
        if( minBoundaryOk && maxBoundaryOk ) {
            return true;
        }

        switch( typeof message ) {
            case 'function':
                message();
                break;
            case 'string':
                throw new Error( message );
            default:
                throw new Error( "Version mismatch: version "
                    + requiredVersionString
                    + " required, currently running version "
                    + self.getVersion()
                );
        }
    };

    return self;
} )( jQuery );

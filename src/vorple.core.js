/* vorple.core.js - Vorple core functions */

/** Function inheritance, by Crockford 
 * will be excluded from the test coverage 
 **/

//#JSCOVERAGE_IF 0
Function.prototype.inherits = function(Parent) {
    var d = {}, p = (this.prototype = new Parent());
    this.prototype.uber = function(name) {
        if (!(name in d)) {
            d[name] = 0;
        }
        var f, r, t = d[name], v = Parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f === this[name]) {
                f = v[name];
            }
        }
        d[name] += 1;
        r = f.apply(this, Array.prototype.slice.apply(arguments, [1]));
        d[name] -= 1;
        return r;
    };
    return this;
};
//#JSCOVERAGE_ENDIF

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
         * Release number
         *
         * @private
         * @field
         * @name core~release
         * @type integer
         */
        release = 4,
        /**
         * Version number
         *
         * @private
         * @field
         * @name core~version
         * @type integer
         */
        version = 2,
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
    var _init = function( initSystem ) {
        // save the engine
        if( typeof initSystem !== 'undefined' ) {
            engine = initSystem;
        }

        // insert the version number to the layout
        $( '.vorple-version' ).html( version+'.'+release );

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

//#JSCOVERAGE_IF 0
                // For IE and Firefox prior to version 4, according to MDN
                if( e ) {
                    e.returnValue = msg;
                }
//#JSCOVERAGE_ENDIF

                return msg;
            }
        };

        // make sure console.log() exists so that possible debugging commands
        // left in the published story don't halt the execution
        if( typeof window.console === 'undefined' ) {
//#JSCOVERAGE_IF !window.console
            window.console = { log: function() {} };
//#JSCOVERAGE_ENDIF
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
        var isUndum = !!( engine && typeof engine.setQuality === 'function' );

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
     * Returns the current release number.
     *
     * @returns {integer}
     *
     * @public
     * @method
     * @name core#getRelease
     * @since 2.5
     */
    self.getRelease = function() {
        return release;
    };


    /**
     * Returns the current version number.
     *
     * @returns {integer}
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
        _init( system );
        $( document ).trigger( 'init.vorple' );
    };

    
    /**
     * Require a certain release of the Vorple library. 
     * 
     * The release number can be given as an array of two integers.
     * The release number is then required to be inside the given range (inclusive).
     * 
     * An error is thrown if the current version does not fit within the bounds.
     * A second parameter can be given that contains the error message, or 
     * a function that will be called instead of throwing the error.
     * 
     * @param {number|array} requiredRelease The exact allowed release or an array
     *   of [lowest, highest] required release
     * @param {string|function} [message] The error message's text
     *   or a function to call on error
     *
     * @returns {boolean} True if release number is within bounds
     *
     * @public
     * @method
     * @name core#requireRelease
     */
    self.requireRelease = function( requiredRelease, message ) {
        var minRelease,
            maxRelease,
            requiredReleaseString;

        if( $.isArray( requiredRelease ) ) {
            minRelease = requiredRelease[0];
            maxRelease = requiredRelease[1];
            requiredReleaseString = minRelease+"-"+maxRelease;
        }
        else {
            minRelease = requiredRelease;
            maxRelease = requiredRelease;
            requiredReleaseString = requiredRelease;
        }

        if( minRelease > release || ( maxRelease !== false && maxRelease < release ) ) {
            switch( typeof message ) {
                case 'function':
                    message();
                    break;
                case 'string':
                    throw new Error( message );
                default:
                    throw new Error( "Version mismatch: release "
                        + requiredReleaseString
                        + " required, currently running release "
                        + release
                    );
            }
        }
        
        return true;
    };

    return self;
} )( jQuery );

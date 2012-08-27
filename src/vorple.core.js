/* vorple.core.js - Vorple core functions */

/** Function inheritance, by Crockford 
 * will be excluded from the test coverage 
 **/

//#JSCOVERAGE_IF 0
Function.prototype.inherits = function(Parent) {
    var d = {}, p = (this.prototype = new Parent());
    this.prototype.uber = function(name) {
        if (!(name in d)) d[name] = 0;
        var f, r, t = d[name], v = Parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f == this[name]) {
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
    
/** Vorple main object */
var vorple = {};

( function( $ ) {

    /** @namespace Core functions. Most of these are used internally  
     *  as helper functions and using them directly is often not necessary.
     */
    vorple.core = {
        /** Release number
         * @const
         */
        release: 3,
        
        /** Major version number
         * @const
         */
        version: 1,
        
        /** The interpreter engine
         */
        system: null
    };
    
    
    /** 
     * Default core options
     * @const
     */
    vorple.core.defaults = {
        target: '_blank'
    };

    
    /**
     * Vorple and story settings.
     */
    vorple.core.settings = {
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
         */
        confirmWindowClose: false,
        
        /** Debug state
         */
        debug: false
    };
    
    
    /**
     * Initialization functions.
     * @private
     */
    vorple.core._init = function( system ) {
        // save the engine
        if( typeof system !== 'undefined' ) {
            this.system = system;
        }
        
        // insert the version number to the layout
        $( '.vorple-version' ).html( this.version+'.'+this.release );
        
        // dialog that warns the player they're leaving the page
        window.onbeforeunload = function( e ) {
            if( vorple.core.settings.confirmWindowClose && !vorple.core.settings.debug ) {
                var msg;
                
                if( vorple.core.settings.confirmWindowClose === true ) {
                    msg = "You are about to leave the story. "
                        + "Any unsaved progress will be lost. "
                        + "Are you sure you want to continue?";
                }
                else {
                    msg = vorple.core.settings.confirmWindowClose;
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
            window.console = { log: function( txt ) {} };
//#JSCOVERAGE_ENDIF
        }
    };
    
    
    /**
     * Checks which engine is running the story under the hood
     * (Undum or Parchment).
     * 
     * @param {String} [name] Name of an engine to check, in lowercase
     * ("undum" or "parchment").
     * True is returned if we're using this engine.  
     * 
     * @return {String|Boolean|null} The name of the current engine in lowercase,
     * null if no engine is loaded or false if the engine is unknown.
     *  
     * When testing for a specific engine, true or false is returned.  
     */
    vorple.core.engine = function( name ) {
    	// If the system object contains "SimpleSituation",
        // the engine is most likely Undum.
        var isUndum = !!( vorple.core.system && typeof vorple.core.system.SimpleSituation === 'function' );

        // Similar test for Parchment 
        var isParchment = !!( vorple.core.system && typeof vorple.core.system.vms === 'object' );

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
        
        if( !vorple.core.system ) {
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
     * @param {Integer} [length=32] The length of the generated id
     */
    vorple.core.generateId = function( length ) {
        if( length === undefined ) {
            var length = 32;
        }
    
        var id = '';
        
        for( var i = 0; i < length; ++i ) {
            // make sure the first character is not a number
            if( i == 0 ) {
                var rnd = Math.floor( Math.random() * 52 ) + 10;
            }
            else {
                var rnd = Math.floor( Math.random() * 62 );
            }
            
            // algorithm by kennebec (http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript/1350278#1350278)
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
     * Initialize and start Vorple.
     *  
     * A custom event 'init.vorple' is triggered after the core
     * initialization has been done. Custom initialization functions can
     * be added using a listener: 
     * <code>
     * $( document ).bind( 'init.vorple', function() {
     *     alert( 'Hello!' );
     * });</code> 
     * 
     * @param {object} [system] The engine running the story
     */
    vorple.core.init = function( system ) {
        this._init( system );
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
     * @param {int|array} release The lowest allowed release or an array 
     *   of [lowest, highest] required release
     * @param {string|function} [message] The error message's text
     *   or a function to call on error
     * 
     * @return {boolean} True if release number is within bounds 
     */
    vorple.core.requireRelease = function( release, message ) {
        var minRelease;
        var maxRelease = false;
        var requiredReleaseString; 
        
        if( $.isArray( release ) ) {
            minRelease = release[0]; 
            maxRelease = release[1];
            requiredReleaseString = minRelease+"-"+maxRelease;
        }
        else {
            minRelease = release;
            requiredReleaseString = release;
        }

        if( minRelease > this.release || ( maxRelease !== false && maxRelease < this.release ) ) {
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
                        + this.release 
                    );
            }
        }
        
        return true;
    };
} )( jQuery );

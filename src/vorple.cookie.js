/** @namespace cookie
 * @name cookie
 * @description Creating, reading and deleting cookies.
 *
 *  Based on {@link https://github.com/carhartl/jquery-cookie|jquery.cookie.js}
 */
vorple.cookie = (function($) {
    var self = {};

    /**
     * Default options
     *
     * @public
     * @field
     * @name cookie#defaults
     * @type object
     */
    self.defaults = {
        /**
         * The expiration of set cookies, in days
         *
         * @public
         * @field
         * @type integer
         */
        expires: 365
    };
    
    
    /**
     * List all currently set cookies.
     * 
     * @returns {string[]} An array of the names of the cookies
     *
     * @public
     * @method
     * @name cookie#list
     */
    self.list = function() {
        var list = [];
        var cookies = document.cookie.split( ';' );
        
        for( var i = 0; i < cookies.length; ++i ) {
            list.push( $.trim( cookies[ i ].split( '=' )[ 0 ] ) );            
        }
        
        return list;
    };
    
    
    /**
     * Read the contents of a cookie.
     * 
     * @param {string} name Name of the cookie to read
     * @param {object} [options]
     * 
     * @returns {string|null} The contents of the cookie or null if the
     * cookie was not found.
     *
     * @public
     * @method
     * @name cookie#read
     */
    self.read = function( name, options ) {
        var opt = $.extend( {}, self.defaults, options );
        var result;
        var decode = opt.raw ? function (s) { return s; } : decodeURIComponent;
        return (result = new RegExp('(?:^|; )' + encodeURIComponent( name ) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
    };
      
      
    /**
     * Remove a cookie.
     * 
     * @param {string} name Name of the cookie to remove.
     *
     * @public
     * @method
     * @name cookie#remove
     */
    self.remove = function( name ) {
        self.write( name, null );
    };
    
    
    /**
     * Set a cookie with given content.
     * 
     * @param {string} name Name of the cookie to set
     * @param {string} content Content of the cookie
     * @param {object} [options] Set the option "expires" to the number of days
     *  the cookie should be valid
     *
     * @public
     * @method
     * @name cookie#write
     */
    self.write = function( name, content, options ) {
        var opt = $.extend( {}, self.defaults, options );

        if( typeof content === 'undefined' || content === null ) {
            opt.expires = -1;
        }

        if( typeof opt.expires === 'number' ) {
            var days = opt.expires; 
            var t = opt.expires = new Date();
            t.setDate( t.getDate() + days );
        }

        content = String( content );

        return( document.cookie = [
            encodeURIComponent( name ), '=',
            opt.raw ? content : encodeURIComponent( content ),
            opt.expires ? '; expires=' + opt.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            opt.path ? '; path=' + opt.path : '',
            opt.domain ? '; domain=' + opt.domain : '',
            opt.secure ? '; secure' : ''
        ].join( '' ) );
    };

    return self;
})( jQuery );
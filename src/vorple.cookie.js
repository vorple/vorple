/** vorple.cookie.js - Creating, reading and deleting cookies. 
 *  
 *  Based on jquery.cookie.js (https://github.com/carhartl/jquery-cookie)
 */

( function( $ ) {
    /** @namespace Cookies */
    vorple.cookie = {};
    
    vorple.cookie.defaults = {
        expires: 365
    };
    
    
    /**
     * List all available cookies.
     * 
     * @return {String[]} An array of the names of the cookies
     */
    vorple.cookie.list = function() {
        var list = [];
        var cookies = document.cookie.split( ';' );
        
        for( var i = 0; i < cookies.lenght; ++i ) {
            list.push( cookies[ i ].split( '=' )[ 0 ] );            
        }
        
        return list;
    }
    
    
    /**
     * Read the contents of a cookie.
     * 
     * @param {String} name Name of the cookie to read
     * @param {Object} [options] 
     * 
     * @return {String|null} The contents of the cookie or null if the
     * cookie was not found.
     */
    vorple.cookie.read = function( name, options ) {
        var opt = $.extend( {}, self.defaults, options );
        var result;
        var decode = opt.raw ? function (s) { return s; } : decodeURIComponent;
        return (result = new RegExp('(?:^|; )' + encodeURIComponent( name ) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
    };
      
      
    /**
     * Remove a cookie.
     * 
     * @param {String} name Name of the cookie to remove.
     */
    vorple.cookie.remove = function( name ) {
        this.write( name, null );
    };
    
    
    /**
     * Set a cookie with given content.
     * 
     * @param {String} name Name of the cookie to set
     * @param {String} content Content of the cookie
     * @param {Object} [options]
     */
    vorple.cookie.write = function( name, content, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );

        if( content === null || content === undefined ) {
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
    
})( jQuery );
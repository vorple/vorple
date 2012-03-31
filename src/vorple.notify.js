/*  vorple.notify.js - Notifications. Based on the noty library
 *  (http://needim.github.com/noty/)  
 */

(function( $ ) {
    /** @namespace Notifications. */
    vorple.notify = {};
    
    
    /**
     * Default options
     */
    vorple.notify.defaults = {
        layout: 'bottomRight',
        timeout: 7000
    };
    
    
    /**
     * Clear the notification queue.
     * 
     * Shortcut for $.noty.clearQueue().
     */
    vorple.notify.clearQueue = function() {
        $.noty.clearQueue();
    };
    
    
    /**
     * Close the current notification.
     * 
     * Shortcut for $.noty.close().
     */
    vorple.notify.close = function() {
        $.noty.close();
    };

    
    /**
     * Close all notifications.
     * 
     * Shortcut for $.noty.closeAll().
     */
    vorple.notify.closeAll = function() {
        $.noty.closeAll();
    };
    
    
    /**
     * Show a notification using the noty library.
     *  
     * @see http://needim.github.com/noty
     * 
     * @param {string} text The text to show in the notification
     * @param {object} options Notification options. 
     * See http://needim.github.com/noty/#options for details.
     */
    vorple.notify.show = function( text, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options, { text: text } );
        
        noty( opt );
    };

})( jQuery );
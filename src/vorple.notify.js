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
    
    vorple.notify._currentNoty;
    
    
    /**
     * Show a modal dialog with a button that closes it.
     * 
     * @param {string} text The text to show in the dialog
     * @param {object} options Notification options. 
     */
    vorple.notify.alert = function( text, options ) {
    	var defaults = {
    		 buttons: [{
    			 text: 'OK', 
    			 onClick: function($noty) {
    				 $noty.close();
    			 }
    		 }],
             layout: 'center', 
             modal: true,
    		 timeout: false
    	};
    	
        var opt = $.extend( {}, defaults, options );
    	vorple.notify.show( text, opt);
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
        $.noty.close( this._currentNoty );
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
        
        self._currentNoty = noty( opt );
    };

})( jQuery );
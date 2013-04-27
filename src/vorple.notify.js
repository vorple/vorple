/*  vorple.notify.js - Notifications. Based on the noty library
 *  (http://needim.github.com/noty/)  
 */

/** @namespace notify
 * @name notify
 * @description Notifications.
 * Based on the {@see http://needim.github.com/noty/|noty library}.
 */
vorple.notify = (function($) {
    var self = this;

    /**
     * Default options
     *
     * @public
     * @field
     * @type object
     * @name notify#defaults
     */
    self.defaults = {
        layout: 'bottomRight',
        timeout: 7000
    };

    /**
     * The latest notification
     *
     * @private
     * @field
     * @name notify~_currentNoty
     */
    var _currentNoty = null;
    
    
    /**
     * Show a modal dialog with a button that closes it.
     * 
     * @param {string} text The text to show in the dialog
     * @param {object} options Notification options.
     *
     * @public
     * @method
     * @name notify#alert
     */
    self.alert = function( text, options ) {
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
        self.show( text, opt);
    };
    
    
    /**
     * Clear the notification queue.
     * 
     * Shortcut for $.noty.clearQueue().
     *
     * @public
     * @method
     * @name notify#clearQueue
     */
    self.clearQueue = function() {
        $.noty.clearQueue();
    };
    
    
    /**
     * Close the current notification.
     * 
     * Shortcut for $.noty.close().
     *
     * @public
     * @method
     * @name notify#close
     */
    self.close = function() {
        $.noty.close( this._currentNoty );
    };

    
    /**
     * Close all notifications.
     * 
     * Shortcut for $.noty.closeAll().
     *
     * @public
     * @method
     * @name notify#closeAll
     */
    self.closeAll = function() {
        $.noty.closeAll();
    };
    
    
    /**
     * Show a notification using the noty library.
     *  
     * @see http://needim.github.com/noty
     * 
     * @param {string} text The text to show in the notification
     * @param {object} options Notification options. 
     * @See http://needim.github.com/noty/#options
     *
     * @public
     * @method
     * @name notify#show
     */
    self.show = function( text, options ) {
        var opt = $.extend( {}, self.defaults, options, { text: text } );
        
        _currentNoty = noty( opt );
    };

    return self;
})( jQuery );
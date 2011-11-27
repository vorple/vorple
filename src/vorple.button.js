/**  vorple.button.js - Buttons and button groups */

(function( $ ) {
    /** @namespace Buttons and button groups 
     */
    vorple.button = {};
    
    /**
     * Default settings
     */
    vorple.button.defaults = {
        groupContainer: '<div>'
    };
    
    /**
     * Button templates
     */
    vorple.button.template = function( content, onclick, options ) {
        this.defaults = { classes: '' };
        
        this.init = function( content, onclick, options ) {
            // check if options are given as the second or the third parameter
            if( typeof options === 'object' ) {
                this.opt = $.extend( {}, this.defaults, options );
            }
            else if( typeof onclick === 'object' ) {
                this.opt = $.extend( {}, this.defaults, onclick );
            }
            else {
                this.opt = $.extend( {}, this.defaults );
            }
            
            if( typeof content !== 'undefined' ) {
                this.content = content;
            }
            else {
                this.content = '';
            }

        
            this.idClass = 'button_'+vorple.core.generateId();
            
            // add classes to the button
            this.opt.classes += ' vorpleButton basicButton ' + this.idClass;

            this.options = options;

            this.element = this.createElement( content, this.opt );
            
            
            /**
             * Attach a click event to the button
             */
            if( $.type( onclick ) === 'function' ) {
                this.onclick = onclick;
                this.createClickEvent( onclick );
            }
            else {
                this.onclick = $.noop;
            }
        };
        
        this.createClickEvent = function( onclick ) {
            var self = this;
            $( document ).delegate( '.'+this.idClass, 'click', function( event ) {
                if( self.isEnabled() ) {
                    onclick( event );
                }
            });
        };
        
        this.createElement = function( content, opt ) {
            return content;
        };
        

        /**
         * Disables the button.
         */
        this.disable = $.noop;
 
        
        /**
         * Enables the button.
         */
        this.enable = $.noop;
        
        
        /**
         * Checks whether the button is enabled or disabled.
         * @return true on enabled, false on disabled
         */
        this.isEnabled = $.noop;
           

        /**
         * Returns the HTML code for the button.
         */
        this.html = function() {
            return this.element;
        };
        
        this.init( content, onclick, options );
    };
    
    
    /**
     * Standard HTML buttons.
     * 
     * @see vorple.button.template
     */
    vorple.button.Button = function( content, onclick, options ) {
        this.createElement = function( content, options ) {
            return vorple.html.tag(
                'button',
                content,
                options
            ); 
        };

        this.disable = function() {
            $( '.'+this.idClass ).attr( 'disabled', 'disabled' );
        };
        
        this.enable = function() {
            $( '.'+this.idClass ).attr( 'disabled', '' );
        };
        
        this.isEnabled = function() {
            return $( '.'+this.idClass ).attr( 'disabled' ) !== 'disabled';
        };
        
        this.init( content, onclick, options );
    };
    vorple.button.Button.inherits( vorple.button.template );
    
    
    /**
     * Link (&lt;a&gt; tag) buttons.
     * 
     * Note that disabled link buttons can't be enabled later on. 
     * 
     * @see vorple.button.template
     */
    vorple.button.Link = function( content, onclick, options ) {
        this.defaults = {
            classes: '',
            href: '#'
        };
        
        this.createElement = function( content, options ) {
            return vorple.html.link(
                options.href,
                content,
                options
            );
        };
        
        this.disable = function() {
            $( '.'+this.idClass )
                .replaceWith( '<span class="ex_link '
                    +this.opt.classes+'">'+this.content+'</span>' );
        };
        
        this.isEnabled = function() {
            return !$( '.'+this.idClass ).hasClass( 'ex_link' );
        };
        
        this.init( content, onclick, options );
    };
    vorple.button.Link.inherits( vorple.button.template );

    
    /**
     * Image buttons.
     * 
     * Give the image's URL as the content, as with 
     * <code>vorple.media.image()</code>.
     * 
     * You can give an alternative image that is used when the button
     * is disabled as the <code>disabledImage</code> option.
     * 
     * @see vorple.button.template
     * @see vorple.media.image
     */
    vorple.button.Image = function( content, onclick, options ) {
        this.createElement = function( content, options ) {
            return vorple.media.image(
                content,
                options
            );
        };
        
        var enabled = true;
        
        this.disable = function() {
            enabled = false;
            if( 'disabledImage' in this.opt ) {
                $( '.'+this.idClass ).attr( 'src', this.opt.disabledImage );
            }
        };
        
        this.isEnabled = function() {
            return enabled;
        };
        
        this.init( content, onclick, options );
   };
    vorple.button.Image.inherits( vorple.button.template );

    
    /**
     * Button groups.
     * 
     * @param {Button|jQuery|string|Array|null} [buttons] Initial content of the group. 
     * Either a single button object, the HTML code of a button, a jQuery element,
     * or an array of buttons. Passing null or leaving the parameter out will
     * create the group as initially empty. 
     * @param {Object} [container] The container for the button
     * group. 
     * If a jQuery object is given, it will be used as is. 
     * If a string is given, an element is created with the string as its class.
     * If an object is given, an element is created using the attributes defined
     * in the object.
     * The default is <code>vorple.button.defaults.groupContainer</code> 
     * (<code>&lt;div&gt;</code>).
     */
    vorple.button.Group = function( buttons, container ) {
        var $element;
        var content = [];
        
        if( $.type( container ) === 'object' || typeof container === 'undefined' || !container ) {
            if( typeof container === 'object' && typeof container.jquery !== 'undefined' ) {
                $element = container;
            }
            else {  
                if( $.type( container ) !== 'object' ) {
                    container = { tag: 'div' };
                }
                else if( typeof container.tag === 'undefined' ) {
                    container.tag = 'div';
                }
                $element = $( vorple.html.tag( 
                        container.tag, 
                        null, 
                        container, 
                        { endTag: 'never' }  
                    ) );
            }
        } else if( $.type( container ) === 'string' ) {
            $element = $( container );
        }
        else {
            $element = $( '<div>' );
        }
        
        if( $.type( buttons ) === 'array' ) {
            content = buttons;
        }
        else if( typeof buttons !== 'undefined' && buttons ) {
            content.push( buttons );
        }
        
        function appendButton( button ) {
            if( typeof button === 'string' 
                || ( typeof button === 'object' && typeof button.jquery !== 'undefined' ) ) {
                $element.append( button );
            }
            else if( button ) {
                $element.append( button.html() );
            }
        }
        
        $.each( content, function( index, button ) {
            appendButton( button );
        });
        
        this.html = function() {
            return vorple.html.$toHtml( $element )
        };
        
        this.add = function( newButtons ) {
            var buttons;
            
            if( typeof newButtons !== 'array' ) {
                buttons = [ newButtons ];
            }
            else {
                buttons = newButtons;
            }
            
            $.each( buttons, function( index, button ) {
                var exists = false;
                if( typeof button === 'object' && 'idClass' in button ) {
                    $.each( content, function( index, oldButton ) {
                        if( typeof oldButton === 'object' && 'idClass' in oldButton && button.idClass == oldButton.idClass ) {
                            exists = true;
                        }
                    });
                }
                
                if( !exists ) {
                    content.push( button );
                    appendButton( button );
                }
            });
        };
        
        this.update = function( newButtons, preserveOrder ) {
            var buttons = [];
            
            if( preserveOrder ) {
                $.each( content, function( index, button ) {
                    if( typeof button === 'object' && 'idClass' in button ) {
                        $.each( newButtons, function( index, newButton ) {
                            if( typeof newButton === 'object' && 'idClass' in newButton && button.idClass == newButton.idClass ) {
                                buttons.push( newButton );
                            }
                        });
                    }
                });
            
                $.each( newButtons, function( index, newButton ) {
                    var buttonAdded = false;
                    if( typeof newButton === 'object' && 'idClass' in newButton ) {
                        $.each( buttons, function( index, button ) {
                            if( typeof button === 'object' && 'idClass' in button && button.idClass == newButton.idClass ) {
                                buttonAdded = true;
                            }
                        });
                    }
                    if( !buttonAdded ) {
                        buttons.push( newButton );
                    }
                });
            }
            else {
                buttons = newButtons;
            }
            
            
            if( $.type( newButtons ) !== 'array' ) {
                buttons = [ newButtons ];
            }

            content = buttons;
            $element.html( '' );
            
            $.each( buttons, function( index, button ) {
                appendButton( button );
            });            
        };
    };   
})( jQuery );

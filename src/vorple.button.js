/**  vorple.button.js - Buttons and button groups */

(function( $ ) {
    /** @namespace Buttons and button groups 
     */
    vorple.button = {};
    
    /**
     * Default settings
     */
    vorple.button.defaults = {
        groupParent: '<div>'
    };
    
    /**
     * Button templates
     */
    vorple.button.template = function( content, onclick, options ) {
        this.defaults = { classes: '' };
    };
        
    vorple.button.template.prototype.init = function( content, onclick, options ) {
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
        }
        else if( $.type( onclick )  === 'string' ) {
        	this.onclick = function( e ) {
        		vorple.undum.doClick( onclick );
        		e.preventDefault();
        	};
        }
        else {
            this.onclick = $.noop;
        }
        this.createClickEvent( this.onclick );
    };

    
    vorple.button.template.prototype.createClickEvent = function( onclick ) {
    	var self = this;
        $( document ).on( 'click', '.'+this.idClass, function( event ) {
            if( self.isEnabled() ) {
                onclick( event );
            }
        });
    };
    
    vorple.button.template.prototype.createElement = function( content, opt ) {
        return content;
    };
    

    /**
     * Disables the button.
     */
    vorple.button.template.prototype.disable = $.noop;
 
        
    /**
     * Enables the button.
     */
    vorple.button.template.prototype.enable = $.noop;
    
    
    /**
     * Checks whether the button is enabled or disabled.
     * @return true on enabled, false on disabled
     */
    vorple.button.template.prototype.isEnabled = $.noop;
       

    /**
     * Returns the HTML code for the button.
     */
    vorple.button.template.prototype.html = function() {
        return this.element;
    };
    
    
    /**
     * Standard HTML buttons.
     * 
     * @see vorple.button.template
     */
    vorple.button.Button = function( content, onclick, options ) {
    	this.init( content, onclick, options );
    };
    vorple.button.Button.inherits( vorple.button.template ); 

    vorple.button.Button.prototype.createElement = function( content, options ) {
        return vorple.html.tag(
            'button',
            content,
            options
        ); 
    };
    
    vorple.button.Button.prototype.disable = function() {
        $( '.'+this.idClass ).prop( 'disabled', true );
    };

    vorple.button.Button.prototype.enable = function() {
        $( '.'+this.idClass ).prop( 'disabled', false );
    };
    
    vorple.button.Button.prototype.isEnabled = function() {
        return !$( '.'+this.idClass ).prop( 'disabled' );
    };
    

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
    	
    	this.init( content, onclick, options );
    };
    vorple.button.Link.inherits( vorple.button.template );
       
    vorple.button.Link.prototype.createElement = function( content, options ) {
    	this.tag = vorple.html.link(
            options.href,
            content,
            options
        );
    	
    	return this.tag;
    };
    
    vorple.button.Link.prototype.disable = function() {
        $( '.'+this.idClass )
            .replaceWith( '<span class="ex_link '
                +this.opt.classes+'">'+this.content+'</span>' );
    };
    
    vorple.button.Link.prototype.enable = function() {
        $( '.'+this.idClass )
            .replaceWith( this.tag );
    };
    
    vorple.button.Link.prototype.isEnabled = function() {
        return !$( '.'+this.idClass ).hasClass( 'ex_link' );
    };
    
    
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
        this.enabled = true;
        
        this.init( content, onclick, options );
    };
    vorple.button.Image.inherits( vorple.button.template );

    vorple.button.Image.prototype.createElement = function( content, options ) {
        var tag = vorple.media.image(
            content,
            options
        );
        
        this.url = $( tag ).attr( 'src' );
        
        return tag;
    };
    
    vorple.button.Image.prototype.disable = function() {
        this.enabled = false;
        if( 'disabledImage' in this.opt ) {
            $( '.'+this.idClass ).attr( 'src', this.opt.disabledImage );
        }
    };
    
    vorple.button.Image.prototype.enable = function() {
    	this.enabled = true;
    	$( '.'+this.idClass ).attr( 'src', this.url );
    };
    
    vorple.button.Image.prototype.isEnabled = function() {
        return this.enabled;
    };
    
    
    /**
     * Button groups.
     * 
     * @param {Button|jQuery|string|Array|null} [buttons] Initial content of the group. 
     * Either a single button object, the HTML code of a button, a jQuery element,
     * or an array of buttons. Passing null or leaving the parameter out will
     * create the group as initially empty. 
     * @param {Object} [parent] The main container for the button group
     * (the parent of all buttons). 
     * If a jQuery object is given, it will be used as is. 
     * If a string is given, an element is created with the string as its class.
     * If an object is given, an element is created using the attributes defined
     * in the object.
     * The default is <code>vorple.button.defaults.groupParent</code> 
     * (<code>&lt;div&gt;</code>).
     */
    vorple.button.Group = function( buttons, parent ) {
        var $element;
        var content = [];
        
        if( $.type( parent ) === 'object' || typeof parent === 'undefined' || !parent ) {
            if( $.type( parent ) === 'object' && typeof parent.jquery !== 'undefined' ) {
                $element = parent;
            }
            else {  
                if( $.type( parent ) !== 'object' ) {
                    parent = { tag: 'div' };
                }
                else if( typeof parent.tag === 'undefined' ) {
                    parent.tag = 'div';
                }
                $element = $( vorple.html.tag( 
                        parent.tag, 
                        null, 
                        parent, 
                        { endTag: 'never' }  
                    ) );
            }
        } else if( $.type( parent ) === 'string' ) {
            $element = $( parent );
        }
        else {
            $element = $( vorple.button.defaults.groupParent );
        }
        
        if( $.type( buttons ) === 'array' ) {
            content = buttons;
        }
        else if( typeof buttons !== 'undefined' && buttons ) {
            content.push( buttons );
        }
        
        $.each( content, function( index, button ) {
            appendButton( button );
        });


        function appendButton( button ) {
            if( typeof button === 'string' 
                || ( typeof button === 'object' && typeof button.jquery !== 'undefined' ) ) {
                $element.append( button );
            }
            else if( button ) {
                $element.append( button.html() );
            }
        }
        

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

        this.contains = function( button ) {
        	return $.inArray( button, content ) > -1;
        };
        
       this.enable = function() {
        	$.each( content, function( index, button ) {        		
        		if( $.isFunction( button.enable ) ) {
        			button.enable();
        		}
        	});
        };

        this.disable = function() {
        	$.each( content, function( index, button ) {
        		if( $.isFunction( button.disable ) ) {
        			button.disable();
        		}
        	});
        };
        
        this.html = function() {
            return vorple.html.$toHtml( $element );
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

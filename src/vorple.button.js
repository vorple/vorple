/**  vorple.button.js - Buttons and button groups */

(function( $ ) {
    /** @namespace Buttons and button groups 
     */
    vorple.button = {};
    
    /**
     * Button templates.
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
        this.toString = function() {
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
        
        this.enabled = true;
        
        this.disable = function() {
            this.enabled = false;
            if( 'disabledImage' in this.opt ) {
                $( '.'+this.idClass ).attr( 'src', this.opt.disabledImage );
            }
        };
        
        this.isEnabled = function() {
            return this.enabled;
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
     * The default is vorple.button.group.defaults.container (&lt;div&gt;).
     */
    vorple.button.Group = function( buttons, container ) {
        var self = this;
        this.content = [];
        
        if( $.type( container ) === 'object' || container == undefined || !container ) {
            if( container != undefined && container.jquery != undefined ) {
                this.element = container;
            }
            else {  
                if( $.type( container ) !== 'object' ) {
                    container = { tag: 'div' };
                }
                else if( container.tag == undefined ) {
                    container.tag = 'div';
                }
                this.element = $( vorple.html.tag( 
                        container.tag, 
                        null, 
                        container, 
                        { endTag: 'never' }  
                    ) );
            }
        } else if( $.type( container ) === 'string' ) {
            this.element = $( container );
        }
        else {
            this.element = $( '<div>' );
        }
        
        if( $.type( buttons ) === 'array' ) {
            this.content = buttons;
        }
        else if( buttons !== undefined && buttons ) {
            this.content.push( buttons );
        }
        
        $.each( this.content, function( index, button ) {
            self.element.append( button.element );
        });
        
        this.html = function() {
            var html = '';
            for( var i = 0; i < this.content.length; ++i ) {
                switch( $.type( this.content[ i ] ) ) {
                    case 'object':
                        if( this.content[ i ].jquery != undefined ) {
                            html += vorple.html.$toHtml( i );
                        }
                        else if( this.content[ i ].html() != undefined ) {
                            html += this.content[ i ].html();
                        }
                        else {
                            html += this.content[ i ];  
                        }
                        break;
                    case 'string': 
                    default:
                        html += this.content[ i ];
                        break;
                }
            }
            var fullElement = this.element;
            fullElement.html( html );
            return vorple.html.$toHtml( fullElement );
        };
        
        this.update = function() {
        };
    };   
})( jQuery );

/**  vorple.button.js - Buttons and button groups */

(function( $ ) {
    /** @namespace Buttons and button groups 
     */
    vorple.button = {};
    
    /**
     * Button templates.
     */
    vorple.button.template = {
        /**
         * A standard HTML button.
         */
        Basic: function( enabledOptions, disabledOptions ) {
            this.opt = $.extend( {}, { text: null }, enabledOptions );
            this.disabledOpt = $.extend( {}, enabledOptions, disabledOptions );
            this.id = 'button_'+vorple.core.generateId();
            
            this.element = $( vorple.html.tag(
                    'button',
                    this.opt.text,   
                    this.opt
                ) ).addClass( this.id ).addClass( 'vorpleButton basicButton' );
            
            /**
             * Disables the button.
             */
            this.disable = function() {
                this.element.attr( 'disabled', 'disabled' );
            };
            
            /**
             * Enables the button.
             */
            this.enable = function() {
                this.element.attr( 'disabled', '' );
            };
            
            /**
             * Checks whether the button is enabled or disabled.
             * @return true on enabled, false on disabled
             */
            this.isEnabled = function() {
                return this.element.attr( 'disabled' ) !== 'disabled';
            };

            /**
             * Returns the HTML code for the button.
             */
            this.html = function() {
                return vorple.html.$toHtml( this.element );
            };
        },
        
        Link: function( enabledOptions, disabledOptions ) {
            this.opt = $.extend( {}, { text: '', endTag: 'always' }, enabledOptions );
            this.disabledOpt = $.extend( {}, enabledOptions, disabledOptions );
            this.id = 'button_'+vorple.core.generateId();
            this.enabled = true;
            var onclick;
            
            if( typeof this.opt.onclick !== 'undefined' ) {
                onclick = this.opt.onclick;
                delete this.opt.onclick;
            }

            this.element = $( vorple.html.tag( 
                'span', 
                vorple.html.tag(
                    'a',
                    this.opt.text,
                    {
                        href: vorple.html.url( this.opt.url ),
                        onclick: onclick
                    }
                ),
                this.opt 
            ) ).addClass( this.id ).addClass( 'vorpleButton linkButton' );
            
            this.disable = function() {
                this.element.html( this.element.children( 'a' ).html() )
                    .addClass( 'ex_link' );
                this.enabled = false;
            };
            
            this.enable = function() {
                this.element.html(
                    '<a href="'+vorple.html.url( this.opt.url )+'">'+this.opt.text+'</a>'
                ).removeClass( 'ex_link' );
                this.enabled = true;
            };
            
            this.isEnabled = function() {
                return this.enabled;
            };
            
            this.html = function() {
                return vorple.html.$toHtml( this.element );
            };
        },
        
        Image: function( enabledOptions, disabledOptions ) {
            this.opt = $.extend( {}, { src: '', endTag: 'never' }, enabledOptions );
            this.id = 'button_'+vorple.core.generateId();
            this.disabledOpt = $.extend( {}, enabledOptions, { onclick: '' }, disabledOptions );
            this.enabled = true;

            this.disable = function() {
                vorple.html.replaceAttributes( this.element, this.disabledOpt );
                this.element.addClass( this.id );
                
                this.enabled = false;
            };
            
            this.enable = function() {
                this.element = $( vorple.html.tag(
                        'img',
                        null,
                        this.opt
                    ) ).addClass( this.id ).addClass( 'vorpleButton imageButton' );
                
                this.enabled = true;
            };
            
            this.isEnabled = function() {
                return this.enabled;
            };
            
            this.html = function() {
                return vorple.html.$toHtml( this.element );
            };
            
            this.click = $.noop();
            
            this.enable();
        }
    };

    
    /**
     * A button group class.
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

/*  html.js - HTML helper functions */

/** 
 * @namespace html
 * @name html
 * @description HTML helper functions 
 */
define( 'html', [ 'jquery', 'core' ], function( $, core ) {
    "use strict";

    var self = {};

    /**
     * Default options
     *
     * @public
     * @field
     * @name html#defaults
     * @type {{allowedTagAttributes: Array, endTag: string, quotemarks: string}}
     */
    self.defaults = {
        /** 
         * Values that are interpreted as HTML attributes
         */
        allowedTagAttributes: [
                                'accesskey',
                                'abbr',
                                'align',
                                'alt',
                                'axis',
                                'border',
                                'cellpadding',
                                'cellspacing',
                                'char',
                                'charoff',
                                'class',
                                'colspan',
                                'dir',
                                'disabled',
                                'frame',
                                'headers',
                                'height',
                                'href',
                                'id',
                                'ismap',
                                'lang',
                                'longdesc',
                                'multiple',
                                'name',
                                'onblur',
                                'onclick',
                                'ondblclick',
                                'onfocus',
                                'onkeydown',
                                'onkeypress',
                                'onkeyup',
                                'onmousedown',
                                'onmouseout',
                                'onmouseover',
                                'onmouseup',
                                'rel',
                                'rev',
                                'rowspan',
                                'rules',
                                'scope',
                                'size',
                                'src',
                                'style',
                                'summary',
                                'tabindex',
                                'target',
                                'title',
                                'type',
                                'usemap',
                                'valign',
                                'value',
                                'width'
                            ],
        endTag: "auto",  // "auto", "always" or "never" 
        quotemarks: '"'
    };
    
    
    /**
     * Creates a single &lt;a&gt; tag.
     * 
     * @param {object} linkObject The link's data as an object
     * with the following keys: 
     * content (the text inside the tag),
     * url (the url where the link points at) and
     * options (tag attributes).
     * @returns {string} The created link tag.
     * @private
     * @method
     * @name html#_createLink
     */
    var _createLink = function( linkObject ) {
        var opt = $.extend( {}, { endTag: 'always' }, linkObject.options );
        opt.href = linkObject.url;

        return self.tag( 
            'a', 
            linkObject.content,
            opt
        );
    };
    
    
    /**
     * The HTML source code of a jQuery element.
     * 
     * @param {jQuery} $element The target element. If multiple elements match,
     * the first one will be chosen.
     * @returns {String} The source code of the element
     *
     * @public
     * @method
     * @name html#$toHtml
     */
    self.$toHtml = function( $element ) {
        if( typeof $element.jquery === 'undefined' ) {
            return false;
        }
        
        return $element.first().clone().wrap('<div></div>').parent().html();
    };

    
    /**
     * Creates a string of HTML element attributes given as an object.
     * The <code>class</code> attribute should be given as <code>classes</code>.
     * 
     * @example
     * vorple.html.attributes( { id: "foo", classes: "bar" } )
     *   == ' id="foo" class="bar"'
     *   
     * @example
     * vorple.html.attributes( 
     *     { id: "foo", class: "bar" },
     *     { escape: true } )
     *   == ' id=&quot;foo&quot; class=&quot;bar&quot;'
     *  
     *   
     * @param {object} attributes
     * @param {boolean} [escape=false] If true, the result will be run through
     *   {@link html#escapeHtmlChars|vorple.html.escapeHtmlChars()} before returning. The attribute 
     *   values will be escaped always, so this will double-escape values.
     * @returns {string}
     *
     * @public
     * @method
     * @name html#attributes
     */
    self.attributes = function( attributes, escape ) {
        var opt = $.extend( {}, self.defaults, attributes ),
            str = '';

        // turn "classes" into "class"
        if( typeof opt.classes !== 'undefined' ) {
            str = ' class="'+opt.classes+'"';
        }

        $.each( opt, function( index, value ) {
            // check whether the attribute is among the list of allowed
            // attributes or if it's a data-attribute. Discard anything else.
            if( $.inArray( index, opt.allowedTagAttributes ) > -1 || index.indexOf( 'data-' ) === 0 ) {
                str += ' '+index+'="'+self.escapeHtmlChars( value )+'"';
            }
        } );
        
        if( escape || opt.escape ) {
            str = self.escapeHtmlChars( str );
        }
        
        return str;
    };
    
    
    /**
     * Replaces &amp;, &lt;, &gt;, " and ' with corresponding character entity references.
     * 
     * @example
     * vorple.html.escapeHtmlChars( '&lt;div id="foo"&gt;' ) 
     *     == '&amp;lt;div id=&amp;quot;foo&amp;quot;&amp;gt;'
     *     
     * @param {string} text
     * @returns {string}
     *
     * @public
     * @method
     * @name html#escapeHtmlChars
     */
    self.escapeHtmlChars = function( text ) {
        return ( text + '' )
            .replace( /&/g, "&amp;" )
            .replace( /</g, "&lt;" )
            .replace( />/g, "&gt;" )
            .replace( /"/g, "&quot;" )
            .replace( /'/g, "&apos;" );
    };
    
    
    /**
     * Creates an &lt;a&gt; tag.
     * 
     * The url where the link points to, the content of the link and
     * the optional tag attributes can be given as separate parameters
     * or as a single object { url: ..., content: ..., options: ... }.
     * 
     * If multiple links are given as an array, a choice popup is created
     * with those options when the main link is clicked.
     * 
     * @example 
     * vorple.html.link( 'foo', 'Bar', { classes: 'baz' } )
     *     == &lt;a href="foo" class="baz"&gt;Bar&lt;/a&gt;
     *     
     * vorple.html.link({ url: 'foo', content: 'Bar', options: { classes: 'baz' })
     *     == &lt;a href="foo" class="baz"&gt;Bar&lt;/a&gt;
     *     
     * vorple.html.link(
     *     [
     *         { url: 'foo', content: 'bar' },
     *         { url: 'baz', content: 'xyzzy' }
     *     ],
     *     'popup'
     * );     
     *     
     * @param {string|object|object[]} url The url of the link,
     * or an object containing the required data,
     * or an array of links.
     * @param {string} content The content text of the link.
     * @param {object} [options] Additional attributes added to the tag.
     * 
     * @returns {string} The HTML code for the link tag.
     *
     * @public
     * @method
     * @name html#link
     */
    self.link = function( url, content, options ) {
        var opt = $.extend(
                {},
                { classes: '' },
                self.defaults, 
                options 
            );
        
        if( $.isArray( url ) ) {
            // create a popup link

            // rename the variable to fit its meaning in this case
            var links = url;
            
            var linkId = core.generateId();
            
            var $popup = $( self.tag( 
                    'ul',
                    null,
                    {
                        endTag: 'always',
                        classes: 'options linkPopup popup_'+linkId,
                        style: 'display:none; position:absolute;'
                    }
                ) 
            );
        
            $.each( links, function( index, link ) {
                $( '<li>' )
                    .append( $( self.link( link ) ) )
                    .appendTo( $popup );
            });
        
            // rig the link to show the popup on click
            $( 'body' ).on( 
                'click', 
                '.popuplink_'+linkId, 
                function( e ) {
                    e.preventDefault();
                    
                    // prevent the generic popup window hider event from
                    // hiding the popup we're just creating
                    e.stopPropagation();     

                    // hide existing popups
                    $( '.linkPopup' ).hide();
                    
                    // show the popup and position it correctly
                    $popup
                        .appendTo( 'body' )
                        .show() // must be shown before setting the coordinates,
                                // otherwise .offset() doesn't work correctly
                        .offset({ 'left': e.pageX, 'top': e.pageY });
                }
            );
            
            // have the links in the popup execute the clicks
            $( 'body' ).on(
                'click',
                '.popup_'+linkId+' a', 
                function( e ) {
                    e.preventDefault();

                    // execute the command
                    if( core.engine( 'undum' ) ) {
                        require([ 'undum' ], function( undum ) {
                            undum.doLink( $( this ).attr( 'href' ) );
                        });
                    }

                    // hide the popup
                    $( '.linkPopup' ).hide();

                    return false;
                }
            );
           
            opt.classes += 'popupLink popuplink_'+linkId;
            
            return self.link( '#', content, opt ); 
        }
        else if( typeof url === 'object' ) {
            return _createLink( url );
        }
        else {
            return _createLink({ url: url, content: content, options: opt });
        }
    };
    
    // have any click event hide the popup
    $( document ).on( 'init.vorple', function() {
        $( document ).on(
            'click',
            function() {
                $( '.linkPopup' ).hide();
            }
        );
    });
    
    
    /**
     * Shorcut for vorple.html.tag( 'p', content, options ).
     * 
     * @see html#tag
     *
     * @public
     * @method
     * @name html#p
     */
    self.p = function( content, options ) {
        return self.tag( 'p', content, options );
    };

    
    /**
     * Wraps text inside quotemarks.
     * 
     * @example vorple.html.quote( 'Hello!', ['-=', '=-'] )
     *   == '-=Hello!=-'
     * 
     * @param {String} content The content to wrap inside quotes
     * @param {String|Array} [quotemarks] The quotemarks to use. If a string
     * is given, the same string is used as both opening and closing quotes.
     * Two strings can be given as an array. The first string will be used
     * as the opening quote and the second string as the closing quote.
     * Default is vorple.html.defaults.quotemarks ("). 
     * @returns {String} 
     * 
     * @public
     * @method
     * @name html#quote
     */
    self.quote = function( content, quotemarks ) {
        var startQuote, endQuote;
        
        if( typeof quotemarks == 'undefined' ) {
            quotemarks = self.defaults.quotemarks;
        }
        
        if( typeof quotemarks == 'string' ) {
            startQuote = quotemarks;
            endQuote = quotemarks;
        }
        else {
            startQuote = quotemarks[0];
            endQuote = quotemarks[1];
        }
        
        return startQuote+content+endQuote;
    };
    
    
    /**
     * Replaces a jQuery element's attributes with the given new set.
     * 
     * @param {jQuery} $element Element to change
     * @param {object} newAttributes New set of attributes
     *
     * @public
     * @method
     * @name html#replaceAttributes
     */
    self.replaceAttributes = function( $element, newAttributes ) {
        var self = this;
        var oldAttributes = $element.get( 0 ).attributes;

      
        // remove old attributes
        for( var i = 0; i < oldAttributes.length; ++i ) {
            $element.attr( oldAttributes[ i ].name, '' );
        }
        
        // add new ones
        $.each( newAttributes, function( name, value ) {
            // change classes to class
            if( name == 'classes' ) {
                $element.attr( 'class', value );
            }
            else { 
                $element.attr( name, value );
            }
        } );
    };
    
    
    /**
     * Creates an HTML tag with the given content. If content is not given
     * (or it is false/null), the tag is closed with '/ >'.
     * 
     * <!-- Note that the examples are escaped so that the API will
     *  render them correctly. Look in the API for the actual output. --> 
     * 
     * @example
     * vorple.html.tag( 'div', 'foo' ) 
     *   == '&lt;div&gt;foo&lt;/div&gt;'
     *   
     * @example
     * vorple.html.tag( 'div', 'foo', { id: 'bar' } );
     *   == '&lt;div id="bar"&gt;foo&lt;/div&gt;'
     * 
     * @param {String} name Tag name 
     * @param {String|bool|null} [content] Content to be wrapped in the tag
     * @param {Object} [options]
     *  - endTag (default "auto"): "auto", "always" or "never".
     *    If "auto", the end tag is added only if there is content, 
     *    otherwise the tag is closed with '/ >'.
     *    If "always", the end tag is always added.
     *    If "never", only the start tag is given.
     *
     * @public
     * @method
     * @name html#tag
     */
    self.tag = function( name, content, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );
        
        var startTag = '<'+name+self.attributes( opt );
        var endTag;
        
        if( opt.endTag == "always" || ( opt.endTag == "auto" && typeof content === 'string' ) ) {
            // convert null etc to an empty string
            if( typeof content !== 'string' && !content ) {
                content = '';
            }

            endTag = '>'+content+'</'+name+'>';
        }
        else {
            if( content ) {
                endTag = '>'+content;
            }
            else {
                if( opt.endTag == "auto" ) {
                    endTag = ' />';
                }
                else {
                    endTag = '>';
                }
            }
        }
        
        return startTag + endTag;
    };
    
    
    /**
     * Returns the filename appended to the path name unless the filename is
     * an URL or it's relative to the root (starts with a slash), in which case
     * the filename parameter is returned as is and the path is ignored.
     * 
     * If both the filename and the path are empty or null, a hash (#) is returned.
     * 
     * @example
     * var url = vorple.html.url( 'img.jpg', '/path/to' ); 
     * // url == '/path/to/img.jpg'
     * @example
     * var url = vorple.html.url( 'images/img.jpg', '/path/to' ); 
     * // == '/path/to/images/img.jpg'
     * @example
     * var url = vorple.html.url( 'http://example.com/img.jpg', '/path/to' ); 
     * // url == 'http://example.com/img.jpg' 
     * @example
     * var url = vorple.html.url( '/images/img.jpg', '/path/to' ); 
     * // url == '/images/img.jpg'
     * 
     * @param {string} [filename]
     * @param {string} [path] Default path to the file, no trailing slash
     * @returns {string}
     *
     * @public
     * @method
     * @name html#url
     */
    self.url = function( filename, path ) {
        // if both filename and path are empty, return '#'
        if( ( typeof filename === 'undefined' || !filename ) ) {
            if( path ) {
                return path;
            }
            return '#';
        }
        
        // if a relative url has been given, add the path to the actual url
        if( typeof path == 'undefined'
                || !path
                || filename.match( /^[a-zA-Z]*:\/\// ) 
                || filename.indexOf( "/" ) === 0  
                || filename.indexOf( "." ) === 0 ) {
            return filename;
        }
        else {
            return path+'/'+filename;
        }
    };

    return self;
});


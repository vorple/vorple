/* vorple.undum.js - Undum functions and compatibility */

/**
 * @namespace undum
 * @name undum
 * @description Undum-specific features
 */
vorple.undum = (function($) {
    var self = this;
    var _disposedLinks = [];

    /**
     * Default options (only for disposable links for now)
     *
     * @public
     * @field
     * @name undum#defaults
     */
    self.defaults = {
        allDisposable: false,
        disposableLinks: [],
        disposableExceptions: []
    };
    
    /**
     * Things that should be done after the turn's text content has been printed.
     *
     * @private
     * @method
     * @name undum~_afterTurnTasks
     */
    var _afterTurnTasks = function( character, system, oldSituationId, newSituationId ) {
        // Check if this link should be disposed.
        // If the allDisposable setting is set, check if the link is in
        // the exception list. If not, dispose of the link.
        // Otherwise check the disposable list and dispose if found there.
        if( self.settings.allDisposable ) {
            if( $.inArray( newSituationId, self.defaults.disposableExceptions ) == -1 ) {
                self.dispose( newSituationId );
            }
        }
        else {
            if( $.inArray( newSituationId, self.defaults.disposableLinks ) > -1 ) {
                self.dispose( newSituationId );
            }
        }
        
        // disable all disposed links
        $.each( undum.game._disposedLinks, function( index, href ) {
            _removeDisposed( href );
        });
        
        // enforce unique links
        _enforceUnique();
    };

    /**
     * Removes duplicates of unique links from the page.
     *
     * @private
     * @method
     * @name undum~_enforceUnique
     */
    var _enforceUnique = function() {
        $( '#content' ).find( 'a' ).each( function( index, element ) {
            var a = $( element );
            var href = a.attr( 'href' );
            
            var firstUniqueFound = false;
    
            if( a.hasClass( 'unique' ) ) {
                $( '#content a[href="'+href+'"]' ).each( function( copyIndex, copyElement ) {
                    var copy = $( copyElement );
    
                    // We'll ignore the first unique link we find and remove the others.
                    if( copy.hasClass( 'unique' ) && !firstUniqueFound ) {
                        firstUniqueFound = true;
                    }
                    else {
                        copy.replaceWith( $( "<span>" ).html( copy.html() ) );
                    }
                } );
            }
        } );
    };

    
    /**
     * Removes all disposed links from the page.
     *
     * @private
     * @method
     * @name undum~_removeDisposed
     */
    _removeDisposed = function( href ) {
        // taken from Undum's System.prototype.clearLinks()
        $("a[href$='" + href + "'], a[href='" + href + "']" ).each(function(index, element) {
            var a = $(element);
            a.replaceWith($("<span>").addClass("ex_link").html(a.html()));
        });
    };
   

    /**
     * Make sure Vorple-specific functions are run after every action.
     *
     * @public
     * @method
     * @name undum#afterActionTrigger
     */
    self.afterActionTrigger = function( character, system, situationId, actionId ) {
        _afterTurnTasks( character, system, situationId, actionId );
        return false;
    };


    /**
     * The same as vorple.undum.afterActionTrigger() but for situations.
     *
     * @public
     * @method
     * @name undum#afterEnterTrigger
     */
    self.afterEnterTrigger = function( character, system, oldSituationId, newSituationId ) {
        _afterTurnTasks( character, system, oldSituationId, newSituationId );
        return false;
    };
    
    
    /**
     * Mark a link disposed so that it will be disabled in the future.
     * Multiple links can be given, either as an array of strings or as
     * multiple string parameters.
     * 
     * @param {...String|String[]} name Name of the link to dispose
     *
     * @public
     * @method
     * @name undum#dispose
     */
    self.dispose = function() {
        $.each( arguments, function( index, name ) {
            if( $.isArray( name ) ) {
                $.each( name, function( index, element ) {
                    self.dispose( element );
                });
                return;
            }
            
            if( !self.isDisposed( name ) ) {
                // strip ./ from the name
                var parts = name.split( '/' );
                
                // add the link's name to the undum.game array
                _disposedLinks.push( parts[ parts.length - 1 ] );
                
                // remove currently displayed links
                _removeDisposed( name );
            }
        });
    };
    

    /**
     * Exposure of undum.doClick() for when the undum engine object
     * isn't available.
     *
     * @param {string} url
     *
     * @public
     * @method
     * @name undum#doClick
     */
    self.doClick = function( url ) {
    	vorple.core.getEngine().doClick( url );
    };


    /**
     * Exposure of undum.doClick() for when the undum engine object
     * isn't available.
     *
     * @param {string} url
     *
     * @public
     * @method
     * @name undum#doLink
     */
    self.doLink = function( url ) {
    	vorple.core.getEngine().doLink( url );
    };


    /**
     * Checks whether a link has been disposed of.
     *
     * @param {string} name Name of the link to check
     * @returns {boolean} true if link has been disposed of, false otherwise
     *
     * @public
     * @method
     * @name undim#isDisposed
     */    
    self.isDisposed = function( name ) {
		return( $.inArray( name, _disposedLinks ) > -1 );
    };


    /**
     * Removes a link from the list of disposed links.
     *  
     * This will affect only future links, 
     * already disabled links will not be re-enabled.
     * 
     * @param {String} name Name of the link to activate
     *
     * @public
     * @method
     * @name undum#reactivate
     */
    self.reactivate = function( name ) {
        $.each( arguments, function( index, name ) {
            if( $.isArray( name ) ) {
                $.each( name, function( index, element ) {
                    self.reactivate( element );
                });
                return;
            }
            
            // strip ./ from the name
            var parts = name.split( '/' );
            var position = $.inArray( parts[ parts.length - 1 ], _disposedLinks );
            if( position > -1 ) {
                _disposedLinks.splice( position, 1 );
            }
        });
    };

    
    // initialization
    $( document ).on( 'init.vorple', function() {
        if( vorple.core.engine( 'undum' ) ) {
            var undum = vorple.core.getEngine();
            // Undum hooks
            if( !undum.afterEnter ) {
                undum.afterEnter = function( character, system, oldSituationId, newSituationId ) {
                    return self.afterEnterTrigger( character, system, oldSituationId, newSituationId );
                };
            }
            
            if( !undum.afterAction ) {
                undum.afterAction = function( character, system, situationId, actionId ) {
                    return self.afterActionTrigger( character, system, situationId, actionId );
                };
            }
        }
    });

    return self;
})( jQuery );
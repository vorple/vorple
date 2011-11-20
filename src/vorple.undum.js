/* vorple.undum.js - Undum functions and compatibility */

( function( $ ) {
    /** @namespace Undum-specific features */
    vorple.undum = {};

    /**
     * Settings for disposable links.
     */
    vorple.undum.settings = {
        allDisposable: false,
        disposableLinks: [],
        disposableExceptions: []
    };
    
    /**
     * Things that should be done after the turn's text content has been printed.
     *
     * @private
     */
    vorple.undum._afterTurnTasks = function( character, system, oldSituationId, newSituationId ) {
        var self = this;
    
        // Check if this link should be disposed.
        // If the allDisposable setting is set, check if the link is in
        // the exception list. If not, dispose of the link.
        // Otherwise check the disposable list and dispose if found there.
        if( self.settings.allDisposable ) {
            if( $.inArray( newSituationId, self.settings.disposableExceptions ) == -1 ) {
                self.dispose( newSituationId );
            }
        }
        else {
            if( $.inArray( newSituationId, self.settings.disposableLinks ) > -1 ) {
                self.dispose( newSituationId );
            }
        }
        
        // disable all disposed links
        $.each( undum.game._disposedLinks, function( index, href ) {
            self._removeDisposed( href );
        });
        
        // enforce unique links
        self._enforceUnique();
    };


    /**
     * Removes duplicates of unique links from the page.
     *
     * @private
     */
    vorple.undum._enforceUnique = function() {
        var visibleLinks = [];

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
     */
    vorple.undum._removeDisposed = function( href ) {
        // taken from Undum's System.prototype.clearLinks()
        $("a[href$='" + href + "'], a[href='" + href + "']" ).each(function(index, element) {
            var a = $(element);
            a.replaceWith($("<span>").addClass("ex_link").html(a.html()));
        });
    };
   

    /**
     * Make sure Vorple-specific functions are run after every action.
     */
    vorple.undum.afterActionTrigger = function( character, system, situationId, actionId ) {
        this._afterTurnTasks( character, system, situationId, actionId );
        return false;
    };


    /**
     * The same as vorple.undum.afterActionTrigger() but for situations.
     */
    vorple.undum.afterEnterTrigger = function( character, system, oldSituationId, newSituationId ) {
        this._afterTurnTasks( character, system, oldSituationId, newSituationId );
        return false;
    };
    
    
    /**
     * Mark a link disposed so that it will be disabled in the future.
     * Multiple links can be given, either as 
     * 
     * @param {...String|String[]} name Name of the link to dispose
     */
    vorple.undum.dispose = function() {
        var self = this;
        
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
                undum.game._disposedLinks.push( parts[ parts.length - 1 ] );
                
                // remove currently displayed links
                self._removeDisposed( name );
            }
        });
    };


    /**
     * Checks whether a link has been disposed of.
     *
     * @param {String} name Name of the link to check
     * @return {Boolean} True if link has been disposed of, false otherwise
     */    
    vorple.undum.isDisposed = function( name ) {
		return( $.inArray( name, undum.game._disposedLinks ) > -1 );
    };


    /**
     * Removes a link from the list of disposed links.
     *  
     * This will affect only future links, 
     * already disabled links will not be re-enabled.
     * 
     * @param {String} name Name of the link to activate
     */
    vorple.undum.reactivate = function() {
        var self = this;
        
        $.each( arguments, function( index, name ) {
            if( $.isArray( name ) ) {
                $.each( name, function( index, element ) {
                    self.reactivate( element );
                });
                return;
            }
            
            // strip ./ from the name
            var parts = name.split( '/' );
            var position = $.inArray( parts[ parts.length - 1 ], undum.game._disposedLinks );
            if( position > -1 ) {
                undum.game._disposedLinks.splice( position, 1 );
            }
        });
    };

    
    // initialization
    $( document ).bind( 'vorpleInit', function() {
        if( vorple.core.engine( 'undum' ) ) {
            // Undum hooks
            if( !undum.game.afterEnter ) {
                undum.game.afterEnter = function( character, system, oldSituationId, newSituationId ) {
                    return vorple.undum.afterEnterTrigger( character, system, oldSituationId, newSituationId );
                };
            }
            
            if( !undum.game.afterAction ) {
                undum.game.afterAction = function( character, system, situationId, actionId ) {
                    return vorple.undum.afterActionTrigger( character, system, situationId, actionId );
                };
            }
    
            // Container for disposed links
            if( typeof undum.game._disposedLinks === 'undefined' ) {
                undum.game._disposedLinks = [];
            }
        }
    } );
    
})( jQuery );
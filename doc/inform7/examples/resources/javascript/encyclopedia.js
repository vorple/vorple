/**
 * This is a custom JavaScript file used by examples in the Vorple extensions.
 */

/*
 * Vorple: The Sum of Human Knowledge
 */

function wikipedia_query( topic ) {
    $.getJSON(
        'http://en.wikipedia.org/w/api.php?callback=?',
        {
            action: 'query',
            titles: topic,
            format: 'json',
            prop: 'revisions',
            rvprop: 'content',
            rvparse: '1',
            redirects: '1' 
        },
        function( data ) {
            var $dictEntry = $( '.dictionary-entry:last' );
            try {
                // get the page info (we don't know its key so it can't be referenced directly)
                for( var id in data.query.pages ) {
                    var $article = $( '<div>'+data.query.pages[ id ].revisions[ 0 ]['*']+'</div>' );
                    
                    // get the first paragraph
                    var $para = $article.children( 'p' ).first();

                    // try to detect if it's a disambiguation page; if so,
                    // show the entire page.
                    if( $para.text().indexOf( 'may refer to' ) !== -1 ) {
                        $article.find( 'table' ).remove();
                        $para = $article;
                    }

                    $para.find( 'a' ).each( function() {
                        var $this = $( this );
                        var href = $this.attr( 'href' );
                        
                        // remove citation links
                        if( /\[\d*\]/.test( $this.text() ) ) {
                            $this.remove();
                        }
                        // unlink references to the same page and Wikipedia info pages
                        else if( href.indexOf( '#' ) === 0 || /^\/wiki\/(.*)\:/.test( href ) ) {
                            $this.replaceWith( '<span>'+$this.html()+'</span>' );
                        }
                        // internal Wikipedia links trigger a new search inside the story
                        else if( href.indexOf( '/wiki/' ) === 0 ) {
                            $this.on( 'click', function( e ) {
                                vorple.parser.sendCommand( 'look up ' + decodeURI( href.substr( 6 ).replace( /\_/g, ' ' ) ) );
                                e.preventDefault(); 
                            });
                        }
                        // external links open in new window
                        else {
                            $this.attr( 'target', '_blank' );
                        }
                    });
                    
                    // remove edit links
                    $para.find( '.editsection' ).remove();

                    $( '.dictionary-entry:last' ).append( $para );
                    break;
                }
            }
            catch( e ) {
                // An error is to be expected when there are no search results
                $dictEntry.html( 'You find nothing about that topic.' );
            }
        }
    );
}


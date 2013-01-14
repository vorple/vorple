/* vorple.parser.js - Parser-specific features */

(function($) {
    /** @namespace Parser-specific features */
    vorple.parser = {
        _commandqueue: [],
        _container: {
            parchment: null,
            vorple: "#vorple"
        },
        _evalqueue: [],
        _filters: {},
        _interactive: false, // true: waiting for reader action
        _skipFilters: false,
        _scrollPosition: 0,
        _turn: {
            commandVisible: true,
            mode: 'line',
            outputVisible: true,
            type: 'normal'
        }
    };
    
    vorple.parser._createPrompt = function( promptText ) {
    	return $( '<span>'+promptText+'</span>' )
    		.addClass( 'vorplePrompt' )
    		.append( '<input type="text" />' );
    };
    
    vorple.parser._evaluateQueue = function() {
        $.each( vorple.parser._evalqueue, function( index, value ) {
            try {
                value();
            }
            catch( e ) {
                if( console && console.log ) {
                    console.log( 'Invalid JavaScript: '+value );
                }
            }
        });
        
        vorple.parser._evalqueue = [];
    };
    
    vorple.parser._getTurnStructure = function( mode, $buffer ) {
        var structure = {};
        
        // Don't mess with the original
        var $contents = $buffer.clone();

        // The first span contains the command given to the parser.
        // The command ends in the first <br>.
        var $firstSpan = $( 'span:first', $contents );
        var $previousCommand = $firstSpan
            .contents() // its contents including text nodes,
            .first();   // and the first node of the contents
        structure.previousCommand = $previousCommand.text();

        // if the previous command node is a <br>,
        // it means the command itself was empty
        // and the `<br>` is already removed.
        // Otherwise there's still the `<br>` to remove.
        if( !$previousCommand.is( 'br' ) ) {
            $( 'br:first', $firstSpan ).remove();
        }
    
        $previousCommand.remove();


        if( mode == 'line' ) {
            // The last span contains the new prompt.
            var $parchmentPromptContainer = $( 'span:last', $contents );
            
            // The prompt is the first text node
            structure.prompt = $parchmentPromptContainer.contents().filter(function() {
                  return this.nodeType == 3;
            }).first().text();
            
            // In some cases (parser errors etc) there's a <br> inside
            // the last span. We need to move that out of there so that
            // it won't get deleted when we remove the original prompt line.
            $( 'br', $parchmentPromptContainer ).appendTo( $parchmentPromptContainer.prev() );
    
            // Remove the prompt line so that $contents contains
            // only the turn text now
            $parchmentPromptContainer.remove();
        }
        else {
            structure.prompt = '';
        }
        
        structure.$turn = $contents;
        
        return structure;
    };

    vorple.parser._metaTurnFilters = function( turn, metadata ) {
    	if( !turn ) {
    		return false;
    	}
    	
        switch( metadata.turn.type ) {
            case 'error':
            	turn.classes += "parserError ";
            	turn.previousCommand.classes += "parserError ";
            	turn.content.classes += "transient ";
            	turn.meta = true;
            	break;
            case 'undo':
            	// TODO
            	/*
                $( '.previousTurn .content' ).animate({opacity: 0}, 1500).slideUp(500);
                $( '.previousTurn' ).addClass( 'undoneTurn' ).removeClass( 'normalTurn' );
                $( '<span>' ).text( ' (undone)' ).addClass( 'undoClarification' ).appendTo( $( '.previousTurn .oldPrompt' ) );
//              $( '.previousTurn', this.container.vorple ).prev().nextAll().not( $element ).animate({opacity: 0}, 1500).slideUp(500);
                $element.addClass( 'undoMessage' ).addClass( 'transient' );
                $( '.previousTurn' ).removeClass( 'previousTurn' ).prevAll( '.normalTurn' ).first().addClass( 'previousTurn' );
                $( '.penultimateTurn' ).removeClass( 'penultimateTurn' ).prevAll( '.normalTurn' ).first().addClass( 'penultimateTurn' );
                $( '.currentPrompt' ).empty();
//              return false;
*/
            	break;
            case 'meta':
            	vorple.notify.show( turn.content.text );
                return false;
                break;
            case 'dialog':
            	vorple.notify.show(
            		turn.content.text,
        			{
                        buttons: [{ 
                            type: 'button', 
                            text: 'ok', 
                            click: function( $notification ) {
                                $notification.close();
                            }
                        }],
                        closeButton: true,
                        layout: 'center',
                        modal: true,
                        timeout: false 
        			});
                return false;
                break;
            default:
            	break;
        }
        
        return turn;
    };
    
    
    /**
     * Run a command from the queue and remove it from the queue.
     * 
     * @return false if the queue was already empty, true otherwise
     * @private
     */
    vorple.parser._runCommandQueue = function( command, options ) {
        var self = this;

        if( self._commandqueue.length === 0 ) {
            return false;
        }
        
        var cmd = self._commandqueue[ 0 ];
        var opt = $.extend( { hideCommand: false, hideOutput: false, skipFilters: false }, cmd.options );
        var $input = $( 'input.TextInput' );
        var oldCommand = $input.val();

        // remove the first command (which will be executed now)
        self._commandqueue.shift();
        
        // raise a flag that makes the output from the command not show
        if( opt.hideOutput ) {
            self.hideOutput();
        }

        if( opt.hideCommand ) {
            self.hideCommand();

            // return the previous content to the prompt if the sent command
            // should be silent
            $( document ).one( 'TurnComplete', function() {
                $( '.TextInput' ).val( oldCommand );
            });
        }
        
        if( opt.skipFilters ) {
            self._skipFilters = true;
        }

        vorple.parser._interactive = false;
        
        // send the command to the engine by triggering an enter keypress
        $input
            .val( cmd.command )
            .trigger( $.Event( 'keydown', { which: 13 } ) ); // enter
            
        self._skipFilters = false;
        
        return true; 
    }
    
    
    vorple.parser._runFilters = function( content, type, metadata ) {
        if( this._skipFilters ) {
            return content;
        }
        
        var result = content;
        
        // make a deep copy of the filters
        var filters = $.extend( {}, vorple.parser._filters );
        
        // cache the number of filters in case some filter changes the
        // filter registry
        var numberOfFilters = 0;

        // count the number of filters
        for( key in filters ) {
            if( filters.hasOwnProperty( key ) ) {
                numberOfFilters++;
            }
        }
        
        // loop through all filters, executing them in priority order 
        for( var i = 0; i < numberOfFilters; ++i ) {
            var highestPriority = undefined;
            $.each( filters, function( name, filter ) {
                if( filter.type === type && ( highestPriority === undefined || highestPriority.priority < filter.priority ) ) {
                    highestPriority = filter;
                }
            });
            
            if( highestPriority !== undefined ) {
                result = highestPriority.filter( result, metadata );
                delete filters[ highestPriority.name ];
            }
        }
        
        return result;
    };
    
    
    
    /**
     * Hides the current turn's command at the end of turn.
     * 
     * @param {boolean} [hide=true] Set to false to undo a previous
     * call to this method.
     */
    vorple.parser.hideCommand = function( hide ) {
        if( typeof hide === 'undefined' ) {
            hide = true;
        }
        
        this._turn.commandVisible = !hide;
    };
    

    /**
     * Sets the current turn silent, i.e. its output will be hidden.
     * 
     * @param {boolean} [silent=true] Set to false to undo a previous
     * call to this method.
     */
    vorple.parser.hideOutput = function( silent ) {
        if( typeof silent === 'undefined' ) {
            silent = true;
        }
        
        this._turn.outputVisible = !silent;
    };
    
    
    /**
     * Registers a new output or input filter. 
     * 
     * @param {function} filter The filter function. The function is called
     *   with two parameters, the first containing the text passing through 
     *   the filter (story output or reader input) and the second is an object 
     *   containing various meta information.
     * @param {object} options Options.
     * name (string): the name of the filter. Filters must have unique names;
     *   if a new filter is registered with the same name as an existing one,
     *   the old filter is replaced. If no name is provided a random
     *   name is generated.
     * priority (int): the order in which the filters are executed.
     *   Filters with higher priority are executed first. Default is 0.
     *   Negative priorities are allowed.
     * type (string): either "input" or "output" (default is "output").
     * 
     * @return {object} The created filter object: 
     * { filter: (function), name: (string), priority: (int) } 
     */
    vorple.parser.registerFilter = function( filter, options ) {
    	var self = this;
    	var opt = $.extend( { priority: 0, name: 'filter_'+vorple.core.generateId(), type: 'output' }, options );
    	
    	this._filters[ opt.name ] = {
    			filter: filter,
    			name: opt.name,
    			priority: opt.priority,
    			type: opt.type
    	};
    	
    	return this._filters[ opt.name ];
    };
    
    
    vorple.parser.scrollTo = function( target ) {
    	var scrollTo;
    	var bottom = $( document ).height() - $( window ).height();
    	
    	switch( target ) {
    		case 'bottom':
    			scrollTo = bottom;
    			break;
    		case 'top':
    			scrollTo = 0;
    			break;
    		default:
    			if( typeof target === 'object' && target.jquery ) {
    				scrollTo = target.offset().top;
    			}
    			else {
    				scrollTo = target;
    			}
    			break;
    	}

    	// make sure the scrolling is smooth when the target is
    	// farther than what the page's actual length is
    	if( scrollTo > bottom ) {
    		scrollTo = bottom;
    	}

        $('html, body').animate({ scrollTop: scrollTo }, 150 );
    }; 
    
    
    /**
     * Sends a command to the parser.
     * 
     * @param {string} command The command to send
     * @param {object} options Options as an object.
     */
    vorple.parser.sendCommand = function( command, options ) {
        var self = this;
        
        // put the command to the queue
        vorple.parser._commandqueue.push({ 
            command: command,
            options: options
        });
        
        // resolve the queue if the story is waiting for input
        if( vorple.parser._interactive ) {
            vorple.parser._runCommandQueue();
        }
    };
   
    
    /**
     * Sends a command to the parser behind the scenes without showing
     * either the command or the result to the reader. A shortcut for 
     * this.sendCommand( command, { hideCommand: true, hideOutput: true, skipFilters: true } );
     * 
     * @param {string} command The command to send
     */
    vorple.parser.sendSilentCommand = function( command ) {
    	this.sendCommand( command, { hideCommand: true, hideOutput: true, skipFilters: true } );
    };
    
    
    /**
     * Sets the current turn's type
     * 
     * @param {string} type
     */
    vorple.parser.setTurnType = function( type ) {
        this._turn.type = type;
    };
    
    
    /**
     * Unregisters (removes) a filter.
     * 
     * @param {string} name The name of the filter to remove
     */
    vorple.parser.unregisterFilter = function( name ) {
    	var self = this;
    	
    	delete this._filters[ name ];
    };
    
    
    /** Initialization */
    $( document ).on( 'init.vorple', function( e ) { 
        if( vorple.core.engine( 'parchment' ) ) {
            vorple.parser._container.parchment = vorple.core.system.options.container;
            
            vorple.parser.registerFilter( vorple.parser._metaTurnFilters, { type: 'output', name: 'meta-turn filters' } );
            
            // rig the links
            $( document ).on( 
                'click.vorple', 
                'a.command', 
                function( e ) {
                    e.preventDefault();
                    var command = $( this ).attr( 'href' );
                    var options = { hideCommand: $( this ).hasClass( 'hideCommand' ), hideOutput: $( this ).hasClass( 'hideResponse' ) };
                    vorple.parser.sendCommand( command, options );
                    return false;
                }
            );
            
            // Set Vorple's own text input to pass the data to
            // Parchment's text input, after we've run
            // it through our own filters
            $( document ).on(
            	'keydown.vorple',
            	'.vorplePrompt input',
            	function( e ) {
            		if( e.which !== 13 ) { // enter
            			return;
            		}
            		
            		e.preventDefault();
            		
            		var command = vorple.parser._runFilters(
            			$( this ).val(),
        				'input'
    				);
            		
            		vorple.parser.sendCommand( command );
            		return false;
            	}
            );
            
            // Disable Parchment's own event handlers 
            // and replace with our own
            $( document ).off( '.TextInput' );
            
            // This is directly from Parchment (structio/input.js)
            $( document ).on( 'click.vorple keydown.vorple', function( e ) {
            	var input = $( '.vorplePrompt input' );
            	
				// Only intercept on things that aren't inputs and if the user isn't selecting text
				if ( e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'A' && ( window.getSelection() ||
						( document.selection ? document.selection.createRange().text : '' ) == '' ) )
				{
					// If the input box is close to the viewport then focus it
					if ( $( window ).scrollTop() + $( window ).height() - input.offset().top > -60 )
					{
						vorple.parser.scrollTo( 'bottom' );
						// Manually reset the target incase focus/trigger don't - we don't want the trigger to recurse
						e.target = input[0];
						input.focus()
							.trigger( e );
						// Stop propagating after re-triggering it, so that the trigger will work for all keys
						e.stopPropagation();
					}
					// Intercept the backspace key if not
					else if ( e.type == 'keydown' && e.which == 8 )
					{
						return false;
					}
					
					if( vorple.parser._turn.mode === 'char' ) {
                        $( 'input.TextInput' ).trigger( $.Event( 'keypress', { which: e.which } ) );
                        vorple.parser._interactive = false;
					}
				}
			});
    	
    	/*
    	   // DEBUG			
            $( document ).bind( 'TextInput.vorple', function( e ) {
                console.log( e );
            });                

           // DEBUG         
            $( document ).bind( 'TurnComplete.vorple', function( e ) {
                console.log( e );
            });                
            */
            
            // Events happening right after text input
            $( document ).on( 'TextInput.vorple', function( e ) {
                $( '.transient', vorple.parser._container.vorple ).
                    animate({opacity: 0}, 1500).
                    slideUp(500, function() {
                        $(this).remove();
                });
                
                // Reset the turn type to normal
                vorple.parser.setTurnType( 'normal' );
            });
            
            $( document ).one( 'TurnComplete.vorple', function() {
                $( '#vorpleLoader' ).slideUp(); 
            });
            
            // Parchment triggers a TurnComplete event when all the turn's
            // content has printed and the story waits for reader input.
            // At that point we can take what's in the buffer and
            // do all the Vorple stuff with it.
            $( document ).on( 'TurnComplete.vorple', function( e ) {
                var $buffer = $( ".main", vorple.parser._container.parchment );
                var $target = $( vorple.parser._container.vorple );
                
                
                /* Split the buffer contents into actual content, prompt,
                 * old command and status line.
                 *
                 * The structure is:
                 * 
                 * <span>[old command]<br>[content]</span><span><br>[prompt]<input class="TextInput"></span>
                 */
                
                var structure = vorple.parser._getTurnStructure( e.mode, $buffer );
                
                
                // Run the contents through filters
                var filteredContents = vorple.parser._runFilters(
                	{
                		previousCommand: {
                			text: structure.previousCommand,
                			classes: ""
                		},
                		content: {
                			text: structure.$turn.html(),
                			classes: ""
                		},
                		prompt: {
                			text: structure.prompt,
                			val: "",
                			classes: ""
                		},
                		meta: false,
                		classes: "",
                		mode: e.mode
                	},
                	'output',
            		{
            			turn: vorple.parser._turn
            		} 
                );
                
                // If the filter returned false (or not an object),
                // do nothing except cleanup
                if( typeof filteredContents !== 'object' || 
                		( !vorple.parser._turn.commandVisible && !vorple.parser._turn.outputVisible ) 
                ) {
                    $( 'input', $buffer ).appendTo( 'body' ).hide();
                	$buffer.empty();
                	$( '.vorplePrompt input' ).val( '' );

                    // reset hidden commands/output
                    vorple.parser.hideCommand( false );
                    vorple.parser.hideOutput( false );
                    
                    // run the code in the queue
                    vorple.parser._evaluateQueue();
  
                    vorple.parser._turn.mode = e.mode;
                                  
                	return false;
                }

                if( vorple.parser._turn.outputVisible ) {
	                // Replace the contents with filtered text
	                structure.$turn
	                	.html( filteredContents.content.text )
	                	.addClass( filteredContents.content.classes );
	                
	                // Now we can display the results.
	
	                // Put the turn contents into a container
	                var $newTurn = $( '<div></div>' ).append( structure.$turn );

                }
                
                var promptContents = filteredContents.prompt.val;
                
                if( vorple.parser._turn.commandVisible ) {
	                // Replace the old prompt with the previous command text.
	                $( '.vorplePrompt input', $target ).replaceWith( 
	            		$( '<span></span>' )
	            			.addClass( 'previousCommand' )
	            			.addClass( filteredContents.previousCommand.classes )
	            			.html( filteredContents.previousCommand.text )
					);
                }
                else {
                    promptContents = $( '.vorplePrompt input', $target ).val();
                    $( '.vorplePrompt:last', $target ).remove();
                }
                
                // Set the new turn's classes
                $newTurn
                	.addClass( 'turnContent' )
                	.addClass( filteredContents.turnClasses );

                // Wrap it all into a div
                $newTurnContainer = $( '<div></div>' )
                	.addClass( 'turn' )
	            	.addClass( filteredContents.classes )
	            	.append( $newTurn );

                // Remove the previous turn class from the old content
                if( !filteredContents.meta && e.mode == 'line' ) {
	                $( '.penultimateTurn' ).removeClass( 'penultimateTurn' );
	                $( '.previousTurn' ).addClass( 'penultimateTurn' ).removeClass( 'previousTurn' ).addClass( 'previousTurnFader' ).removeClass( 'previousTurnFader', 1000 );
	                $newTurnContainer.addClass( 'previousTurn' );
                }

                // Insert Vorple's own prompt input
                $( vorple.parser._createPrompt( filteredContents.prompt.text ) )
                	.addClass( filteredContents.prompt.classes )
                	.appendTo( $newTurnContainer )
                	.find( 'input' )
                	.val( promptContents );
                
                // Display to the reader
                $newTurnContainer.appendTo( $target );
                
                // Run the story-specified JS in the queue
                vorple.parser._evaluateQueue();
                
                /*
                 * Cleanup
                 */
                
                // We need to save Parchment's own prompt so that it won't
                // get destroyed.
                $( 'input', $buffer ).appendTo( 'body' ).hide();
                
                // Clear the buffer
                $buffer.empty();
                
                // Insert a fake command for the next turn if there will
                // not be one (char input)
                if( e.mode === 'char' ) {
                    $( '<span><br></span>' ).appendTo( $buffer );
                }

                // reset hidden commands/output
                vorple.parser.hideCommand( false );
                vorple.parser.hideOutput( false );
                
                
                // Scroll to where the new turn begins
                vorple.parser.scrollTo( $newTurn );
  
                vorple.parser._turn.mode = e.mode;
                vorple.parser._interactive = true;
                vorple.parser._runCommandQueue();
            });

        }
    });
    
    // TMP DEBUGGING to make an older z8 file work
    vorple.parchment = vorple.parser;
})( jQuery );

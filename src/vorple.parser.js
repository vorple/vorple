/* self.js - Parser-specific features */

/** 
 * @namespace parser
 * @name parser 
 * @description Parchment features
 * @since 2.4
 */
vorple.parser = (function($) {
    var self = {};
    
    var _commandqueue = [],
        _container = {
            parchment: null,
            vorple: "#vorple",
            top: '#parchment .main',
            stream: '#parchment .main',
            stack: []
        },
        _evalqueue = [],
        _filters = {},
        _interactive = false, // true: waiting for reader action
        _mainTurnCopy = null,
        _skipFilters = false,
        _primarycommandqueue = [],
        _turn = {
            commandVisible: true,
            mode: 'line',
            outputVisible: true,
            type: 'normal'
        },
        _is_vorple_story = false;

    /**
     * Makes a prompt element.
     *
     * @param {string} promptText String prepended to the prompt (usually ">")
     * @returns {jQuery}
     *
     * @private
     * @method
     * @name parser~_createPrompt
     */
    var _createPrompt = function( promptText ) {
        return $( '<span>'+promptText+'</span>' )
            .addClass( 'vorplePrompt' )
            .append( '<input type="text" />' );
    };

    /**
     * Runs through the eval queue and executes the commands.
     * The queue is emptied afterwards.
     *
     * @private
     * @method
     * @name parser~_evaluateQueue
     */
    var _evaluateQueue = function() {
        $.each( _evalqueue, function( index, value ) {
            try {
                value();
            }
            catch( e ) {
                if( console && console.log ) {
                    console.log( 'Invalid JavaScript: '+value );
                }
            }
        });
        
        _evalqueue = [];
    };

    /**
     * Parses the previous turn into parts.
     *
     * @param {string} mode The input mode ('line' or 'char')
     * @param {jQuery} $buffer The buffer containing the turn
     * @returns {object}
     *
     * @private
     * @method
     * @name parser~_getTurnStructure
     */
    var _getTurnStructure = function( mode, $buffer ) {
        var structure = {};
        
        // Don't mess with the original
        var $contents = $buffer.clone();
    
        $( 'input', $contents ).hide();

        if( mode === 'line' ) {
        
            // The previous command is the first line
            structure.previousCommand = $contents.text().split( '\n' )[ 0 ];
            
            // remove the first line
            $contents.html( $contents.html().replace( /^.*\n/, '' ) );
            
            // The last span's last line contains the new prompt.
            var $parchmentPromptContainer = $( 'span:last', $contents );
            $( 'input', $parchmentPromptContainer ).appendTo( $contents );
            var promptLines = $parchmentPromptContainer.html().split( '\n' );

            if( promptLines.length > 1 ) {
                structure.prompt = promptLines.pop();
                $parchmentPromptContainer.html( promptLines.join( '\n' ) + '\n' );
            }
            else {
                structure.prompt = $parchmentPromptContainer.html();
                $parchmentPromptContainer.remove();
            }
        }
        else {
            structure.prompt = '';
        }
        
        structure.$turn = $contents;
        
        return structure;
    };

    /**
     * Sets the turn output based on its type (error message, meta command etc.)
     *
     * @param {object} turn
     * @param {object} metadata
     * @returns {object}
     *
     * @private
     * @method
     * @name parser~_metaTurnFilters
     */
    var _metaTurnFilters = function( turn, metadata ) {
        // TODO: split this into separate functions
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
                if( $.trim( $( turn.content.text ).text() ) !== "" ) {
                   vorple.notify.show( turn.content.text );
                }
                return false;
            case 'dialog':
                if( $.trim( $( turn.content.text ).text() ) !== "" ) {
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
                }
                return false;
            default:
                break;
        }
        
        return turn;
    };
    
    
    /**
     * Run and remove a command from the queue.
     * 
     * @returns {boolean} false if the queue was already empty, true otherwise
     *
     * @private
     * @method
     * @name parser~_runCommandQueue
     */
    var _runCommandQueue = function() {
        if( _commandqueue.length === 0 && _primarycommandqueue.length === 0 ) {
            return false;
        }

        var queue;

        if( _primarycommandqueue.length > 0 ) {
            queue = _primarycommandqueue;
            if( _mainTurnCopy === null ) {
                _mainTurnCopy = $.extend( {}, _turn );
            }
        }
        else {
            queue = _commandqueue;
            if( _mainTurnCopy !== null ) {
                _turn = $.extend( {}, _mainTurnCopy );
                _mainTurnCopy = null;
            }
        }

        var cmd = queue[ 0 ];
        var opt = $.extend( { hideCommand: false, hideOutput: false, skipFilters: false }, cmd.options );
        var $input = $( 'input.TextInput' );
        var oldCommand = $input.val();

        // remove the first command (which will be executed now)
        queue.shift();
        
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
            _skipFilters = true;
        }

        _interactive = false;

        // send the command to the engine by triggering an enter keypress
        $input
            .val( cmd.command )
            .trigger( $.Event( 'keydown', { which: 13 } ) ); // enter
            
        _skipFilters = false;
        
        return true; 
    };

    /**
     * Run input and output filters.
     *
     * @param {object} content Turn content
     * @param {string} type Turn type
     * @param {object} metadata Turn metadata
     * @returns {object}
     *
     * @private
     * @method
     * @name parser~_runFilters
     */
    var _runFilters = function( content, type, metadata ) {
        if( _skipFilters ) {
            return content;
        }
        
        var result = content;
        
        // make a deep copy of the filters
        var filters = $.extend( {}, _filters );
        
        // cache the number of filters in case some filter changes the
        // filter registry
        var numberOfFilters = 0;

        // count the number of filters
        for( var key in filters ) {
            if( filters.hasOwnProperty( key ) ) {
                numberOfFilters++;
            }
        }
        
        // loop through all filters, executing them in priority order 
        for( var i = 0; i < numberOfFilters; ++i ) {
            var highestPriority = null;
            $.each( filters, function( name, filter ) {
                if( filter.type === type && ( highestPriority === null || highestPriority.priority < filter.priority ) ) {
                    highestPriority = filter;
                }
            });
            
            if( highestPriority ) {
                result = highestPriority.filter( result, metadata );
                delete filters[ highestPriority.name ];
            }
        }
        
        return result;
    };


    /**
     * Closes all open tags opened by {@link parser#openTag}.
     *
     * @public
     * @method
     * @name parser#closeAllTags
     * @since 2.5
     */
    self.closeAllTags = function() {
        _container.stack = [];
        _container.stream = _container.top;
    };


    /**
     * Close a tag opened by {@link parser#openTag} and end output to it.
     * The output will be directed to the previously open tag, or to the main
     * stream if none is open.
     *
     * @public
     * @method
     * @name parser#closeTag
     * @since 2.5
     */
    self.closeTag = function() {
        if( _container.stack.length === 0 ) {
            return;
        }

        _container.stack.pop();

        if( _container.stack.length === 0 ) {
            _container.stream = _container.top;
        }
        else {
            _container.stream = _container.stack[ _container.stack.length - 1 ];
        }
    };


    /**
     * This is used by Parchment to determine which element to use for
     * stream output.
     */
    self.getStream = function() {
        return _container.stream;
    };


    /**
     * Hides the current turn's command at the end of turn.
     * 
     * @param {boolean} [hide=true] Set to false to undo a previous
     * call to this method.
     *
     * @public
     * @method
     * @name parser#hideCommand
     */
    self.hideCommand = function( hide ) {
        if( typeof hide === 'undefined' ) {
            hide = true;
        }
        
        _turn.commandVisible = !hide;
    };
    

    /**
     * Sets the current turn silent, i.e. its output will be hidden.
     * 
     * @param {boolean} [silent=true] Set to false to undo a previous
     * call to this method.
     *
     * @public
     * @method
     * @name parser#hideOutput
     */
    self.hideOutput = function( silent ) {
        if( typeof silent === 'undefined' ) {
            silent = true;
        }
        
        _turn.outputVisible = !silent;
    };


    /**
     * Tells whether the currently loaded story file supports Vorple.
     *
     * @returns {boolean}
     *
     * @public
     * @method
     * @name parser#isVorpleStory
     * @since 2.5
     */
    self.isVorpleStory = function() {
        return _is_vorple_story;
    };


    /**
     * Open a HTML tag. The output will be directed inside this tag until
     * it's closed.
     *
     * @param {string} tag The tag's name (e.g. "span", "p")
     * @param {string} classes Classes to be applied to the tag,
     * separated by spaces
     *
     * @public
     * @method
     * @name parser#openTag
     * @since 2.5
     */
    self.openTag = function( tag, classes ) {
        var id = vorple.core.generateId();
        var $tag = $( vorple.html.tag( tag, '', { classes: classes, id: id } ) );
        $tag.appendTo( _container.stream );

        _container.stack.push( '#'+id );
        _container.stream = '#'+id;
    };


    /**
     * Adds a new expression to the eval queue.
     *
     * @param expr {function} The function to add to the queue
     */
    self.queueExpression = function( expr ) {
        _evalqueue.push( expr );
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
     * @returns {object} The created filter object:
     * { filter: (function), name: (string), priority: (integer) }
     *
     * @public
     * @method
     * @name parser#registerFilter
     */
    self.registerFilter = function( filter, options ) {
        var opt = $.extend( { priority: 0, name: 'filter_'+vorple.core.generateId(), type: 'output' }, options );

        _filters[ opt.name ] = {
            filter: filter,
            name: opt.name,
            priority: opt.priority,
            type: opt.type
        };

        return _filters[ opt.name ];
    };


    /**
     * Scrolls to a given position on the page.
     * @param {jQuery|string|number} target The element to which the page should
     * scroll to, either as a jQuery element or a jQuery selector, or the target
     * position in pixels
     * @param {integer} [duration=150] The duration of the scroll animation
     * in milliseconds. Set to 0 for no animation.
     * @param {function} [callback] Callback function executed after scrolling
     * has finished.
     *
     * @public
     * @method
     * @name parser#scrollTo
     */
    self.scrollTo = function( target, duration, callback ) {
        var scrollTo,
            bottom = $( document ).height() - $( window ).height();

        duration = duration || 150;

        switch( target ) {
            case 'bottom':
                scrollTo = bottom;
                break;
            case 'top':
                scrollTo = 0;
                break;
            default:
                if( typeof target === 'number' ) {
                    scrollTo = target;
                }
                else {
                    // this covers jQuery objects as well
                    scrollTo = $( target ).offset().top;
                }
                break;
        }

        // make sure the scrolling is smooth when the target is
        // farther than what the page's actual length is
        if( scrollTo > bottom ) {
            scrollTo = bottom;
        }
	var callbackCalled = false;
        $('html, body').animate({ scrollTop: scrollTo }, duration, function() {
            if( !callbackCalled && typeof callback === 'function' ) { 
                callback();
                callbackCalled = true;
            } 
        });
    }; 
    
    
    /**
     * Sends a command to the parser.
     * 
     * @param {string} command The command to send
     * @param {object} options Options as an object:
     *
     * - hideCommand (default false): hide the prompt of this command from the transcript
     *
     * - hideOutput (default false): don't show the output of the command
     *
     * - skipFilters (default false): don't apply input/output filters to this
     * command
     *
     * @public
     * @method
     * @name parser#sendCommand
     */
    self.sendCommand = function( command, options ) {
        var queue = ( ( options && options.primaryCommand ) ? _primarycommandqueue : _commandqueue );
        // put the command to the queue
        queue.push({
            command: command,
            options: options
        });

        // resolve the queue if the story is waiting for input
        if( _interactive ) {
            _runCommandQueue();
        }
    };


    /**
     * Sends a primary command to the parser.
     * Primary commands are put into a different queue and handled before the
     * main command queue. This guarantees that command-specific communication
     * with the story file is handled right after the main command has finished.
     *
     * @param {string} command The command to send
     * @param {object} options Options as an object, see sendCommand()
     *
     * @public
     * @method
     * @name parser#sendPrimaryCommand
     */
    self.sendPrimaryCommand = function( command, options ) {
        self.sendCommand( command, $.extend( {}, options, { primaryCommand: true } ) );
    };


    /**
     * Sends a command to the parser behind the scenes without showing
     * either the command or the result to the reader. A shortcut for 
     * vorple.parser.sendCommand( command, { hideCommand: true, hideOutput: true, skipFilters: true } );
     * 
     * @param {string} command The command to send
     *
     * @public
     * @method
     * @name parser#sendSilentCommand
     */
    self.sendSilentCommand = function( command ) {
        self.sendCommand( command, { hideCommand: true, hideOutput: true, skipFilters: true, primaryCommand: false } );
    };


    /**
     * sendSilentCommand(), but the command is placed in the primary command
     * queue. See also sendPrimaryCommand().
     *
     * @public
     * @method
     * @name parser#sendSilentPrimaryCommand
     */
    self.sendSilentPrimaryCommand = function( command ) {
        self.sendCommand( command, { hideCommand: true, hideOutput: true, skipFilters: true, primaryCommand: true } );
    };


    /**
     * Sets the current turn's type. Supported types are "normal", "meta",
     * "undo" and "dialog".
     * 
     * @param {string} type
     *
     * @public
     * @method
     * @name parser#setTurnType
     */
    self.setTurnType = function( type ) {
        _turn.type = type;
    };


    /**
     * Calling this method tells the interpreter that the story file
     * supports Vorple. The Inform extension does this automatically
     * and there shouldn't be a need to call it anywhere else.
     *
     * @public
     * @method
     * @name parser#setVorpleSupport
     * @since 2.5
     */
    self.setVorpleStory = function() {
        _is_vorple_story = true;
    };


    /**
     * Unregisters (removes) a filter.
     * 
     * @param {string} name The name of the filter to remove
     *
     * @public
     * @method
     * @name parser#unregisterFilter
     */
    self.unregisterFilter = function( name ) {
        delete _filters[ name ];
    };


    /**
     * Initialization
     */
    $( document ).on( 'init.vorple', function() {
        if( vorple.core.engine( 'parchment' ) ) {
            // make sure the correct containers exist, create them if not
            if( $( '#vorpleContainer' ).length === 0 ) {
                $( '<div id="vorpleContainer"></div>' ).appendTo( 'body' );
            }

            var $vorpleContainer = $( '#vorpleContainer' );

            if( $( '#vorple' ).length === 0 ) {
                $vorpleContainer.append( '<div id="vorple"></div>' );
            }

            if( $( '#vorpleInput' ).length === 0 ) {
                $vorpleContainer.append( '<div id="vorpleInput"></div>' );
            }

            if( $( '#vorple-media' ).length === 0 ) {
                $vorpleContainer.append( '<div id="vorple-media"></div>' );
            }

            if( $( '#parchment' ).length === 0 ) {
                $( 'body' ).append( '<div id="parchment"></div>' );
            }

            _container.parchment = vorple.core.getEngine().options.container;

            self.registerFilter( _metaTurnFilters, { type: 'output', name: 'meta-turn filters' } );
            
            // rig the links
            $( document ).on( 
                'click.vorple', 
                'a.commandLink', 
                function( e ) {
                    e.preventDefault();
                    var command = $( this ).attr( 'href' );
                    var options = { hideCommand: $( this ).hasClass( 'hideCommand' ), hideOutput: $( this ).hasClass( 'hideResponse' ) };
                    self.sendCommand( command, options );
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
                    
                    var command = _runFilters(
                        $( this ).val(),
                        'input'
                    );
                    
                    self.sendCommand( command );
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
                if( input.length && e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'A' && ( window.getSelection() ||
                        ( document.selection ? document.selection.createRange().text : '' ) === '' ) )
                {
                    e.target = input[0];
                    // If the input field is not on screen, scroll to it
                    if ( $( '#vorpleContainer' ).attr( 'display' ) !== 'none' && ( $( window ).scrollTop() - input.offset().top > 0 || $( window ).scrollTop() + $( window ).height() - input.offset().top < 60 ) ) {
                        // Manually reset the target incase focus/trigger don't - we don't want the trigger to recurse

                        self.scrollTo( input, 100, function() { input.focus().trigger( e ); 
 } );

                        // Stop propagating after re-triggering it, so that the trigger will work for all keys
                        e.stopPropagation();
                    }
                    // Intercept the backspace key if not
                    else if ( e.type === 'keydown' && e.which === 8 )
                    {
                        return false;
                    }
                    else {
                       input.focus().trigger(e);
                    }
                    
                    if( _turn.mode === 'char' ) {
                        $( 'input.TextInput' ).trigger( $.Event( 'keypress', { which: e.which } ) );
                    }
                }
            });

            // Events happening right after text input
            $( document ).on( 'TextInput.vorple', function() {
                
                // hide transient classes
                $( '.transient', _container.vorple )
                        .animate({opacity: 0}, 1500)
                        .slideUp(500, function() {
                            $(this).remove();
                    });
                
                // Reset the turn type to normal
                self.setTurnType( 'normal' );
            });

            // Things that happen only once when the story has loaded
            $( document ).one( 'TurnComplete.vorple', function() {
                // Hide the load indicator
                $( '#vorpleLoader' ).slideUp();

                // Let the story file know it can advance to "when play begins"
                // rules. By now the story file itself has passed whatever
                // implicit commands it needs to the queue so the story
                // starting command will be placed last in the queue.
                //
                // For backwards compatibility with non-Vorple story files
                // the command is sent only if the story file has requested
                // it beforehand.
                if( _is_vorple_story ) {
                    self.sendCommand( '__start_story', { hideCommand: true, skipFilters: true } );
                }
            });

            // Parchment triggers a TurnComplete event when all the turn's
            // content has printed and the story waits for reader input.
            // At that point we can take what's in the buffer and
            // do all the Vorple stuff with it.
            $( document ).on( 'TurnComplete.vorple', function( e ) {
                var $buffer = $( ".main", _container.parchment );
                var $target = $( _container.vorple );
                
                
                /* Split the buffer contents into actual content, prompt,
                 * old command and status line.
                 */
                
                var structure = _getTurnStructure( e.mode, $buffer );

                // Run the contents through filters
                var filteredContents = _runFilters(
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
                        turn: _turn
                    } 
                );

                // If the filter returned false (or not an object),
                // do nothing except cleanup
                if( typeof filteredContents !== 'object' || 
                        ( !_turn.commandVisible && !_turn.outputVisible ) 
                ) {
                    $( 'input', $buffer ).appendTo( 'body' ).hide();
                    $buffer.empty();
                    $( '.vorplePrompt input' ).val( '' );

                    // reset hidden commands/output
                    self.hideCommand( false );
                    self.hideOutput( false );
                    
                    // run the code in the queue
                    _evaluateQueue();
  
                    _turn.mode = e.mode;
                    
                    // run commands in the command queue
                    _interactive = true;
                    _runCommandQueue();
                                  
                    return false;
                }
                
                if( e.mode === 'char' && $( '.turn' ).length ) {
                    $( '<span></span>' ).html( filteredContents.content.text ).appendTo( $('#vorple .main:last' ) );
                    $( '.vorplePrompt:last', $target ).remove();
                    $( _createPrompt( filteredContents.prompt.text ) )
                        .addClass( filteredContents.prompt.classes )
                        .appendTo( $newTurnContainer )
                        .find( 'input' )
                        .val( promptContents );
                    $( 'input', $buffer ).appendTo( 'body' ).hide();
                    $buffer.empty();

                    _turn.mode = e.mode;
                    _interactive = true;
                
                    return;
                }

                var $newTurn;

                if( _turn.outputVisible ) {
                    // Replace the contents with filtered text
                    structure.$turn
                        .html( filteredContents.content.text )
                        .addClass( filteredContents.content.classes );
                    
                    // Now we can display the results.
    
                    // Put the turn contents into a container
                    $newTurn = $( '<div></div>' ).append( structure.$turn );

                }
                
                var promptContents = filteredContents.prompt.val;
                
                if( _turn.commandVisible ) {
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
                if( $newTurn ) {
                    $newTurn
                        .addClass( 'turnContent' )
                        .addClass( filteredContents.turnClasses );
                }

                // Wrap it all into a div
                var $newTurnContainer = $( '<div></div>' )
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
                $( _createPrompt( filteredContents.prompt.text ) )
                    .addClass( filteredContents.prompt.classes )
                    .appendTo( $newTurnContainer )
                    .find( 'input' )
                    .val( promptContents );
                
                // Display to the reader
                $newTurnContainer.appendTo( $target );
                
                // Run the story-specified JS in the queue
                _evaluateQueue();
                
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
                    $( '<span>\n</span>' ).appendTo( $buffer );
                }

                // reset hidden commands/output
                self.hideCommand( false );
                self.hideOutput( false );
                
                
                // Scroll to where the new turn begins
                self.scrollTo( $newTurn );
  
                _turn.mode = e.mode;
                _interactive = true;
                _runCommandQueue();
            });

        }
    });

    return self;
})( jQuery );

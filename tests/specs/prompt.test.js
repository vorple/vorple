const { flagValue, sendCommand, vorple } = require( "../utility" );

const sendEnter = () => browser.execute( () => vorple.prompt.queueKeypress('\n') );
const waitForLineInput = () => $( "#lineinput" ).waitForExist( 10000 );

// send the command by typing on the prompt instead of using the command queue
const sendCommandManually = cmd => {
    $( "#lineinput-field" ).setValue( cmd );
    browser.keys("\uE007");    // press enter
};

describe( "Prompt", () => {
    describe( "command queue", () => {
        describe( ".queueCommand()", () => {
            it( "adds a command to the queue and runs it", () => {
                sendCommand( "set flag queueCommandSingle" );
                waitForLineInput();
                expect( flagValue( "queueCommandSingle" ) ).to.be.true;
            });

            it( "queues two commands, runs both", () => {
                sendCommand( "set flag queueTwoCommands1" );
                sendCommand( "set flag queueTwoCommands2" );
                waitForLineInput();
                expect( flagValue( "queueTwoCommands1" ) ).to.be.true;
                expect( flagValue( "queueTwoCommands2" ) ).to.be.true;
            });

            it( "queued commands are shown in the transcript", () => {
                expectElement( $( ".prompt-input*=set flag queueCommandSingle" ) ).toExist();
            });

            it( "silently run commands are not shown in the transcript", () => {
                const silentCommand = "set flag silentCommand";

                sendCommand( silentCommand, true );
                waitForLineInput();
                expect( flagValue( "silentCommand" ) ).to.be.true;
                expect( $( ".prompt-input*=" + silentCommand ).isExisting() ).to.be.false;
            });

            it( "doesn't clear the prompt text that the player has already typed", () => {
                const existingCommand = "test";

                // confirm that the test setup works correctly
                $( "#lineinput-field" ).setValue( existingCommand );
                expectElement( $( "#lineinput-field" ) ).toHaveValue( existingCommand );

                // visible
                $( "#lineinput-field" ).setValue( existingCommand );
                sendCommand( "z" );
                waitForLineInput();
                expectElement( $( "#lineinput-field" ) ).toHaveValue( existingCommand );

                // silent
                $( "#lineinput-field" ).setValue( existingCommand );
                sendCommand( "z", true );
                waitForLineInput();
                expectElement( $( "#lineinput-field" ) ).toHaveValue( existingCommand );
            });
        });
    });

    describe( "keypress queue", () => {
        describe( ".queueKeypress()", () => {
            it( "adds a keypress to the queue and runs it", () => {
                sendCommand( "pause" );
                expect( browser.execute( () => haven.input.getMode() ) ).to.equal( "getkey" );
                sendEnter();
                waitForLineInput();
            });

            it( "queues a keypress before keypress is requested", () => {
                sendEnter();
                sendCommand( "pause" );
                waitForLineInput();
            });

            it( "queues two keypresses, runs both", () => {
                sendEnter();
                sendEnter();
                sendCommand( "pause" );
                sendCommand( "pause" );
                waitForLineInput();
            });
        });
    });

    describe( "prefix", () => {
        describe( ".setPrefix()", () => {
            it( "changes the prefix", () => {
                const newPrefix = "newprefix";

                vorple( "prompt", "setPrefix", newPrefix );
                expectElement( $( "#lineinput-prefix" ) ).toHaveText( newPrefix );
            });

            it( "escapes HTML", () => {
                const newPrefix = "test <strong>prefix</strong>";

                vorple( "prompt", "setPrefix", newPrefix );
                expectElement( $( "#lineinput-prefix" ) ).toHaveText( newPrefix  );
            });

            it( "adds HTML", () => {
                const newPrefix = "test <strong>prefix</strong>";

                vorple( "prompt", "setPrefix", newPrefix, true );
                expectElement( $( "#lineinput-prefix" ) ).toHaveText( "test prefix" );
            });

            const uniquePrefix = "uniquePrefixNotSeenElsewhere";
            const wait = () => {
                sendCommand( "z" );
                waitForLineInput();
            };

            it( "changes only the current prompt", () => {
                vorple( "prompt", "setPrefix", uniquePrefix, true );
                expect( $( ".prompt-prefix*=" + uniquePrefix ).isExisting() ).to.be.false;
            });

            it( "persists the change", () => {
                wait();
                expectElement( $( "#lineinput-prefix" ) ).toHaveText( uniquePrefix  );
            });

            it( "shows the prefix in prompts in the transcript", () => {
                wait();
                expectElement( $$( ".prompt-prefix*=" + uniquePrefix ) ).toBeElementsArrayOfSize( 2 );
            });
        });
    });

    describe( "visibility", () => {
        describe( ".hide()", () => {
            it( "hides the prompt", () => {
                vorple( "prompt", "hide" );
                expect( $( "#lineinput" ).isDisplayed() ).to.be.false;
            });
        });

        describe( ".unhide()", () => {
            it( "re-shows the prompt", () => {
                vorple( "prompt", "unhide" );
                expectElement( $( '#lineinput' ) ).toBeDisplayed();
            });
        });
    });
});

describe( "Input filters", () => {
    const filterCleanup = () => browser.execute( () => window.filterCleanup.forEach( remover => remover() ) );

    it( "register and change input", () => {
        browser.execute( () => {
            window.basicInputFilter = ( input, meta ) => {
                window.basicInputMeta = meta;
                return input.replace( "foo", "bar" );
            };

            window.basicInputFilterRemover = vorple.prompt.addInputFilter( window.basicInputFilter );
        });

        sendCommand( "set value foo" );
        expect( browser.execute( () => window.testValue ) ).to.equal( "bar" );
    });

    it( "don't change what's printed on the screen", () => {
        expectElement( $( ".lineinput.last .prompt-input" ) ).toHaveText( "set value foo" );
    });

    it( "have the correct meta object", () => {
        expect( browser.execute( () => window.basicInputMeta) ).to.include({
            input: "set value foo",
            original: "set value foo",
            type: "line",
            userAction: false,
            silent: false
        });
    });

    it( "calling the return value removes filter", () => {
        browser.execute( () => window.basicInputFilterRemover() );
        sendCommand( "set value foo" );
        expect( browser.execute( () => window.testValue ) ).to.equal( "foo" );
    });

    it( "input parameter is chained", () => {
        browser.execute( () => {
            window.chainInput = [];
            window.chainOriginal = [];
            window.filterCleanup = [];

            window.chainInputFilter = index => ( input, meta ) => {
                window.chainInput.push( input );
                window.chainOriginal.push( meta.original );
                return index;
            };

            window.filterCleanup.push( vorple.prompt.addInputFilter( window.chainInputFilter( "one" ) ) );
            window.filterCleanup.push( vorple.prompt.addInputFilter( window.chainInputFilter( "two" ) ) );
            window.filterCleanup.push( vorple.prompt.addInputFilter( window.chainInputFilter( "three" ) ) );
        });

        sendCommand( "zero" );
        expect( browser.execute( () => window.chainInput ) ).to.deep.equal( [ "zero", "one", "two" ] );
        filterCleanup();
    });

    it( "original input never changes", () => {
        expect( browser.execute( () => window.chainOriginal ) ).to.deep.equal( [ "zero", "zero", "zero" ] );
    });

    it( "returning nothing, null or true ignores filter", () => {
        browser.execute( () => {
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => {} ) );
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => null ) );
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => true ) );
        });

        sendCommand( "set flag ignoredfilters" );
        expect( flagValue( "ignoredfilters" ) ).to.be.true;
        filterCleanup();
    });

    const cancelCommand = "set flag cancelledfilter";

    it( "canceling done by returning false", () => {
        browser.execute( () => {
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => false ) );
        });

        sendCommandManually( cancelCommand );
        waitForLineInput();
        expect( flagValue( "cancelledfilter" ) ).to.be.false;
        filterCleanup();
    });

    it( "canceling doesn't clear prompt value", () => {
        expectElement( $( "#lineinput-field" ) ).toHaveValue( cancelCommand );
    });

    it( "canceling doesn't append the prompt to the output", () => {
        expect( $( ".lineinput.last .prompt-input" ).getText() ).not.to.equal( cancelCommand );
    });

    it( "wait for promise to resolve", () => {
        browser.execute( () => {
            const promiseInputFilter = input => new Promise( ( resolve, reject ) => {
                if( input === "throw" ) {
                    return reject();
                }

                setTimeout( resolve, 1000 );
            });

            window.filterCleanup.push( vorple.prompt.addInputFilter( promiseInputFilter ) );
        });

        sendCommand( "set flag promisefilter" );
        browser.pause( 600 );
        expect( flagValue( "promisefilter" ) ).to.be.false;
        browser.pause( 600 );
        expect( flagValue( "promisefilter" ) ).to.be.true;
    });
    
    it( "block the UI while the filters resolve", () => {
        sendCommandManually( "z" );
        browser.pause( 600 );
        browser.keys( "y" );
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "z" );
        browser.pause( 600 );
        browser.keys( "x" );
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "x" );
    });
    
    it( "cancel the event when a promise rejects", () => {
        sendCommandManually( "throw" );
        waitForLineInput();
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "throw" );
        expect( $( ".lineinput.last .prompt-input" ).getText() ).not.to.include( "throw" );
        browser.keys( "x" );    // make sure the UI is unblocked
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "throwx" );
        filterCleanup();
    });

    it( "changing the prompt will show the changed prompt on screen", () => {
        browser.execute( () => {
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => vorple.prompt.setValue( "changed" ) ) );
        });

        sendCommandManually( "foo" );
        waitForLineInput();
        expectElement( $( ".lineinput.last .prompt-input" ) ).toHaveText( "changed" );
        filterCleanup();
    });
});

describe( "Command history", () => {
    const clear = () => browser.execute( () => vorple.prompt.history.clear() );
    const history = () => browser.execute( () => vorple.prompt.history.get() );

    before( () => browser.refresh() );

    it( "is empty at the start of game", () => {
        expect( history() ).to.be.empty;
    });

    it( "contains typed commands", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        expect( history() ).to.deep.equal( [ "a", "b" ] );

        sendCommandManually( "c" );
        expect( history() ).to.deep.equal( [ "a", "b", "c" ] );
    });

    it( "won't add identical repeating commands", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        sendCommandManually( "b" ); // identical and consecutive, not stored
        sendCommandManually( "a" ); // identical but not consecutive, should be stored

        expect( history() ).to.deep.equal( [ "a", "b", "a" ] );
    });

    it( "adds commands programmatically", () => {
        clear();
        sendCommandManually( "a" );
        browser.execute( () => vorple.prompt.history.add( "b" ) );
        sendCommandManually( "c" );
        expect( history() ).to.deep.equal( [ "a", "b", "c" ] );
    });

    it( "can be cleared", () => {
        sendCommandManually( "a" );
        clear();
        expect( history() ).to.be.empty;
    });

    it( "can remove commands by index", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        sendCommandManually( "c" );

        const result = browser.execute( () => vorple.prompt.history.remove( 1 ) );
        expect( history() ).to.deep.equal( [ "a", "c" ] );
        expect( result ).to.be.true;
    });

    it( "won't remove when index is out of bounds", () => {
        clear();
        sendCommandManually( "a" );

        const result1 = browser.execute( () => vorple.prompt.history.remove( 1 ) ) 
        expect( history() ).to.deep.equal( [ "a" ] );
        expect( result1 ).to.be.false;

        const result2 = browser.execute( () => vorple.prompt.history.remove( -1 ) ) 
        expect( history() ).to.deep.equal( [ "a" ] );
        expect( result2 ).to.be.false;
    });

    it( "removes the last command", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        sendCommandManually( "c" );

        const result = browser.execute( () => vorple.prompt.history.remove() );
        expect( history() ).to.deep.equal( [ "a", "b" ] );
        expect( result ).to.be.true;
    });

    it( "can be replaced entirely", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        sendCommandManually( "c" );
        browser.execute( () => vorple.prompt.history.set([ "d", "e", "f" ]) );
        expect( history() ).to.deep.equal( [ "d", "e", "f" ] );
    });

    it( "can be browsed with arrow keys", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );

        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "b" );
        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "a" );
        browser.keys("ArrowUp");    // at the start of history, won't do anything
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "a" );

        browser.keys("ArrowDown");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "b" );
        browser.keys("ArrowDown");    // at the end of history, clears field
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "" );
        browser.keys("ArrowDown");    // not browsing, pressing down does nothing
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "" );
    });

    it( "remembers currently typed command", () => {
        clear();
        sendCommandManually( "a" );
        $( "#lineinput-field" ).setValue( "typing" );

        // up key goes to previous command
        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "a" );

        // pressing down brings back what the player was in the middle of typing
        browser.keys("ArrowDown");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "typing" );

        // pressing down again does nothing
        browser.keys("ArrowDown");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "typing" );
    });

    it( "is unaffected when sending commands programmatically", () => {
        clear();
        sendCommandManually( "a" );
        $( "#lineinput-field" ).setValue( "typing" );
        sendCommand( "b" );
        sendCommand( "c", true );   // silent

        // won't clear the field
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "typing" );

        // up key goes to latest visible command
        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "b" );
    });

    it( "doesn't interrupt the player's browsing when commands are sent programmatically", () => {
        clear();
        sendCommandManually( "a" );
        sendCommandManually( "b" );
        sendCommandManually( "c" );
        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "c" );
        sendCommand( "d", true );   // silent
        sendCommand( "e" );

        expectElement( $( "#lineinput-field" ) ).toHaveValue( "c" );
        browser.keys("ArrowUp");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "b" );
        browser.keys("ArrowDown");
        browser.keys("ArrowDown");  // should skip the silent command
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "e" );
        browser.keys("ArrowDown");
        expectElement( $( "#lineinput-field" ) ).toHaveValue( "" );
    });

    it( "won't store hidden commands", () => {
        clear();
        sendCommand( "a" );
        sendCommand( "b", true );
        expect( history() ).to.deep.equal( [ "a" ] );
    });
});
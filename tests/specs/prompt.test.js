const chai = require( "chai" );
const chaiWebdriver = require( "chai-webdriverio" ).default;
chai.use( chaiWebdriver( browser ) );

const expect = chai.expect;
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
                expect( ".prompt-input*=set flag queueCommandSingle" ).to.have.count( 1 );
            });

            it( "silently run commands are not shown in the transcript", () => {
                const silentCommand = "set flag silentCommand";

                sendCommand( silentCommand, true );
                waitForLineInput();
                expect( flagValue( "silentCommand" ) ).to.be.true;
                expect( ".prompt-input*=" + silentCommand ).to.have.count( 0 );
            });

            it( "doesn't clear the prompt text that the player has already typed", () => {
                const existingCommand = "test";

                // confirm that the test setup works correctly
                $( "#lineinput-field" ).setValue( existingCommand );
                expect( $( "#lineinput-field" ).getValue() ).to.equal( existingCommand );

                // visible
                $( "#lineinput-field" ).setValue( existingCommand );
                sendCommand( "z" );
                waitForLineInput();
                expect( $( "#lineinput-field" ).getValue() ).to.equal( existingCommand );

                // silent
                $( "#lineinput-field" ).setValue( existingCommand );
                sendCommand( "z", true );
                waitForLineInput();
                expect( $( "#lineinput-field" ).getValue() ).to.equal( existingCommand );
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
                expect( "#lineinput-prefix" ).to.have.text( newPrefix );
            });

            it( "escapes HTML", () => {
                const newPrefix = "test <strong>prefix</strong>";

                vorple( "prompt", "setPrefix", newPrefix );
                expect( "#lineinput-prefix" ).to.have.text( newPrefix  );
            });

            it( "adds HTML", () => {
                const newPrefix = "test <strong>prefix</strong>";

                vorple( "prompt", "setPrefix", newPrefix, true );
                expect( "#lineinput-prefix" ).to.have.text( "test prefix" );
            });

            const uniquePrefix = "uniquePrefixNotSeenElsewhere";
            const wait = () => {
                sendCommand( "z" );
                waitForLineInput();
            };

            it( "changes only the current prompt", () => {
                vorple( "prompt", "setPrefix", uniquePrefix, true );
                expect( ".prompt-prefix*=" + uniquePrefix ).to.have.count( 0 );
            });

            it( "persists the change", () => {
                wait();
                expect( "#lineinput-prefix" ).to.have.text( uniquePrefix  );
            });

            it( "shows the prefix in prompts in the transcript", () => {
                wait();
                expect( ".prompt-prefix*=" + uniquePrefix ).to.have.count( 2 );
            });
        });
    });

    describe( "visibility", () => {
        describe( ".hide()", () => {
            it( "hides the prompt", () => {
                vorple( "prompt", "hide" );
                expect( '#lineinput' ).to.not.be.displayed();
            });
        });

        describe( ".unhide()", () => {
            it( "re-shows the prompt", () => {
                vorple( "prompt", "unhide" );
                expect( '#lineinput' ).to.be.displayed();
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
        expect( ".lineinput.last .prompt-input" ).to.have.text( "set value foo" );
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
        expect( $( "#lineinput-field" ).getValue() ).to.equal( cancelCommand );
    });

    it( "canceling doesn't append the prompt to the output", () => {
        expect( ".lineinput.last .prompt-input" ).to.not.have.text( cancelCommand );
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
        expect( $( "#lineinput-field" ).getValue() ).to.equal( "z" );
        browser.pause( 600 );
        browser.keys( "x" );
        expect( $( "#lineinput-field" ).getValue() ).to.equal( "x" );
    });
    
    it( "cancel the event when a promise rejects", () => {
        sendCommandManually( "throw" );
        waitForLineInput();
        expect( $( "#lineinput-field" ).getValue() ).to.equal( "throw" );
        expect( ".lineinput.last .prompt-input" ).to.not.have.text( "throw" );
        browser.keys( "x" );    // make sure the UI is unblocked
        expect( $( "#lineinput-field" ).getValue() ).to.equal( "throwx" );
        filterCleanup();
    });

    it( "changing the prompt will show the changed prompt on screen", () => {
        browser.execute( () => {
            window.filterCleanup.push( vorple.prompt.addInputFilter( () => vorple.prompt.setValue( "changed" ) ) );
        });

        sendCommandManually( "foo" );
        waitForLineInput();
        expect( ".lineinput.last .prompt-input" ).to.have.text( "changed" );
        filterCleanup();
    });
});

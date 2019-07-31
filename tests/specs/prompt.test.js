const chai = require( "chai" );
const chaiWebdriver = require( "chai-webdriverio" ).default;
chai.use( chaiWebdriver( browser ) );

const expect = chai.expect;
const { flagValue, sendCommand, vorple } = require( "../utility" );

const sendEnter = () => browser.execute( () => vorple.prompt.queueKeypress('\n') );
const waitForLineInput = () => $( "#lineinput" ).waitForExist( 10000 );

describe( "Prompt", () => {
    describe( "character request", () => {
        it( "waits for keypress", () => {
            waitForLineInput();
            sendCommand( "pause" );
            expect( browser.execute( () => haven.input.getMode() ) ).to.equal( "getkey" );
            sendEnter();
            $( '.pause-over' ).waitForExist( 1000 );
        })
    });

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
        });
    });

    describe( "keypress listeners", () => {
        describe( "haven.input.keypress.addListener", () => {
            it( "triggers when keypress is expected", () => {
                browser.execute( () => {
                    window.listenerCalled = false;
                    window.testRemover = haven.input.keypress.addListener( function() { window.listenerCalled = true; } )
                });
                sendCommand( "pause" );
                browser.pause(100);
                expect( browser.execute( () => window.listenerCalled ) ).to.be.true;
                sendEnter();
            });

            it( "removes the listener when return value is called", () => {
                browser.execute( () => { window.listenerCalled = false; window.testRemover(); });
                sendCommand( "pause" );
                expect( browser.execute( () => window.listenerCalled ) ).to.be.false;
                sendEnter();
            })
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

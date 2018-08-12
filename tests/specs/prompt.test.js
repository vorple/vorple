const chai = require( "chai" );
const chaiWebdriver = require( "chai-webdriverio" ).default;
chai.use( chaiWebdriver( browser ) );

const expect = chai.expect;
const { flagValue, vorple } = require( "../utility" );

const waitForLineInput = () => browser.waitForExist( "#lineinput", 5000 );

describe( "Prompt", () => {
    describe( "command queue", () => {
        describe( ".queueCommand()", () => {
            it( "adds a command to the queue and runs it", () => {
                vorple( "prompt", "queueCommand", "set flag queueCommandSingle" );
                waitForLineInput();
                expect( flagValue( "queueCommandSingle" ) ).to.be.true;
            });

            it( "queues two commands, runs both", () => {
                vorple( "prompt", "queueCommand", "set flag queueTwoCommands1" );
                vorple( "prompt", "queueCommand", "set flag queueTwoCommands2" );
                waitForLineInput();
                expect( flagValue( "queueTwoCommands1" ) ).to.be.true;
                expect( flagValue( "queueTwoCommands2" ) ).to.be.true;
            });

            it( "queued commands are shown in the transcript", () => {
                expect( ".prompt-input*=set flag queueCommandSingle" ).to.have.count( 1 );
            });

            it( "silently run commands are not shown in the transcript", () => {
                const silentCommand = "set flag silentCommand";

                vorple( "prompt", "queueCommand", silentCommand, true );
                waitForLineInput();
                expect( flagValue( "silentCommand" ) ).to.be.true;
                expect( ".prompt-input*=" + silentCommand ).to.have.count( 0 );
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
                vorple( "prompt", "queueCommand", "z" );
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
                expect( '#lineinput' ).to.not.be.visible();
            });
        });

        describe( ".unhide()", () => {
            it( "re-shows the prompt", () => {
                vorple( "prompt", "unhide" );
                expect( '#lineinput' ).to.be.visible();
            });
        });
    });
});

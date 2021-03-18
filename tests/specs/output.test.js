const { sendCommand, vorple, waitForLineInput } = require( "../utility" );

describe( "output filters", () => {
    const filterCleanup = () => browser.execute( () => window.filterCleanup.forEach( remover => remover() ) );

    it( "register and change output", () => {
        browser.execute( () => {
            window.filterCleanup = [];

            window.basicOutputFilter = ( output, meta ) => {
                window.basicOutputMeta = meta;
                return output.replace( "foo", "bar" );
            };

            window.basicOutputFilterRemover = vorple.output.addOutputFilter( window.basicOutputFilter );
        });

        sendCommand( "echo output foo" );
        waitForLineInput();
        expect( $( ".turn.previous" ).getText().trim() ).to.equal( ">echo output foo\noutput bar" );
    });

    it( "has the correct meta information", () => {
        expect( browser.execute( () => window.basicOutputMeta ) ).to.deep.include({
            output: "output foo\n",
            original: "output foo\n",
            style: {
                bold: false,
                italic: false
            }
        });
    });

    it( "bold text has correct style information", () => {
        browser.execute( () => {
            window.boldOutputFilter = ( output, meta ) => {
                if( output.startsWith( 'room' ) ) {
                    window.boldOutputMeta = meta;
                }
            };

            window.filterCleanup.push( vorple.output.addOutputFilter( window.boldOutputFilter ) );
        });

        sendCommand( "look" );
        waitForLineInput();
        expect( browser.execute( () => window.boldOutputMeta ) ).to.deep.include({
            style: {
                bold: true,
                italic: false
            }
        });
    });

    it( "change output in a chain", () => {
        browser.execute( () => {
            window.chainOutputFilter1 = output => {
                return output.replace( "bar", "baz" );
            };

            window.chainOutputFilter2 = output => {
                return output.replace( "baz", "xyz" );
            };

            window.filterCleanup.push( vorple.output.addOutputFilter( window.chainOutputFilter1 ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.chainOutputFilter2 ) );
        });

        sendCommand( "echo output foo" );
        waitForLineInput();
        expect( $( ".turn.previous" ).getText().trim() ).to.equal( ">echo output foo\noutput xyz" );
        filterCleanup();
    });

    it( "removes the filter when calling the returned function", () => {
        browser.execute( () => window.basicOutputFilterRemover() );
        sendCommand( "echo output foo" );
        waitForLineInput();
        expect( $( ".turn.previous" ).getText().trim() ).to.equal( ">echo output foo\noutput foo" );
    });

    it( "returning false will stop the filter chain", () => {
        browser.execute( () => {
            window.filterCleanup = [];

            window.blockOutputFilter = () => {
                return false;
            };

            // other filters are defined in an earlier test
            window.filterCleanup.push( vorple.output.addOutputFilter( window.chainOutputFilter1 ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.blockOutputFilter ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.chainOutputFilter2 ) );
        });

        sendCommand( "echo output bar" );
        waitForLineInput();
        expect( $( ".turn.previous" ).getText().trim() ).to.equal( ">echo output bar\noutput baz" );
        filterCleanup();
    });

    it( "returning something that's not a string doesn't change output", () => {
        browser.execute( () => {
            window.notStringOutputFilter1 = () => {
                return true;
            };

            window.notStringOutputFilter2 = () => {
                return null;
            };

            window.notStringOutputFilter3 = () => {
                return 1;
            };
            
            window.notStringOutputFilter4 = async() => {
                return "promise";
            };

            window.filterCleanup.push( vorple.output.addOutputFilter( window.notStringOutputFilter1 ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.notStringOutputFilter2 ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.notStringOutputFilter3 ) );
            window.filterCleanup.push( vorple.output.addOutputFilter( window.notStringOutputFilter4 ) );
        });

        sendCommand( "echo output foo" );
        waitForLineInput();
        expect( $( ".turn.previous" ).getText().trim() ).to.equal( ">echo output foo\noutput foo" );
        filterCleanup();
    });


});
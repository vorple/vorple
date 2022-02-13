const VERSION = require( "../../package.json" ).version;
const { getVorple, vorple, waitForLineInput } = require( "../utility" );

describe( "Test environment", () => {
    it( "is set up correctly", () => {
        browser.refresh();
        if( browser.execute( () => document.getElementById( 'haven' ) !== null ) ) {
            throw new Error( `The #haven element exists which suggests that we're not using the correct testing HTML file. Some tests might result in false negatives.
Confirm that the server has been started with 'yarn start:test' or skip this test (describe.skip( "Test environment" )) if there's a reason to run without the normal test server.` );
        }
    });
});

describe( "Core library", () => {
    describe( "Vorple version", () => {
        it( "is exposed", () => {
            expect( getVorple().version ).to.equal( VERSION );
        });
    });

    describe( "requireVersion", () => {
        it( "returns true for lower or equal versions", () => {
            const [ major, minor, patch ] = getVorple().version.split( "." ).map( str => +str );

            let lowerVersions = [
                [ 1, 0, 0 ],
                [ major ],
                [ major, minor ],
                [ major, minor, patch ],
                [ major - 1, minor, patch ],
                [ major, Math.max( minor - 1, 0 ), patch ],
                [ major, minor, Math.max( patch - 1, 0 ) ],
                [ major, minor - 1 ],
                [ major - 1 ],
                [ major - 1, minor ],
                [ major - 1, Math.max( minor - 1, 0 ), Math.max( patch - 1, 0 ) ]
            ];

            lowerVersions.forEach( test => expect( vorple( null, "requireVersion", test.join( "." ) ) ).to.be.true );
        });

        it( "throws an error for higher versions", () => {
            const [ major, minor, patch ] = getVorple().version.split( "." ).map( str => +str );

            let lowerVersions = [
                [ 10, 0, 0 ],
                [ 9999, 9999, 9999 ],
                [ major + 1, minor + 1, patch + 1 ],
                [ major + 1, minor + 1 ],
                [ major + 1 ],
                [ major + 1, minor, patch + 1 ],
                [ major, minor + 1 ],
                [ major, minor, patch + 1 ],
            ];

            lowerVersions.forEach( test => {
                try {
                    expect( vorple( null, "requireVersion", test.join( "." ) ) ).to.throw();
                }
                catch( e ) {}
            });
        });
    });

    describe( "Inform version", () => {
        it( "is set after handshake", () => {
            waitForLineInput();
            expect( vorple( null, "getInformVersion" ) ).to.equal( 7 );
        });
    });

    describe( "Title", () => {
        it( "handles Unicode characters", () => {
            expectElement( browser ).toHaveTitle( "Vorple Integration Tests - αβγ - абв" );
        });
    });
});

describe( "Event listeners", () => {
    describe( "addEventListener", () => {
        it( "throws an error if event name is missing", () => {
            expect( () => vorple( null, "addEventListener" ) ).to.throw( "Event name missing" );
            expect( () => vorple( null, "addEventListener", () => {} ) ).to.throw( "Event name missing" );
        });

        it( "throws an error if callback is missing", () => {
            expect( () => vorple( null, "addEventListener", "init" ) ).to.throw();
        });

        it( "throws an error for unknown event name", () => {
            expect( () => browser.execute( () => vorple.addEventListener( "foo", () => {} ) ) ).to.throw( "unknown event" );
            expect( () => browser.execute( () => vorple.addEventListener( [ "init", "foo" ], () => {} ) ) ).to.throw( "unknown event" );
        });

        it( "returns a function", () => {
            expect( browser.execute( () => typeof vorple.addEventListener( "init", () => {} ) ) ).to.equal( "function" );
        });
    });

    describe( "removeEventListener", () => {
        it( "doesn't throw an error if event name is missing", () => {
            expect( () => browser.execute( () => vorple.removeEventListener( () => {} ) ) ).to.not.throw();
        });

        it( "throws an error if callback is missing", () => {
            expect( () => vorple( null, "removeEventListener", "init" ) ).to.throw();
        });

        it( "throws an error for unknown event name", () => {
            expect( () => browser.execute( () => vorple.removeEventListener( "foo", () => {} ) ) ).to.throw( "unknown event" );
            expect( () => browser.execute( () => vorple.removeEventListener( [ "init", "foo" ], () => {} ) ) ).to.throw( "unknown event" );
        });

        it( "empty array as parameter returns true", () => {
            expect( browser.execute( () => vorple.removeEventListener( [], () => {} ) ) ).to.be.true;
        });

        it( "returns true after removing a registered listener", () => {
            browser.execute( () => {
                window.singleListener = () => {};
                vorple.addEventListener( "init", singleListener );
            });

            expect( browser.execute( () => vorple.removeEventListener( "init", singleListener ) ) ).to.be.true;
        });

        it( "returns true after removing multiple registered listeners", () => {
            browser.execute( () => {
                window.multipleListener = () => {};
                vorple.addEventListener( [ "init", "quit" ], window.multipleListener );
            });

            expect( browser.execute( () => vorple.removeEventListener( [ "init", "quit" ], window.multipleListener ) ) ).to.be.true;
        });

        it( "returns false if the listener wasn't registered", () => {
            expect( browser.execute( () => vorple.removeEventListener( "init", () => {} ) ) ).to.be.false;
        });

        it( "returns true if only some listeners were removed", () => {
            browser.execute( () => {
                window.sharedEvent = () => {};
                vorple.addEventListener( [ "init", "expectCommand" ], window.sharedEvent );
            });

            expect( browser.execute( () => vorple.removeEventListener( [ "init", "quit" ], window.sharedEvent ) ) ).to.be.true;
        });
    });

    describe( "init event", () => {
        it( "triggers correctly", () => {
            browser.refresh();
            browser.execute( () => vorple.addEventListener( "init", meta => {
                window.initEventHasRun = true;
                window.initEventMeta = meta;
            }) );
            waitForLineInput();
            expect( browser.execute( () => window.initEventConfirmed ) ).to.be.true;
        });

        it( "has the correct meta information", () => {
            expect( browser.execute( () => window.initEventMeta.type ) ).to.equal( "init" );
        });

        it( "promises pause execution", () => {
            browser.refresh();
            browser.execute( () => {
                const initPromiseListener = () => new Promise( resolve => {
                    setTimeout( resolve, 2000 );
                });

                vorple.addEventListener( "init", initPromiseListener );
            });
            browser.pause(1500);
            expect( $( "#lineinput" ).isExisting() ).to.be.false;
            waitForLineInput();
        });
    });

    describe( "expectCommand event", () => {
        it( "triggers correctly", () => {
            browser.refresh();
            waitForLineInput();
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 300 );
            browser.execute( () => {
                window.expectCommandCounter = 0;

                const expectCommandListener = meta => {
                    window.expectCommandCounter++;
                    window.expectCommandMeta = meta;
                };

                window.expectCommandRemover = vorple.addEventListener( "expectCommand", expectCommandListener );
            });
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
            expect( browser.execute( () => window.expectCommandCounter ) ).to.equal( 1 );
        });

        it( "has the correct meta information", () => {
            expect( browser.execute( () => window.expectCommandMeta.type ) ).to.equal( "expectCommand" );
        });

        it( "triggers more than once", () => {
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.expectCommandCounter ) ).to.equal( 2 );
        });

        it( "is removed by calling the return value", () => {
            browser.execute( () => window.expectCommandRemover() );
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.expectCommandCounter ) ).to.equal( 2 ); // no change expected
        });

        it( "only one is removed when two identical listeners are added", () => {
            browser.execute( () => {
                window.doubleCommandCounter = 0;

                window.doubleCommandListener = () => {
                    window.doubleCommandCounter++;
                };

                vorple.addEventListener( "expectCommand", doubleCommandListener );
                vorple.addEventListener( "expectCommand", doubleCommandListener );
            });
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.doubleCommandCounter ) ).to.equal( 2 );   // triggers twice
            expect( browser.execute( () => vorple.removeEventListener( window.doubleCommandListener ) ) ).to.be.true;
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.doubleCommandCounter ) ).to.equal( 3 );   // triggers only once
        });
    });

    describe( "submitCommand event", () => {
        it( "doesn't trigger before submit event", () => {
            browser.execute( () => {
                window.submitCommandCounter = 0;

                const submitCommandListener = meta => {
                    window.submitCommandCounter++;
                    window.submitCommandMeta = meta;
                };

                window.submitCommandRemover = vorple.addEventListener( "submitCommand", submitCommandListener );
            });
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 0 );
        });

        it( "triggers correctly", () => {
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 1 );
        });

        it( "has the correct meta information", () => {
            expect( browser.execute( () => window.submitCommandMeta ) ).to.include(
                { 
                    type: "submitCommand",
                    input: "z",               
                    original: "z",            
                    userAction: false,
                    silent: false
                }
            );
        });

        it( "triggers more than once", () => {
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 2 );
        });

        it( "triggers for manual submit", () => {
            $( "#lineinput-field" ).setValue( "z" );
            browser.keys( "Enter" );
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 3 );
        });

        it( "user action is marked correctly", () => {
            expect( browser.execute( () => window.submitCommandMeta ) ).to.include(
                { 
                    userAction: true,
                    silent: false
                }
            );
        });

        it( "triggers for silent actions", () => {
            vorple( "prompt", "queueCommand", "z", { silent: true } );
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 4 );
        });

        it( "silent action is marked correctly", () => {
            expect( browser.execute( () => window.submitCommandMeta ) ).to.include(
                { 
                    userAction: false,
                    silent: true
                }
            );
        });

        it( "is removed by calling the return value", () => {
            browser.execute( () => window.submitCommandRemover() );
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.submitCommandCounter ) ).to.equal( 4 ); // no change expected
        });

        it( "is removed by calling removeEventListener with only the function", () => {
            browser.execute( () => {
                window.lineinputCounter = 0;

                window.lineinputListener = () => {
                    window.lineinputCounter++;
                };

                vorple.addEventListener( [ "expectCommand", "submitCommand" ], window.lineinputListener );
            });
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.lineinputCounter ) ).to.equal( 2 );   // expect + submit
            expect( browser.execute( () => vorple.removeEventListener( window.lineinputListener ) ) ).to.be.true;
            vorple( "prompt", "queueCommand", "z" );
            waitForLineInput();
            expect( browser.execute( () => window.lineinputCounter ) ).to.equal( 2 ); // no change expected
        });

        it( "promises pause execution", () => {
            browser.execute( () => {
                const submitCommandPromiseListener = () => new Promise( resolve => {
                    setTimeout( () => {
                        // remove this after it runs once! Otherwise slows down all future tests
                        vorple.removeEventListener( submitCommandPromiseListener );
                        resolve();
                    }, 1000 );
                });

                vorple.addEventListener( "submitCommand", submitCommandPromiseListener );
            });
            vorple( "prompt", "queueCommand", "z" );
            browser.pause(500);
            expect( $( "#lineinput" ).isExisting() ).to.be.false;
            browser.pause(600);
            expect( $( "#lineinput" ).isExisting() ).to.be.true;
        });
    });

    describe( "expectKeypress event", () => {
        it( "doesn't trigger before keypress event", () => {
            browser.execute( () => {
                window.expectKeypressCounter = 0;

                const expectKeypressListener = () => {
                    window.expectKeypressCounter++;
                };

                window.expectKeypressRemover = vorple.addEventListener( "expectKeypress", expectKeypressListener );
            });
            waitForLineInput();
            expect( browser.execute( () => window.expectKeypressCounter ) ).to.equal( 0 );
        });

        it( "triggers correctly", () => {
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 200 );
            expect( browser.execute( () => window.expectKeypressCounter ) ).to.equal( 1 );
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
        });

        it( "triggers more than once", () => {
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 200 );
            expect( browser.execute( () => window.expectKeypressCounter ) ).to.equal( 2 );
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
        });

        it( "is removed by calling the return value", () => {
            browser.execute( () => window.expectKeypressRemover() );
            vorple( "prompt", "queueCommand", "pause" );
            expect( browser.execute( () => window.expectKeypressCounter ) ).to.equal( 2 ); // no change expected
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
        });
    });

    describe( "submitKeypress event", () => {
        it( "doesn't trigger before keypress event", () => {
            browser.execute( () => {
                window.submitKeypressCounter = 0;

                const submitKeypressListener = meta => {
                    window.submitKeypressCounter++;
                    window.submitKeypressMeta = meta;
                };

                window.submitKeypressRemover = vorple.addEventListener( "submitKeypress", submitKeypressListener );
            });
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 0 );
        });

        it( "triggers correctly", () => {
            vorple( "prompt", "queueCommand", "pause" );
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 1 );
        });

        it( "has the correct meta information", () => {
            expect( browser.execute( () => window.submitKeypressMeta ) ).to.include(
                { 
                    type: "submitKeypress",
                    input: 32,       
                    original: 32,            
                    event: null,
                    userAction: false,
                    mouseClick: false
                }
            );
        });

        it( "triggers more than once", () => {
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 100 );
            expect( browser.execute( () => haven.input.getMode() ) ).to.equal( "getkey" );
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 2 );
        });

        it( "triggers for manual submit", () => {
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 50 );
            browser.keys( "Enter" );
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 3 );
        });

        it( "user action is marked correctly", () => {
            expect( browser.execute( () => window.submitKeypressMeta.userAction ) ).to.be.true;
        });

        it( "triggers for mouse clicks", () => {
            vorple( "prompt", "queueCommand", "pause" );
            browser.pause( 50 );
            $( ".lineinput.last" ).click();
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 4 );
        });

        it( "mouse clicks have the correct meta information", () => {
            // must remove the event object, otherwise the test complains about cyclic object value
            expect( browser.execute( () => ({ ...window.submitKeypressMeta, event: null }) ) ).to.include(
                { 
                    type: "submitKeypress",
                    input: null,       
                    original: null,            
                    userAction: true,
                    mouseClick: true
                }
            );

            expect( browser.execute( () => window.submitKeypressMeta.event instanceof MouseEvent ) ).to.be.true;
        });

        it( "is removed by calling the return value", () => {
            browser.execute( () => window.submitKeypressRemover() );
            vorple( "prompt", "queueCommand", "pause" );
            vorple( "prompt", "queueKeypress", " " );
            waitForLineInput();
            expect( browser.execute( () => window.submitKeypressCounter ) ).to.equal( 4 ); // no change expected
        });

        it( "promises pause execution", () => {
            browser.execute( () => {
                const submitKeypressPromiseListener = () => new Promise( resolve => {
                    setTimeout( () => {
                        // remove this after it runs once!
                        vorple.removeEventListener( submitKeypressPromiseListener );
                        resolve();
                    }, 1000 );
                });

                vorple.addEventListener( "submitKeypress", submitKeypressPromiseListener );
            });
            vorple( "prompt", "queueCommand", "pause" );
            vorple( "prompt", "queueKeypress", " " );
            browser.pause(500);
            expect( $( "#lineinput" ).isExisting() ).to.be.false;
            browser.pause(600);
            expect( $( "#lineinput" ).isExisting() ).to.be.true;
        });
    });

    describe( "quit event", () => {
        it( "triggers correctly", () => {
            browser.execute( () => {
                window.quitEventTriggered = false;

                const quitListener = () => {
                    window.quitEventTriggered = true;
                };

                vorple.addEventListener( "quit", quitListener );
            });
            waitForLineInput();
            vorple( "prompt", "queueCommand", "force quit" );
            browser.pause(100);
            expect( browser.execute( () => window.quitEventTriggered ) ).to.be.true;

            // reset for later tests
            browser.refresh();
            waitForLineInput();
        });
    });
});
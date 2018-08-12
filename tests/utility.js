let vorple = null;

// before all tests...
before( () => {
    // start the unit test game
    browser.url( "/?story=stories/unittest.ulx" );

    // wait for the game to have loaded (prompt exists)
    browser.waitForExist( "#lineinput", 5000 );
});


/**
 * Retrieves the value of a flag set by the test story.
 *
 * @param flagName
 * @return {boolean}
 */
module.exports.flagValue = flagName => browser.execute( flagName => !!window.testFlags[ flagName ], flagName ).value;


/**
 * Returns the vorple object. Note that methods are returned as empty objects.
 */
module.exports.getVorple = () => browser.execute( () => window.vorple ).value;


/**
 * Executes a Vorple method in the game.
 *
 * For example, vorple( "prompt", "queueCommand", "undo", true )
 * is the same as vorple.prompt.queueCommand( "undo", true )
 *
 * If the first parameter (module) is null, the method is evaluated as
 * vorple[ method ]( ...params )
 *
 * @param module
 * @param method
 * @param params
 * @return {*}
 */
module.exports.vorple = ( module, method, ...params ) => {
    return browser.execute( ( module, method, ...params ) => {
        if( module ) {
            return window.vorple[ module ][ method ]( ...params );
        }

        return window.vorple[ method ]( ...params );
    }, module, method, ...params ).value;
};
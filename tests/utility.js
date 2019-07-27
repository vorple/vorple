/**
 * Retrieves the value of a flag set by the test story.
 *
 * @param flagName
 * @return {boolean}
 */
module.exports.flagValue = flagName => browser.execute( flagName => !!window.testFlags[ flagName ], flagName );


/**
 * Returns the vorple object. Note that methods are returned as empty objects.
 */
module.exports.getVorple = () => browser.execute( () => window.vorple );


/**
 * Sends a command to the prompt.
 */
module.exports.sendCommand = ( command, silent ) => vorple( "prompt", "queueCommand", command, silent );


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
function vorple( module, method, ...params ) {
    return browser.execute( ( module, method, params ) => {
        if( module ) {
            return window.vorple[ module ][ method ]( ...params );
        }

        return window.vorple[ method ]( ...params );
    }, module || undefined, method, params );
};

module.exports.vorple = vorple;


/**
 * Wait for the line input prompt to appear (game has loaded or turn has ended)
 */
module.exports.waitForLineInput = () => $( "#lineinput" ).waitForExist( 10000 );

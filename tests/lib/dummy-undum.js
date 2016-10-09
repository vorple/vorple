/**
 * The minimum amount of code required to get Undum running
 */

require([ 'jquery' ], function( $ ) {
    $( "html" ).attr( "lang", 'en' );

    undum.game.situations.start = new undum.SimpleSituation( "<p>start</p>" );

    $( function () {
        $( 'body' ).append( '<div id="content"></div>' );
    } );

    undum.game.init = function ( character, system ) {
        window.undumSystem = system;
    }
});
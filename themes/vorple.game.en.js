/**
 * Give a unique id below. You can use whatever random identifier you like.
 * A UUID generator at http://vorple-if.com/uuid/ creates valid IFIDs.
 */

undum.game.id = "INSERT UNIQUE ID HERE";
undum.game.version = "1.0";
undum.game.start = "start";


/**
 * Uncomment the following line during developing 
 * and comment it out again when releasing.
 */

// vorple.core.debug = true;


/**
 * Uncomment the following line if you want to show
 * a confirmation message when the reader is leaving the page. 
 */

// vorple.core.settings.confirmWindowClose = true;


/**
 * If you use undum.game.afterEnter or undum.game.afterAction 
 * global event functions, it's important to include Vorple's
 * event triggers as shown below!
 */

undum.game.afterEnter = function( character, system, from, to ) {
    vorple.undum.afterEnterTrigger( character, system, from, to );

     // other content here
};

undum.game.afterAction = function( character, system, situation, action ) {
    vorple.undum.afterActionTrigger( character, system, situation, action );

    // other content here
};



/**
 * Situations.
 */

undum.game.situations.start = new undum.SimpleSituation(
    vorple.html.p( 'Replace me with story content' )
);


undum.game.init = function( character, system ) {
    // remember to keep the initialization line inside undum.game.init.
    vorple.core.init( system );
};
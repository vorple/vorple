module( 'parser' );

/**
 * We need to stop the test execution here and wait for Parchment
 * to finish loading. The event story will call start() when it
 * begins. Conveniently we can use this to unit test the
 * TurnComplete event at the same time.
 */
test( 'events', function() {
	// set a cookie for testing later
	vorple.cookie.write( 'old', 'ok' );

    // re-initialize Vorple with Parchment
    vorple.core.init( parchment );

	$( document ).one( 'TurnComplete.vorple', function() {
		start();
	});

    parchment.options.lib_path = '../vendor/parchment/';
    parchment.options.default_story = [ "Inform7.test Materials/Release/interpreter/Vorple for Inform 7 Unit Tests.zblorb.js" ];
    parchment.options.lock_story = 1;

	parchment.init();
			
	stop();
	ok( true, 'TurnComplete event fired' );	
});


/**
 * CORE
 */

test( 'engine detection', function() {
	ok( vorple.core.engine( 'parchment' ), 'engine detected as Parchment' );
	ok( !vorple.core.engine( 'undum' ), 'engine not detected as Undum' );
	equal( vorple.core.engine(), 'parchment', 'engine test returns parchment' );
});

test( 'eval', function() {
	window.evalTest = false;
	vorple.parser.sendCommand( 'try core eval' );
	ok( window.evalTest, 'eval' );
});

test( 'user input', function() {	
	$( '.vorplePrompt input' )
		.val( 'echo ok' )
		.trigger( $.Event( 'keydown', { which: 13 } ) ); // enter
	equal( $.trim( $( '.previousTurn .turnContent' ).text() ),  'ok', 'command sent' );
});

test( 'escaping', function() {
	vorple.parser.sendCommand( 'try core escape' );
	equal( $.trim( $( '.previousTurn .turnContent' ).text() ),  '\\\"test\\\" \\\\ \\\'test\\\'', 'escaping quotes' );
	
	vorple.parser.sendCommand( 'try core escape with line breaks' );
	equal( $.trim( $( '.previousTurn .turnContent' ).text() ),  '\\\"line-break\\\"', 'escaping quotes with custom line breaks' );
});


/**
 * COOKIES
 */

test( 'persistent storage', function() {
    vorple.parser.sendCommand( 'print cookie old' );
    equal( 
        $.trim( $( '.previousTurn .turnContent' ).text() ), 
        'ok', 
        'pre-existing cookie' 
    );
     
    vorple.parser.sendCommand( '__set_cookie new=foo' );
    equal( vorple.cookie.read( 'new' ), 'foo', 'new cookie set' );
    
    vorple.parser.sendCommand( 'print cookie new' );
    equal( 
        $.trim( $( '.previousTurn .turnContent' ).text() ), 
        'foo', 
        'new cookie retrieved from story' 
    );   
    
    vorple.parser.sendCommand( 'remove cookie new' );
    equal(
        vorple.cookie.read( 'new' ), null, 'cookie removed from browser'        
    );
    
    vorple.parser.sendCommand( 'print cookie new' );
    equal( 
        $.trim( $( '.previousTurn .turnContent' ).text() ), 
        '', 
        'cookie removed from story' 
    );   
     
    // cleanup
    vorple.cookie.remove( 'old' );
});


/**
 * NOTIFY
 */

test( 'notifications', function() {
	expect( 9 );
    $( '.noty_message' ).remove();
	
	vorple.parser.sendCommand( 'try notify basic' );
	equal( 
			$( '.noty_message .noty_text' ).text(), 
			'test',
			'show notification'
	);
	
	// the vorple.notify.test.js already includes a test that will
	// trigger when notificatons are cleared.
	vorple.parser.sendCommand( 'try notify clear' );
	$( '.noty_message' ).remove();

	vorple.parser.sendCommand( 'try notify alert' );
	equal( $( '.noty_message .noty_text' ).text(), 'parchment alert test', 'alert' );
	vorple.parser.sendCommand( 'try notify clear' );

    $( '#noty_bottomLeft_layout_container' ).remove();
 	vorple.parser.sendCommand( 'try notify bottom left' );
	equal( $( '#noty_bottomLeft_layout_container .noty_message' ).length, 1, 'bottom left' );
	vorple.parser.sendCommand( 'try notify clear' );
	
	$( '#noty_topLeft_layout_container' ).remove();
 	vorple.parser.sendCommand( 'try notify change default' );
	equal( $( '#noty_topLeft_layout_container .noty_message' ).length, 1, 'changing default location' );
	vorple.parser.sendCommand( 'try notify clear' );
	
});

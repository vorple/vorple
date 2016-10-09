require( [ 'jquery', 'zvm', 'qunit', 'core', 'parser', 'tooltip' ], function ( $, ZVM, QUnit, core, parser, tooltip ) {
    window.ZVM = ZVM;
    window.vorple = {
        core: core,
        parser: parser,
        tooltip: tooltip
    };

    QUnit.module( 'parser' );

    /**
     * We need to stop the test execution here and wait for Parchment
     * to finish loading. The event story will call start() when it
     * begins. Conveniently we can use this to unit test the
     * TurnComplete event at the same time.
     */

    QUnit.test( 'events', function ( assert ) {
        var done1 = assert.async(),
            done2 = assert.async();

        assert.expect( 2 );

        window.parchment_options = {
            lib_path: '../../parchment/lib/',
            default_story: [ "lib/unittest.z8" ],
            lock_story: 1
        };

        require( [ 'parchment' ], function () {
            // re-initialize Vorple with Parchment
            core.init( parchment );

            assert.ok( true, 'Parchment initialized' );
            done1();
        } );

        $( document ).one( 'TurnComplete', function () {
            assert.ok( true, 'TurnComplete event fired' );
            done2();
        } );
    } );


    QUnit.test( 'engine detection', function( assert ) {
        assert.ok( core.engine( 'parchment' ), 'engine detected as Parchment' );
        assert.ok( !core.engine( 'undum' ), 'engine not detected as Undum' );
        assert.equal( core.engine(), 'parchment', 'engine test returns "parchment"' );
    } );

    QUnit.module( 'I7 extensions' );

    function response() {
        return $.trim( $( '.previousTurn .turnContent' ).text() );
    }

    /**
     * CORE
     */

    QUnit.test( 'Vorple detection', function( assert ) {
        parser.sendCommand( 'try core vorple detect' );
        assert.equal( response(), 'Pass', 'command sent' );
    } );

    QUnit.test( 'eval', function( assert ) {
        window.evalTest = false;
        parser.sendCommand( 'try core eval' );
        assert.ok( window.evalTest, 'eval' );
    } );

    QUnit.test( 'user input', function( assert ) {
        $( '.vorplePrompt input' )
            .val( 'echo ok' )
            .trigger( $.Event( 'keydown', {which: 13} ) ); // enter
        assert.equal( response(), 'ok', 'command sent' );
    } );

    QUnit.test( 'escaping', function( assert ) {
        parser.sendCommand( 'try core escape' );
        assert.equal( response(), '\\\"test\\\" \\\\ \\\'test\\\'', 'escaping quotes' );

        parser.sendCommand( 'try core escape with line breaks' );
        assert.equal( response(), '\\\"line-break\\\"', 'escaping quotes with custom line breaks' );
    } );

    QUnit.test( 'command queues', function( assert ) {
        window.queueResult = '';
        parser.sendCommand( 'try core queue' );
        assert.equal( window.queueResult, '1ab2cd3ef', 'command and subcommand queues interleaved correctly' );
    } );

});


/**
 * COOKIES
 */

/*
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

 */

/**
 * NOTIFY
 */

/*
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
 */
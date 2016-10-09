define([ 'qunit', 'soundmanager2', 'media' ], function( QUnit, SoundManager2, media ) {
    var soundManager = SoundManager2.getInstance();

    QUnit.module( 'media' );

    QUnit.test( 'playSound', function( assert ) {
        var done = assert.async();

        assert.expect( 18 );

        // soundManager needs time to initialize;
        // start the tests only when it's ready.
        if( !soundManager.ok() ) {
            soundManager.onready( function() { audioTests( done, assert ) } );
        }
        else {
            audioTests( done, assert );
        }
    } );

    function audioTests( done, assert ) {
        var audioId1 = media.playSound( 'cheer.mp3' );
        var audioObject1 = soundManager.getSoundById( audioId1 );
        assert.ok( audioObject1.playState, 'Sound playing or buffering' );

        var audioId2 = media.playSound( 'cheer.mp3' );
        var audioObject2 = soundManager.getSoundById( audioId2 );
        var done2 = assert.async();
        media.stopSound( audioId1, 100, function () {
            assert.ok(
                audioObject1.volume === 0 && audioObject2.volume > 0,
                'One sound stopped'
            );
            done2();
        } );

        audioId1 = media.playSound( 'cheer.mp3' );
        audioObject1 = soundManager.getSoundById( audioId1 );
        var audioId3 = media.playSound( 'cheer.mp3' );
        var audioObject3 = soundManager.getSoundById( audioId3 );
        var done3 = assert.async();
        media.stopSounds( 100, function () {
            assert.ok(
                audioObject1.volume === 0 && audioObject2.volume === 0 && audioObject3.volume === 0,
                'All sounds stopped'
            );
            done3();
        } );

        // music
        media.playMusic( 'emptyrooms.mp3' );
        assert.ok( soundManager.getSoundById( 'vorpleBgMusic' ).playState, 'Music playing or buffering' );

        var done4 = assert.async();
        media.stopMusic( 100, function () {
            assert.equal( soundManager.getSoundById( 'vorpleBgMusic' ).playState, 0, 'Music stopped' );
            done4();
        } );

        media.playMusic( 'emptyrooms.mp3' );
        audioId1 = media.playSound( 'cheer.mp3' );

        media.mute( {sound: true, music: true} );

        assert.ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted' );
        assert.ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted' );

        media.mute( {sound: false, music: false} );

        assert.ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted' );
        assert.ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted' );

        media.muteAll();

        assert.ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted with all' );
        assert.ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted with all' );

        media.muteAll( false );

        assert.ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted with all' );
        assert.ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted with all' );

        media.toggleMute( [ 'sound', 'music' ] );

        assert.ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted with toggle' );
        assert.ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted with toggle' );

        media.toggleMute( [ 'sound', 'music' ] );

        assert.ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted with toggle' );
        assert.ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted with toggle' );

        done();

        var done5 = assert.async();

        media.stopAll( 100 );
        setTimeout( function () {
            assert.ok(
                !soundManager.getSoundById( 'vorpleBgMusic' ).playState && !soundManager.getSoundById( audioId1 ).playState,
                'All audio stopped'
            );
            done5();
        }, 80 );
    }

    QUnit.test( 'image', function( assert ) {
        assert.equal( $( media.image( 'dodo.jpg' ) ).attr( 'src' ), media.defaults.imagePath + "/dodo.jpg", 'image relative path' );
        assert.equal( $( media.image( '/dodo.jpg' ) ).attr( 'src' ), '/dodo.jpg', 'image absolute path' );

        var $img = $( media.image( 'dodo.jpg', {
            classes: 'baz',
            id: 'fizz'
        } ) );
        assert.ok( $img.hasClass( 'baz' ) && $img.attr( 'id' ) === 'fizz', 'image options' );
    } );

    QUnit.test( 'preloadImage', function( assert ) {
        assert.equal( typeof media.preloadImage( 'dodo.jpg' ), 'object', 'one image' );
        assert.equal( typeof media.preloadImage( [ 'dodo.jpg', 'puppy.jpg' ] ), 'object', 'two images' );
    } );

    QUnit.test( 'YouTube', function( assert ) {
        var $youtube = $( media.youtube( 'foo', {
            width: 100,
            height: 200
        } ) );
        var url = $youtube.find( 'param[name="movie"]' ).attr( 'value' );
        var params = url.split( '&' );
        var firstParam = params[ 0 ].split( '?' );
        var cleanUrl = firstParam[ 0 ];
        params.push( firstParam[ 1 ] );

        assert.equal( cleanUrl.indexOf( 'http://www.youtube.com/v/' ), 0, 'correct url' );

        assert.ok( $.inArray( 'foo', cleanUrl.split( '/' ) ), 'correct video id' );

        assert.equal( $youtube.attr( 'width' ), 100, 'object attributes' );
    } );

});
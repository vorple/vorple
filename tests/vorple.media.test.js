module( 'media' );

$(function() {
    vorple.media.defaults.audioPath = '../stories/undum/everything/media/audio';
    vorple.media.defaults.musicPath = '../stories/undum/everything/media/music';
});

test( 'playSound', function() {
    expect( 18 );
    
    // soundManager needs time to initialize;
    // start the tests only when it's ready.
    if( !soundManager.ok() ) {
        stop();
        soundManager.onready( audioTests );
    }
    else {
        audioTests();
    }
});

function audioTests() {
    start();

    var audioId1 = vorple.media.playSound( 'cheer.mp3' );
    var audioObject1 = soundManager.getSoundById( audioId1 );
    ok( audioObject1.playState, 'Sound playing or buffering' );
    
    var audioId2 = vorple.media.playSound( 'cheer.mp3' );
    var audioObject2 = soundManager.getSoundById( audioId2 );
    stop();
    vorple.media.stopSound( audioId1, 100, function() { 
        start();
        ok( 
            audioObject1.volume === 0
                && audioObject2.volume > 0, 
            'One sound stopped' 
        );
    });
    
    audioId1 = vorple.media.playSound( 'cheer.mp3' );
    audioObject1 = soundManager.getSoundById( audioId1 );
    var audioId3 = vorple.media.playSound( 'cheer.mp3' );
    var audioObject3 = soundManager.getSoundById( audioId3 );
    stop();
    vorple.media.stopSounds( 100, function() {
        start();
        ok( 
            audioObject1.volume === 0
                && audioObject2.volume === 0
                && audioObject3.volume === 0,
            'All sounds stopped'
        );
    });
    
    // music
    vorple.media.playMusic( 'emptyrooms.mp3' );
    ok( soundManager.getSoundById( 'vorpleBgMusic' ).playState, 'Music playing or buffering' );
    
    stop();
    vorple.media.stopMusic( 100, function() {
        start();
        equal( soundManager.getSoundById( 'vorpleBgMusic' ).playState, 0, 'Music stopped' );
    });
    
    vorple.media.playMusic( 'emptyrooms.mp3' );
    audioId1 = vorple.media.playSound( 'cheer.mp3' );
    
    vorple.media.mute({ sound: true, music: true });
    
    ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted' );
    ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted' );

    vorple.media.mute({ sound: false, music: false });

    ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted' );
    ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted' );
    
    vorple.media.muteAll();

    ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted with all' );
    ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted with all' );

    vorple.media.muteAll( false );
    
    ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted with all' );
    ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted with all' );

    vorple.media.toggleMute([ 'sound', 'music' ]);

    ok( soundManager.getSoundById( audioId1 ).muted, 'Sound muted with toggle' );
    ok( soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music muted with toggle' );

    vorple.media.toggleMute([ 'sound', 'music' ]);
    
    ok( !soundManager.getSoundById( audioId1 ).muted, 'Sound unmuted with toggle' );
    ok( !soundManager.getSoundById( 'vorpleBgMusic' ).muted, 'Music unmuted with toggle' );

    stop();
    vorple.media.stopAll( 100 );
    setTimeout( function() {
        start();
        ok(
            !soundManager.getSoundById( 'vorpleBgMusic' ).playState
            && !soundManager.getSoundById( audioId1 ).playState,
            'All audio stopped'
        );
    }, 80 );
}

test( 'image', function() {
    equal( vorple.media.image( 'foo.jpg' ), '<img src="media/image/foo.jpg" />' );

    equal( vorple.media.image( '/foo.jpg' ), '<img src="/foo.jpg" />' );

    var $img = $( vorple.media.image( 'foo.jpg', {
        classes : 'baz',
        id : 'fizz'
    } ) );
    ok( $img.hasClass( 'baz' ) && $img.attr( 'id' ) == 'fizz', 'image options' )
} );

test( 'preloadImage', function() {
    vorple.media.defaults.imagePath = '../stories/everything/media/image';

    equal( typeof vorple.media.preloadImage( 'dodo.jpg' ), 'object', 'one image' );
    equal( typeof vorple.media.preloadImage( [ 'dodo.jpg', 'puppy,jpg' ] ), 'object', 'two images' );
} );

test( 'YouTube', function() {
    var $youtube = $( vorple.media.youtube( 'foo', {
        width : 100,
        height : 200
    } ) );
    var url = $youtube.find( 'param[name="movie"]' ).attr( 'value' );
    var params = url.split( '&' );
    var firstParam = params[ 0 ].split( '?' );
    var cleanUrl = firstParam[ 0 ];
    params.push( firstParam[ 1 ] );

    equal( cleanUrl.indexOf( 'http://www.youtube.com/v/' ), 0, 'correct url' );

    ok( $.inArray( 'foo', cleanUrl.split( '/' ) ), 'correct video id' );

    equal( $youtube.attr( 'width' ), 100, 'object attributes' );
} );

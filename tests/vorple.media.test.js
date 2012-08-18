module( 'media' );

$(function() {
    vorple.media.defaults.swfPath = '../lib';
    vorple.media.defaults.audioPath = '../stories/demo/media/audio';
    vorple.media.defaults.videoPath = '../stories/demo/media/video';
});

test( 'Container', function( ) {
    var $playerContainer = $( '<div id="playerContainer"></div>' );
    var $mainContainer = $( '<div id="mainContainer"></div>' );

    $( 'body' ).append( $playerContainer );
    $( 'body' ).append( $mainContainer );

    var $container1 = vorple.media._createPlayer( );

    ok( $( '#' + vorple.media.defaults.mainContainer ).children( ).length == 1, 'player created in main container' );

    equal( vorple.media._createPlayer( {
        element : $playerContainer
    } ), $playerContainer, 'jQuery object as container returned as is' );

    equal( vorple.media._createPlayer( {
        element : 'playerContainer'
    } ).attr( 'id' ), 'playerContainer', 'string as container returned as a jQuery object' );

    equal( vorple.media._createPlayer( {
        parent : $mainContainer
    } ).parent( ).attr( 'id' ), 'mainContainer', 'jQuery main container' );

    equal( vorple.media._createPlayer( {
        parent : 'secondMainContainer'
    } ).parent( ).attr( 'id' ), 'secondMainContainer', "string main container, doesn't exist" );

    equal( vorple.media._createPlayer( {
        parent : 'mainContainer'
    } ).parent( ).attr( 'id' ), 'mainContainer', "string main container, existing" );

} );

test( 'image', function( ) {
    equal( vorple.media.image( 'foo.jpg' ), '<img src="media/image/foo.jpg" />' );

    equal( vorple.media.image( '/foo.jpg' ), '<img src="/foo.jpg" />' );

    var $img = $( vorple.media.image( 'foo.jpg', {
        classes : 'baz',
        id : 'fizz'
    } ) );
    ok( $img.hasClass( 'baz' ) && $img.attr( 'id' ) == 'fizz', 'image options' )
} );

test( 'preloadImage', function( ) {
    vorple.media.defaults.imagePath = '../stories/everything/media/image';

    equal( typeof vorple.media.preloadImage( 'dodo.jpg' ), 'object', 'one image' );

    equal( typeof vorple.media.preloadImage( [ 'dodo.jpg', 'puppy,jpg' ] ), 'object', 'two images' );
} );

test( 'YouTube', function( ) {
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

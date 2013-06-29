module( 'core' );

test( 'engine', function( ) {
    vorple.core.init( undum );
    equal( vorple.core.engine(), 'undum', 'Undum loaded' );
    equal( vorple.core.engine( 'undum' ), true, 'testing for Undum after it is loaded' );
    equal( vorple.core.engine( 'parchment' ), false, 'testing for anything else after Undum has loaded' );
} );


module( 'undum' );

test( 'dispose', function( ) {
    for( var i = 1; i <= 10; ++i ) {
        var action = (i % 2 ) ? './' : '';
        $( '#content' ).append( '<a href="' + action + 'testlink' + i + '" id="disposeTest' + i + '">foo</a>' );
    }

    vorple.undum.dispose( 'testlink1' );
    vorple.undum.dispose( 'testlink2' );
    vorple.undum.dispose( './testlink3' );
    vorple.undum.dispose( 'testlink4', 'testlink5' );
    vorple.undum.dispose( [ 'testlink6', 'testlink7' ] );
    vorple.undum.dispose( [ 'testlink8', 'testlink9' ], 'testlink10' );

    equal( $( '#disposeTest1' ).length, 0, 'link actually disposed' );

    ok( vorple.undum.isDisposed( 'testlink2' ), 'action link disposed' );

    ok( vorple.undum.isDisposed( 'testlink3' ), 'situation link disposed, given as action' );

    ok( vorple.undum.isDisposed( 'testlink4' ) && vorple.undum.isDisposed( 'testlink5' ), 'two links disposed' );

    ok( vorple.undum.isDisposed( 'testlink6' ) && vorple.undum.isDisposed( 'testlink7' ), 'two links disposed as an array' );

    ok( vorple.undum.isDisposed( 'testlink8' ) && vorple.undum.isDisposed( 'testlink9' ) && vorple.undum.isDisposed( 'testlink10' ), 'three links disposed as an array and a string' );

} );


test( 'isDisposed', function( ) {
    vorple.undum.dispose( 'isDisposed' );

    ok( vorple.undum.isDisposed( 'isDisposed' ), 'link is disposed' );

    ok( !vorple.undum.isDisposed( 'isNotDisposed' ), 'link is not disposed' );
} );

test( 'reactivation', function( ) {
    vorple.undum.dispose( 'reactivate1', 'reactivate2', './reactivate3', 'reactivate4', 'reactivate5', 'reactivate6', 'reactivate7', 'reactivate8', 'reactivate9' );

    vorple.undum.reactivate( 'reactivate1' );
    vorple.undum.reactivate( './reactivate2' );
    vorple.undum.reactivate( 'reactivate3', 'reactivate4' );
    vorple.undum.reactivate( [ 'reactivate5', 'reactivate6' ] );
    vorple.undum.reactivate( [ 'reactivate7', 'reactivate8' ], 'reactivate9' );

    ok( !vorple.undum.isDisposed( 'reactivate' ), 'reactivation with one link' );

    ok( !vorple.undum.isDisposed( 'reactivate2' ), 'reactivating an action as a situation' );

    ok( !vorple.undum.isDisposed( 'reactivate3' ) && !vorple.undum.isDisposed( 'reactivate4' ), 'reactivation with two links' );

    ok( !vorple.undum.isDisposed( 'reactivate5' ) && !vorple.undum.isDisposed( 'reactivate6' ), 'reactivation with two links as an array' );

    ok( !vorple.undum.isDisposed( 'reactivate7' ) && !vorple.undum.isDisposed( 'reactivate8' ) && !vorple.undum.isDisposed( 'reactivate9' ), 'reactivation with two links as an array and one as a string' );
} );

// cleanup the test page
$( '#content' ).hide( ); 
require([ 'jquery', 'core', 'undum' ], function( $, core, vorpleUndum ) {
    module( 'core' );

    test( 'engine', function () {
        core.init( undumSystem );
        equal( core.engine(), 'undum', 'Undum loaded' );
        equal( core.engine( 'undum' ), true, 'testing for Undum after it is loaded' );
        equal( core.engine( 'parchment' ), false, 'testing for anything else after Undum has loaded' );
    } );


    module( 'undum' );

    test( 'dispose', function () {
        for( var i = 1; i <= 10; ++i ) {
            var action = (i % 2 ) ? './' : '';
            $( '#content' ).append( '<a href="' + action + 'testlink' + i + '" id="disposeTest' + i + '">foo</a>' );
        }

        vorpleUndum.dispose( 'testlink1' );
        vorpleUndum.dispose( 'testlink2' );
        vorpleUndum.dispose( './testlink3' );
        vorpleUndum.dispose( 'testlink4', 'testlink5' );
        vorpleUndum.dispose( [ 'testlink6', 'testlink7' ] );
        vorpleUndum.dispose( [ 'testlink8', 'testlink9' ], 'testlink10' );

        equal( $( '#disposeTest1' ).length, 0, 'link actually disposed' );

        ok( vorpleUndum.isDisposed( 'testlink2' ), 'action link disposed' );

        ok( vorpleUndum.isDisposed( 'testlink3' ), 'situation link disposed, given as action' );

        ok( vorpleUndum.isDisposed( 'testlink4' ) && vorpleUndum.isDisposed( 'testlink5' ), 'two links disposed' );

        ok( vorpleUndum.isDisposed( 'testlink6' ) && vorpleUndum.isDisposed( 'testlink7' ), 'two links disposed as an array' );

        ok( vorpleUndum.isDisposed( 'testlink8' ) && vorpleUndum.isDisposed( 'testlink9' ) && vorpleUndum.isDisposed( 'testlink10' ), 'three links disposed as an array and a string' );

    } );


    test( 'isDisposed', function () {
        vorpleUndum.dispose( 'isDisposed' );

        ok( vorpleUndum.isDisposed( 'isDisposed' ), 'link is disposed' );

        ok( !vorpleUndum.isDisposed( 'isNotDisposed' ), 'link is not disposed' );
    } );

    test( 'reactivation', function () {
        vorpleUndum.dispose( 'reactivate1', 'reactivate2', './reactivate3', 'reactivate4', 'reactivate5', 'reactivate6', 'reactivate7', 'reactivate8', 'reactivate9' );

        vorpleUndum.reactivate( 'reactivate1' );
        vorpleUndum.reactivate( './reactivate2' );
        vorpleUndum.reactivate( 'reactivate3', 'reactivate4' );
        vorpleUndum.reactivate( [ 'reactivate5', 'reactivate6' ] );
        vorpleUndum.reactivate( [ 'reactivate7', 'reactivate8' ], 'reactivate9' );

        ok( !vorpleUndum.isDisposed( 'reactivate' ), 'reactivation with one link' );

        ok( !vorpleUndum.isDisposed( 'reactivate2' ), 'reactivating an action as a situation' );

        ok( !vorpleUndum.isDisposed( 'reactivate3' ) && !vorpleUndum.isDisposed( 'reactivate4' ), 'reactivation with two links' );

        ok( !vorpleUndum.isDisposed( 'reactivate5' ) && !vorpleUndum.isDisposed( 'reactivate6' ), 'reactivation with two links as an array' );

        ok( !vorpleUndum.isDisposed( 'reactivate7' ) && !vorpleUndum.isDisposed( 'reactivate8' ) && !vorpleUndum.isDisposed( 'reactivate9' ), 'reactivation with two links as an array and one as a string' );
    } );

// cleanup the test page
    $( '#content' ).hide();
});
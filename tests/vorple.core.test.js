module( 'core' );

test( 'init', function() {
    expect( 1 );

    $( document ).one( 'init.vorple', function() {
        ok( true, 'Init hook triggered' );
    } );

    vorple.core.init();
} );

/**
 * There are more engine tests in specific engine modules
 */
test( 'engine', function() {
    equal( vorple.core.engine(), null, 'no engine loaded' );
    equal( vorple.core.engine( 'undum' ), false, 'testing for undum before it is loaded' );
    equal( vorple.core.engine( 'parchment' ), false, 'testing for parchment before it is loaded' );
    equal( vorple.core.engine( 'doesntexist' ), false, 'nonexisting engine' );
    
    vorple.core.init( {} );
    equal( vorple.core.engine(), false, 'invalid engine' );
    
    // re-init
    vorple.core.init();
});

test( 'generateId', function() {
    // This is of course way too small sample guarantee that the ids would
    // always be unique (and in theory we can never be sure), but it'll be
    // enough to see if rapid generation could produce same ids.
    var ids = [ ];
    var allUnique = true;
    var noneStartsWithNumber = true;

    for( var i = 0; i < 1000; ++i ) {
        var id = vorple.core.generateId();

        for( var j = 0; j < ids.length; ++j ) {
            if( ids[ j ] == id ) {
                allUnique = false;
            }
        }

        // charcode 48 == '0', 57 == '9'
        if( id.charCodeAt( 0 ) >= 48 && id.charCodeAt( 0 ) <= 57 ) {
            noneStartsWithNumber = false;
        }

        ids.push( id );
    }

    ok( allUnique, 'All generated ids unique after ' + i + ' iterations' );
    ok( noneStartsWithNumber, 'No id starts with a number' );

    equal( vorple.core.generateId().length, 32, 'Default length 32' );

    equal( vorple.core.generateId( 10 ).length, 10, 'Custom length' );
});

test( 'onbeforeunload', function() {
    var oldSettings = {
        confirmWindowClose: vorple.core.settings.confirmWindowClose,
        debug: vorple.core.settings.debug
    };
    
    vorple.core.settings.confirmWindowClose = false;
    vorple.core.settings.debug = false;
    equal(
        window.onbeforeunload(),
        undefined,
        "no return value when confirmWindowClose == false and debug == false"
    );

    vorple.core.settings.confirmWindowClose = true;
    vorple.core.settings.debug = true;
    equal(
        window.onbeforeunload(),
        undefined,
        "no return value when confirmWindowClose == true and debug == true"
    );
    
    vorple.core.settings.debug = false;
    equal( 
        window.onbeforeunload(), 
        "You are about to leave the story. "
        + "Any unsaved progress will be lost. "
        + "Are you sure you want to continue?",
        'default message'
    );
    
    vorple.core.settings.confirmWindowClose = "Custom message";
    
    equal(
        window.onbeforeunload(),
        "Custom message",
        'custom message'
    );
    
    // reset old settings
    vorple.core.settings.confirmWindowClose = false;
    vorple.core.settings.debug = false;
});

test( 'requireRelease', function() {
    var currentRel = vorple.core.getRelease();

    ok( vorple.core.requireRelease( currentRel - 1 ), 'lower release' );
    ok( vorple.core.requireRelease( currentRel ), 'exact release' );
    raises( function() {
        vorple.core.requireRelease( currentRel + 1 )
    } );

    raises( function() {
        vorple.core.requireRelease( currentRel + 1, 'Wrong release' );
    }, function( error ) {
        return (error.message === "Wrong release" );
    }, 'custom error message' );

    ok( vorple.core.requireRelease( [ currentRel, currentRel + 1 ] ), 'with max release' );
    raises( function() {
        vorple.core.requireRelease( [ currentRel - 2, currentRel - 1 ] )
    } );

    var errorCallback = false;

    var callback = function() {
        errorCallback = true;
    };

    vorple.core.requireRelease( currentRel + 1, callback );
    ok( errorCallback, 'callback' );
} ); 
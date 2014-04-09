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
            if( ids[ j ] === id ) {
                allUnique = false;
                break;
            }
        }

        // charcode 48 == '0', 57 == '9'
        if( id.charCodeAt( 0 ) >= 48 && id.charCodeAt( 0 ) <= 57 ) {
            noneStartsWithNumber = false;
        }

        ids.push( id );
    }

    ok( allUnique, 'all generated ids unique after ' + i + ' iterations' );
    ok( noneStartsWithNumber, 'no id starts with a number' );

    equal( vorple.core.generateId().length, 32, 'default length 32' );

    equal( vorple.core.generateId( 10 ).length, 10, 'custom length' );
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
    vorple.core.settings = oldSettings;
});

test( 'getVersion', function() {
    var version = vorple.core.getVersion();

    equal( typeof version, 'string', 'version number is returned as a string' );
    ok( /^\d+\.\d+(\.\d+)?$/.test( version ), 'matches x.y[.z] format' );
});

test( 'requireVersion', function() {
    var currentVersion = vorple.core.getVersion();

    ok( vorple.core.requireVersion( currentVersion ), 'exact release' );
    ok( vorple.core.requireVersion( parseInt( currentVersion, 10 ) ), 'major version, integer' );

    raises( function() { vorple.core.requireVersion( '2.4' ); }, 'past release' );
    raises( function() { vorple.core.requireVersion( '10.0' ); }, 'future release' );
    raises( function() { vorple.core.requireVersion( 'foo' ); }, 'invalid version number' );

    raises( function() {
        vorple.core.requireVersion( '10.0', 'Wrong release' );
    }, function( error ) {
        return (error.message === "Wrong release" );
    }, 'custom error message' );

    ok( vorple.core.requireVersion( [ currentVersion, '10.0' ] ), 'with boundaries' );
    raises( function() {
        vorple.core.requireVersion( [ 1, '2.3' ] );
    }, 'past release boundaries' );

    var errorCallback = false;

    var callback = function() {
        errorCallback = true;
    };

    vorple.core.requireVersion( '10.0', callback );
    ok( errorCallback, 'error callback' );
});
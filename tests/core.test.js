require([ 'jquery', 'qunit', 'core' ], function( $, QUnit, core ) {
    QUnit.module( 'core' );

    QUnit.test( 'init', function( assert ) {
        assert.expect( 1 );

        $( document ).one( 'init.vorple', function() {
            assert.ok( true, 'Init hook triggered' );
        });

        core.init();
    } );

    /**
     * There are more engine tests in specific engine modules
     */
    QUnit.test( 'engine', function( assert ) {
        assert.equal( core.engine(), null, 'no engine loaded' );
        assert.equal( core.engine( 'undum' ), false, 'testing for undum before it is loaded' );
        assert.equal( core.engine( 'parchment' ), false, 'testing for parchment before it is loaded' );
        assert.equal( core.engine( 'doesntexist' ), false, 'nonexisting engine' );

        core.init( {} );
        assert.equal( core.engine(), false, 'invalid engine' );

        // re-init
        core.init();
    } );

    QUnit.test( 'generateId', function( assert ) {
        // This is of course way too small sample guarantee that the ids would
        // always be unique (and in theory we can never be sure), but it'll be
        // enough to see if rapid generation could produce same ids.
        var ids = [];
        var allUnique = true;
        var noneStartsWithNumber = true;

        for( var i = 0; i < 1000; ++i ) {
            var id = core.generateId();

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

        assert.ok( allUnique, 'all generated ids unique after ' + i + ' iterations' );
        assert.ok( noneStartsWithNumber, 'no id starts with a number' );

        assert.equal( core.generateId().length, 32, 'default length 32' );

        assert.equal( core.generateId( 10 ).length, 10, 'custom length' );
    } );

    QUnit.test( 'onbeforeunload', function( assert ) {
        var oldSettings = {
            confirmWindowClose: core.settings.confirmWindowClose,
            debug: core.settings.debug
        };

        core.settings.confirmWindowClose = false;
        core.settings.debug = false;
        assert.equal(
            window.onbeforeunload(),
            undefined,
            "no return value when confirmWindowClose == false and debug == false"
        );

        core.settings.confirmWindowClose = true;
        core.settings.debug = true;
        assert.equal(
            window.onbeforeunload(),
            undefined,
            "no return value when confirmWindowClose == true and debug == true"
        );

        core.settings.debug = false;
        assert.equal(
            window.onbeforeunload(),
            "You are about to leave the story. "
            + "Any unsaved progress will be lost. "
            + "Are you sure you want to continue?",
            'default message'
        );

        core.settings.confirmWindowClose = "Custom message";

        assert.equal(
            window.onbeforeunload(),
            "Custom message",
            'custom message'
        );

        // reset old settings
        core.settings = oldSettings;
    } );

    QUnit.test( 'getVersion', function( assert ) {
        var version = core.getVersion();

        assert.equal( typeof version, 'string', 'version number is returned as a string' );
        assert.ok( /^\d+\.\d+(\.\d+)?$/.test( version ), 'matches x.y[.z] format' );
    } );

    QUnit.test( 'requireVersion', function( assert ) {
        var currentVersion = core.getVersion();

        assert.ok( core.requireVersion( currentVersion ), 'exact release' );
        assert.ok( core.requireVersion( parseInt( currentVersion, 10 ) ), 'major version, integer' );

        assert.raises( function () {
            core.requireVersion( '2.4' );
        }, 'past release' );
        assert.raises( function () {
            core.requireVersion( '10.0' );
        }, 'future release' );
        assert.raises( function () {
            core.requireVersion( 'foo' );
        }, 'invalid version number' );

        assert.raises( function () {
            core.requireVersion( '10.0', 'Wrong release' );
        }, function ( error ) {
            return (error.message === "Wrong release" );
        }, 'custom error message' );

        assert.ok( core.requireVersion( [ currentVersion, '10.0' ] ), 'with boundaries' );
        assert.raises( function () {
            core.requireVersion( [ 1, '2.3' ] );
        }, 'past release boundaries' );

        var errorCallback = false;

        var callback = function () {
            errorCallback = true;
        };

        core.requireVersion( '10.0', callback );
        assert.ok( errorCallback, 'error callback' );
    } );

});
// We can't let QUnit reorder tests since it might screw up
// Parchment's asynchronous script loading. We must wait for
// Parchment to fully load before we can run any tests with it.
QUnit.config.reorder = false;

$(function() {
    // setup document structure
    $( 'body' ).append(
        '<div id="qunit"></div><div id="qunit-fixture"></div>'
    );

    $( 'head' ).append(
        '<link rel="stylesheet" href="/base/tests/lib/qunit-git.css">'
    ).append(
        '<link rel="stylesheet" href="/base/vendor/parchment/parchment.css">'
    );

    // Initialize Vorple
    vorple.media.defaults.swfPath = '../vendor/soundmanager';
    vorple.media.defaults.audioPath = '../stories/undum/everything/media/audio';
    vorple.media.defaults.imagePath = '../stories/undum/everything/media/image';
    vorple.media.defaults.musicPath = '../stories/undum/everything/media/music';
    vorple.core.init();
});
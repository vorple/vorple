require([
    'jquery',
    'core',
    'html',
    'media',
    'notify',
    'parser',
    'tooltip'
], function( jQuery, core, html, media, notify, parser, tooltip ) {
    "use strict";

    window.vorple = window.vorple || {};

    window.vorple.core = core;
    window.vorple.html = html;
    window.vorple.media = media;
    window.vorple.notify = notify;
    window.vorple.parser = parser;
    window.vorple.tooltip = tooltip;

    window.jQuery = window.jQuery || jQuery;
    window.$ = window.$ || jQuery;

    require([ 'parchment' ], function( /** use global parchment object **/ ) {
        core.init( parchment );
    });
});
import "../haven/bootstrap";
import { version } from "../package.json";

window.vorple = {
    ...require( "./vorple" ),
    audio: require( "./audio" ),
    debug: require( "./debug" ),
    haven: require( "./haven" ),
    layout: require( "./layout" ),
    prompt: require( "./prompt" ),
    options: {},
    version
};

window.jQuery = window.$ = require( "jquery" );

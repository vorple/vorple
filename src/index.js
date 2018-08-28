import "../haven/bootstrap";
import vex from "vex-js";
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

vex.registerPlugin( require( "vex-dialog" ) );
window.vex = vex;
vex.defaultOptions.className = "vex-theme-os";
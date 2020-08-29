/**
 * @private
 * @module index
 */
import vex from "vex-js";
import { version } from "../../package.json";

window.vorple = {
    ...require( "./vorple" ),
    audio: require( "./audio" ),
    debug: require( "./debug" ),
    file: require( "./file" ),
    haven: require( "./haven" ),
    layout: require( "./layout" ),
    output: require( "./output" ),
    prompt: require( "./prompt" ),
    options: {},
    version
};

// initialize Vex modal windows
vex.registerPlugin( require( "vex-dialog" ) );
window.vex = vex;
vex.defaultOptions.className = "vex-theme-plain";

// load the PowerTip tooltip library
require( "jquery-powertip" );

// expose Toastr notification library
window.toastr = require( "toastr" );

export default window.vorple;

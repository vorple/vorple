/**
 * @private
 * @module index
 */

 // include Quixe
import "./quixe/quixe";
import "./quixe/gi_dispa";
import "./quixe/gi_load";

import vex from "vex-js";
import { version } from "../package.json";

window.vorple = {
    ...require( "./vorple/vorple.js" ),
    audio: require( "./vorple/audio.js" ),
    debug: require( "./vorple/debug.js" ),
    file: require( "./vorple/file.js" ),
    haven: require( "./vorple/haven.js" ),
    layout: require( "./vorple/layout.js" ),
    output: require( "./vorple/output.js" ),
    prompt: require( "./vorple/prompt.js" ),
    options: {},
    version
};

// initialize Vex modal windows
vex.registerPlugin( require( "vex-dialog" ) );
vex.defaultOptions.className = "vex-theme-plain";

// load the PowerTip tooltip library
require( "jquery-powertip" );

// force libraries to expose themselves to the window object,
// package managers might otherwise hide them and Inform needs
// to access them in global scope
window.jQuery = window.$ = require( "jquery" );
window.toastr = require( "toastr" );
window.vex = vex;

export default window.vorple;

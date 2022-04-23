/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @internal
 * @module index
 */

import * as core from "./vorple/vorple";
import * as audio from "./vorple/audio";
import * as debug from "./vorple/debug";
import * as file from "./vorple/file";
import * as haven from "./vorple/haven";
import * as layout from "./vorple/layout";
import * as output from "./vorple/output";
import * as prompt from "./vorple/prompt";

import jquery from "jquery";
import toastr from "toastr";
import "jquery-powertip";

// include Quixe
import "./quixe/quixe";
import "./quixe/gi_dispa";
import "./quixe/gi_load";

import vex, { Vex } from "vex-js";
import vexDialog from "vex-dialog";

import packageJson from "../package.json";

// The Vex type definition is missing these parts
interface VexWithDialog extends Vex {
    registerPlugin( plugin: any ): void;
    dialog: any;
}

export interface Vorple {
    addEventListener: typeof core.addEventListener;
    evaluate: typeof core.evaluate;
    init: typeof core.init;
    removeEventListener: typeof core.removeEventListener;
    requireVersion: typeof core.requireVersion;
    setInformVersion: typeof core.setInformVersion;
    triggerEvent: typeof core.triggerEvent;

    audio: typeof audio;
    debug: typeof debug;
    file: typeof file;
    haven: typeof haven;
    layout: typeof layout;
    output: typeof output;
    prompt: typeof prompt;

    options: core.VorpleOptions;
    version: string;
}

declare global {
    interface Window {
        vorple: Vorple;

        Glk: any;
        Quixe: any;
        GiDispa: any;
        GlkOte: any;
        GiLoad: any;

        jQuery: JQueryStatic;
        $: JQueryStatic;
        toastr: Toastr;
        vex: VexWithDialog;

        borogove?: {
            getFileContents?: any;
        }
    }
}

window.vorple = {
    ...core,
    audio,
    debug,
    file,
    haven,
    layout,
    output,
    prompt,
    options: {},
    version: packageJson.version
};

// initialize Vex modal windows
( vex as VexWithDialog ).registerPlugin( vexDialog );

if( vex.defaultOptions ) {
    vex.defaultOptions.className = "vex-theme-plain";
}

// force libraries to expose themselves to the window object,
// package managers might otherwise hide them and Inform needs
// to access them in global scope
window.jQuery = window.$ = jquery;
window.toastr = toastr;
window.vex = ( vex as VexWithDialog );

export default window.vorple;

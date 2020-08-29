import { get as getOption } from "./options";
import { history, setDoScroll } from "./prompt";

import {
    clear as clearWindow,
    create as createWindow,
    get as getWindow,
    position as windowPosition
} from "./window";

import {
    apply as applyStyle,
    color,
    restore as restoreStyle
} from "./style";

let autosaveFilename = "";


/**
 * Read the UI state from the filesystem.
 */
function readUIState () {
    try {
        const state = FS.readFile(
            autosaveFilename + '_uidata',
            {encoding: 'utf8'}
        );

        return JSON.parse( state );
    }
    catch(e) {
        return null;
    }
}


export const autosave = {
    /**
     * Delete the autosave files.
     */
    remove: function() {
        try {
            FS.unlink( autosaveFilename );
        }
        catch(e) {}

        try {
            FS.unlink( autosaveFilename + '_uidata' );
        }
        catch(e) {}
    },

    /**
     * Pass the autosave's filename to the engine that takes care of
     * reloading the save.
     */
    restore: function() {
        try {
            // Try to open the autosave file.
            // If it doesn't exist, this throws an error.
            FS.stat( autosaveFilename );

            Module.ccall(
                'hugojs_set_autosave_filename',
                'null',
                [ 'string' ],
                [ autosaveFilename ]
            );
        }
        catch(e) {
            // autosave file doesn't exist, do nothing
        }
    },

    save: function() {
        if( !getOption( 'autosave' ) ) {
            return;
        }

        // trigger engine autosave
        const engineSaveSucceeded = Module.ccall(
            'haven_save_autosave',
            'int',
            [ 'string' ],
            [ autosaveFilename ]
        );

        // save UI state
        if( engineSaveSucceeded ) {
            FS.writeFile(
                autosaveFilename + '_uidata',
                JSON.stringify( haven.window.getUIState() ),
                {encoding: 'utf8'}
            );
        }
    },

    /**
     * Remember the autosave's filename
     * @param filename
     */
    setName: function( filename ) {
        autosaveFilename = filename;
    }
};


/**
 * Restore saved UI state.
 */
export function restoreUI() {
    const savedState = readUIState();
    let windowCount;

    if( !savedState ) {
        return;
    }

    // if windowing has been set off in options, restore only the main window
    if( getOption( 'windowing' ) ) {
        windowCount = savedState.windowContents.length;
    }
    else {
        windowCount = 1;
    }

    clearWindow();

    for( let i = 0; i < windowCount; ++i ) {
        createWindow(
            i,
            savedState.windowDimensions[ i ].left,
            savedState.windowDimensions[ i ].top,
            savedState.windowDimensions[ i ].right,
            savedState.windowDimensions[ i ].bottom
        );
    }

    color.restore( savedState.currentColors );
    restoreStyle( savedState.font );
    windowPosition.restore( savedState.position );

    if( savedState.title ) {
        document.title = savedState.title;
    }

    for( let i = 0; i < savedState.windowContents.length; ++i ) {
        getWindow( i ).innerHTML = savedState.windowContents[ i ];
        applyStyle( haven.window.get( i ), i );
    }

    applyStyle( document.body, 0 );

    // TODO: only for Hugo!
    // set the same style we had when saving
    Module.ccall(
        'hugojs_set_font',
        'null',
        [ 'int' ],
        [ savedState.font[ 0 ].original ]
    );

    Module.ccall(
        'hugojs_set_colors',
        'null',
        [ 'int', 'int' ],
        [ savedState.currentColors[ 0 ].text, savedState.currentColors[ 0 ].background ]
    );

    // restore command history
    history.set( savedState.cmdHistory || [] );

    // scroll to the bottom
    window.scrollTo( 0, 9e9 );
    setDoScroll();
}
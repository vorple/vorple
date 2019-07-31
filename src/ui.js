import vex from "vex-js";
import { 
    INFORM_PATH,
    SAVEFILE_PATH,
    TRANSCRIPT_PATH,
    exists,
    getFS,
    inAsyncFS,
    mkdir,
    path,
    readdir,
    TMP_PATH,
    write
} from "./file";

export function filePrompt( callback, filepath = INFORM_PATH ) {
    const needsAsync = inAsyncFS( filepath );
    const fs = getFS();

    const asyncExists = async function( filename ) {
        return new Promise( resolve => {
            try {
                fs.exists( filename, status => resolve( status ) );
            }
            catch( e ) {
                resolve( false );
            }
        });
    };

    const askForFilename = function() {
        vex.dialog.open({
            message: 'Enter filename:',
            input: [
                '<input name="filename" type="text" required />',
            ].join(''),
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'Save' }),
                $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
            ],
            callback: async function (data) {
                if (!data) {
                    callback( null );
                } else {
                    const finalPath = path( data.filename, filepath );

                    if( needsAsync ) {
                        if( await asyncExists( finalPath ) ) {
                            askToOverwrite( finalPath );
                        }
                        else {
                            callback( finalPath );
                        }
                    }
                    else {
                        if( exists( finalPath ) ) {
                            askToOverwrite( finalPath );
                        }
                        else {
                            callback( finalPath );
                        }
                    }
                }
            }
        });
    };

    const askToOverwrite = function( finalPath ) {
        vex.dialog.open({
            message: 'File already exists. Overwrite?',
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'Overwrite' }),
                $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
            ],
            callback: function( overwrite ) {
                if( overwrite ) {
                    callback( finalPath );
                }
                else {
                    callback( null );
                }
            }
        });
    };

    if( needsAsync ) {
        (async function() {
            if( !await asyncExists( filepath ) ) {
                mkdir( filepath, askForFilename );
            }
            else {
                askForFilename();
            }
        })();
    }
    else {
        if( !exists( filepath ) ) {
            mkdir( filepath );
        }

        askForFilename();
    }
}

export function saveFilePrompt( gameid, callback ) {
    filePrompt( callback, path( gameid, SAVEFILE_PATH ) );
}

export function transcriptFilePrompt( callback ) {
    const choice = prompt( 'Enter filename' );
    
    if( !choice ) {
        return callback( null );
    }

    callback( path( choice, TRANSCRIPT_PATH ) );
}

export async function restoreFilePrompt( gameid, callback ) {
    const fullPath = path( gameid, SAVEFILE_PATH );
    const fs = getFS();
    const savefiles = await new Promise( resolve => fs.readdir( fullPath, ( err, result ) => resolve( result ) ) );

    if( !savefiles ) {
        vex.dialog.open({
            message: 'There are no save files yet.',
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'OK' }),
            ],
            callback: function () {
                callback( null );
            }
        });
        return;
    }

    vex.dialog.open({
        message: 'Choose save file to restore:',
        input: '<ul style="list-style-type:none">' + 
            savefiles.map( ( file, index ) => `<li>
                <label>
                    <input type="radio" value="${index}" name="fileindex" required>
                    ${file}
                </label>
            </li>` ).join('') +
        '</ul>',
        buttons: [
            $.extend({}, vex.dialog.buttons.YES, { text: 'Restore' }),
            $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
        ],
        callback: function (data) {
            if (!data) {
                return callback( null );
            } else {
                const source = path( savefiles[ data.fileindex ], fullPath );
                const dest = path( savefiles[ data.fileindex ], TMP_PATH );

                // We need to do this "hack" and copy the save file to the synchronous
                // filesystem so that the engine can read it synchronously
                fs.readFile( source, {}, ( err, contents ) => {
                    write( dest, contents, { binary: true } );
                    callback( dest);
                });
            }
        }
    });
}
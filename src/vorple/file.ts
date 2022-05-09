/**
 * This module is the access point to the virtual filesystem.
 *
 * The system uses BrowserFS to handle the virtual filesystem in browser's localstorage.
 * See https://jvilk.com/browserfs/1.4.1/classes/_backend_localstorage_.localstoragefilesystem.html
 * for the full API. The [[getFS]] method can be used to retrieve the filesystem object that can be used
 * to access the BrowserFS API directly.
 *
 * All methods in this module use the synchronous versions of the filesystem methods
 * (readFileSync, writeFileSync etc.)
 *
 * @module file
 * @since 3.2.0
 */

import { getInformVersion, setInformVersion } from "./vorple";

import * as BrowserFS from "browserfs";
import type { FSModule } from "browserfs/dist/node/core/FS";
import { basename, dirname, resolve } from "path";

/** @internal */
export const HANDSHAKE_FILENAME = "VpHndshk";

/** @internal */
export const JS_EVAL_FILENAME = "VpJSEval";

/** @internal */
export const JS_RETURN_VALUE_FILENAME = "VpJSRtrn";

/** @internal */
export const JS_RETURN_VALUE_TYPE_FILENAME = "VpJSType";

const HANDSHAKE_INIT = "Callooh!";
const HANDSHAKE_RESPONSE = "Callay!";

// The file owner id for Inform 7
const I7_FILE_OWNER = "VORPLE";

const SYNC_FS_ROOT = "/";

/**
 * The directory root for the extended filesystem which has more space (IndexedDB)
 * and uses asynchronous access.
 */
export const ASYNC_FS_ROOT = "/extended/";

/**
 *  The directory where Inform reads author-provided files (not saves or transcripts).
 */
export const INFORM_PATH = SYNC_FS_ROOT + "inform";

/**
 *  The directory Vorple uses for its own files for communication between the interpreter and the game file.
 */
export const VORPLE_PATH = SYNC_FS_ROOT + "vorple";

/**
 * Save file directory in the extended filesystem.
 */
export const SAVEFILE_PATH = ASYNC_FS_ROOT + "savefiles";

/**
 * Transcripts directory in the extended filesystem.
 */
export const TRANSCRIPT_PATH = ASYNC_FS_ROOT + "transcripts";

/**
 * The directory for temporary files. The temporary directory is emptied after leaving the page.
 */
export const TMP_PATH = "/tmp";

const DEFAULT_PATH = INFORM_PATH;

let fs: FSModule | null = null;


/**
 * Check if file contents start with an Inform 7 header.
 */
function hasHeader( contents: string ): boolean {
    return new RegExp( "^[\\-*] //.*// .*\\s+" ).test( contents );
}


export interface FileCopyOptions {
    /**
     * The directory where the operation takes place. Applies to both source and target parameters.
     *
     * @default "/inform"
     */
    cwd?: string;

    /**
     * If true, any existing file of the same name will be replaced. If false, the operation will not continue if the file already exists.
     *
     * @default true
     */
    replace?: boolean;
}

/**
 * Copies a file to another location or name in the filesystem.
 *
 * @param source  File to copy
 * @param target  Target directory or the new name
 * @param options  An optional options object.
 * @returns Returns true on success, false otherwise.
 */
export function copy( source: string, target: string, options: FileCopyOptions = { cwd: DEFAULT_PATH, replace: true }): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        replace: true,
        ...options
    };

    const sourceFilename = path( source, opt.cwd );

    if( !exists( sourceFilename ) ) {
        // can't copy files that don't exist
        return false;
    }

    if( info( sourceFilename )?.isDirectory ) {
        // won't copy directories
        return false;
    }

    const targetPath = path( target, opt.cwd );
    let targetFilename = targetPath;

    // if the target is a directory, add the source filename to the target
    if( exists( targetPath ) && info( targetPath )?.isDirectory ) {
        targetFilename = path( basename( source ), targetPath );
    }

    if( exists( targetFilename ) ) {
        if( !opt.replace ) {
            // asked not to replace target
            return false;
        }

        if( info( targetFilename )?.isDirectory ) {
            // directories won't be overwritten
            return false;
        }
    }

    try {
        const contents = read( sourceFilename, { header: true });
        write( targetFilename, contents || "", { header: false });
        return true;
    }
    catch( e ) {
        return false;
    }
}

export interface FileExistsOptions {
    /**
     * The root directory where to look for the file.
     *
     * @default "/inform"
     */
    cwd?: string;
}


/**
 * Does a file or directory exist in the virtual filesystem?
 *
 * @param filename  File or directory name to check
 * @param options  An optional options object
 * @returns Returns true if the file/directory exists, false otherwise.
 */
export function exists( filename: string, options: FileExistsOptions = { cwd: DEFAULT_PATH }): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    return fs?.existsSync( path( filename, opt.cwd ) ) || false;
}


/**
 * Show a modal asking the user to provide a filename.
 *
 * @param callback  The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @param filepath  The root path of the file
 */
export function filePrompt( callback: ( filename: string | null ) => void, filepath: string = INFORM_PATH ): void {
    const needsAsync = inAsyncFS( filepath );

    const asyncExists = async( filename: string ): Promise<boolean> => {
        return new Promise( resolve => {
            const fs = getFS();

            if( !fs ) {
                resolve( false );
                return;
            }

            try {
                fs.exists( filename, status => resolve( status ) );
            }
            catch( e ) {
                resolve( false );
            }
        });
    };

    const askForFilename = (): void => {
        window.vex.dialog.open({
            message: "Enter filename:",
            input: [
                "<input name=\"filename\" type=\"text\" required />"
            ].join( "" ),
            buttons: [
                $.extend({}, window.vex.dialog.buttons.YES, { text: "Save" }),
                $.extend({}, window.vex.dialog.buttons.NO, { text: "Cancel" })
            ],
            callback: async function( data ) {
                if( !data ) {
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

    const askToOverwrite = ( finalPath: string ): void => {
        window.vex.dialog.open({
            message: "File already exists. Overwrite?",
            buttons: [
                $.extend({}, window.vex.dialog.buttons.YES, { text: "Overwrite" }),
                $.extend({}, window.vex.dialog.buttons.NO, { text: "Cancel" })
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
        ( async(): Promise<void> => {
            if( !await asyncExists( filepath ) ) {
                mkdir( filepath );
            }

            askForFilename();
        })();
    }
    else {
        if( !exists( filepath ) ) {
            mkdir( filepath );
        }

        askForFilename();
    }
}


/**
 * Returns the BrowserFS object for direct access to the BrowserFS API.
 *
 * @see http://jvilk.com/browserfs/1.4.1/
 * @returns Returns the FS object or null if the filesystem hasn't been initialized yet.
 */
export function getFS(): FSModule | null {
    return fs;
}


/**
 * Check if a file is in a filesystem that requires asynchronous access.
 *
 * (Asynchronous file access isn't officially supported so this is for internal use only.)
 *
 * @internal
 * @param fullPath  Path to the file. Must be a full path, not relative.
 */
export function inAsyncFS( fullPath: string ): boolean {
    return fullPath.startsWith( ASYNC_FS_ROOT );
}

export interface I7FileHeader {
    /**
     * Project name in the header.
     */
    project: string;
    /**
     * File's ready status.
     */
    ready: boolean;
}

export interface FileInfo {
    /**
     * Contents of the text file, or files inside the directory.
     */
    contents: string | string[];
    /**
     * Parent directory.
     */
    directory: string;
    /**
     * Inform 7 header, or null if doesn't exist/apply.
     */
    header: I7FileHeader | null;
    /**
     * Base filename or directory name.
     */
    name: string;
    /**
     * True if it's a directory, false if it's a normal file.
     */
    isDirectory: boolean;
    /**
     * Full path to the file.
     */
    path: string;
}

export interface FileInfoOptions {
    /**
     * The root directory where to look for the file.
     *
     * @default "/inform"
     */
    cwd?: string;
}

/**
 * Returns an object with information about a file or directory.
 *
 * @param filename  File or directory
 * @param options  An optional options object
 * @returns Returns the FileInfo information object, or null if the file or directory doesn't exist.
 */
export function info( filename: string, options: FileInfoOptions = { cwd: DEFAULT_PATH }): FileInfo | null {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        if( !fs ) {
            return null;
        }

        const fullPath = path( filename, opt.cwd );
        const stats = fs.statSync( fullPath );
        const isDirectory = stats.isDirectory();
        let contents: string | string[] | null;
        let header: I7FileHeader | null = null;

        if( isDirectory ) {
            contents = readdir( filename, { cwd: opt.cwd });
        }
        else {
            contents = read( filename, { cwd: opt.cwd, header: true });

            if( contents ) {
                header = hasHeader( contents ) ? {
                    project: contents.split( "//" )[ 1 ],
                    ready: contents.charAt( 0 ) === "*"
                } : null;
            }
        }

        if( contents === null ) {
            return null;
        }

        return {
            contents,
            directory: dirname( fullPath ),
            name: basename( fullPath ),
            header,
            isDirectory,
            path: fullPath
        };
    }
    catch( e ) {
        // file doesn't exist or couldn't be opened
        return null;
    }
}


/**
 * Creates a header for Inform 7 files. If the story is made with Inform 6, this method returns an empty string.
 *
 * @param project  Project's name
 * @param filename  Filename, path is automatically removed
 * @param ready  If true, the file is marked "ready" for Inform 7
 * @returns Returns the Inform 7 header or an empty string for Inform 6.
 */
export function informHeader( project: string, filename: string, ready = true ): string {
    const readyMark = ready ? "*" : "-";

    if( getInformVersion() === 7 ) {
        return `${readyMark} //${project}// ${basename( filename )}\n`;
    }

    return "";
}


/**
 * Initialize the filesystem. This gets called automatically when calling
 * vorple.init() but it can be called manually before that to get access
 * to the filesystem earlier.
 *
 * The method returns a promise that resolves into the BrowserJS filesystem
 * object, but after the promise has resolved all vorple.file.* are also
 * available.
 *
 * @example
 * ```
 * async function getAccessToFS() {
 *   const fs = await vorple.file.init();
 *
 *   // fs is now the BrowserFS filesystem object (what you'd get from vorple.file.getFS())
 *   // also all vorple.file.* methods are now available
 *   vorple.file.write("info.txt", "Filesystem is now available");
 * }
 * ```
 *
 * @returns Returns a promise that resolves to the filesystem object.
 */
export function init(): Promise<FSModule> {
    return new Promise( ( resolve, reject ) => {
        if( fs ) {
            // already initialized!
            return resolve( fs );
        }

        BrowserFS.configure({
            fs: "MountableFileSystem",
            options: {
                [ SYNC_FS_ROOT ]: { fs: "LocalStorage", options: {} },
                [ ASYNC_FS_ROOT ]: { fs: "IndexedDB", options: {} },
                [ TMP_PATH ]: { fs: "InMemory", options: {} }
            }
        }, async error => {
            if( error ) {
                return reject( error );
            }

            // save a reference to BrowserFS methods
            fs = BrowserFS.BFSRequire( "fs" );

            // create the necessary directories if they don't exist
            [ VORPLE_PATH, INFORM_PATH ].forEach( dir => {
                if( !exists( dir ) ) {
                    mkdir( dir );
                }
            });

            // the same thing for paths that need async operations
            await Promise.all( [ SAVEFILE_PATH, TRANSCRIPT_PATH ].map( ( dir ): Promise<void> => new Promise( resolve => {
                fs?.exists( dir, alreadyExists => {
                    if( !alreadyExists ) {
                        fs?.mkdir( dir, resolve );
                    }
                    else {
                        resolve();
                    }
                });
            }) ) );

            // Create the handshake file. This file must "really" exist for the interpreter to pick it up.
            try {
                fs.writeFileSync( path( HANDSHAKE_FILENAME, VORPLE_PATH ), "", "utf8" );
            }
            catch( e ) {
                // already exists - no need to do anything
            }

            resolve( fs );
        });
    });
}

export interface FileReadyOptions {
    /**
     * The root directory of the file.
     *
     * @default "/inform"
     */
    cwd?: string;
}

/**
 * Check if a file has been marked ready for Inform 7 to read.
 *
 * If the file doesn't exist, it doesn't have a header, or it can't be read,
 * the method returns false. Error conditions must be checked manually if
 * it's important to make a difference between invalid operation and a file
 * that has been marked not ready.
 *
 * @param filename  Path to the file
 * @param options  An optional options object
 * @returns Returns true if file is ready, false on error or not ready.
 *
 * This method always returns false on Inform 6.
 */
export function isReady( filename: string, options: FileReadyOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    if( getInformVersion() !== 7 ) {
        return false;
    }

    const contents = read( filename, {
        cwd: opt.cwd,
        header: true
    });

    if( contents === null ) {
        // read failed
        return false;
    }

    if( !hasHeader( contents ) ) {
        return false;
    }

    return contents.charAt( 0 ) === "*";
}


/**
 * Marks a file ready to read (or not ready to read) for Inform 7.
 * This is equivalent of the phrases "mark (external file) as ready to read"
 * and "mark (external file) as not ready to read" in Inform 7.
 *
 * If the file doesn't have an Inform 7 header the method does nothing and returns false.
 *
 * In Inform 6 this method does nothing and always returns false.
 *
 * @param filename  Path to the file
 * @param ready  If true, marks the file ready. Otherwise marks the file not ready.
 * @param options  An optional options object
 * @returns Returns true if operation was successful, false otherwise.
 *      Returns true even if no change was made to the file (was already marked ready.)
 *      Always returns false on Inform 6.
 */

export function markReady( filename: string, ready = true, options: FileReadyOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    if( getInformVersion() !== 7 ) {
        return false;
    }

    const contents = read( filename, {
        cwd: opt.cwd,
        header: true
    });

    if( !contents ) {
        // read failed
        return false;
    }

    if( !hasHeader( contents ) ) {
        return false;
    }

    const readyMarker = ready ? "*" : "-";
    const newContents = readyMarker + contents.substr( 1 );

    return write( filename, newContents, { cwd: opt.cwd, header: false });
}


/**
 * Create a new directory in the virtual filesystem.
 *
 * This does not create missing subdirectories, e.g. `mkdir( 'foo/bar' )`
 * won't work if directory 'foo' doesn't exist.
 *
 * @param dirname  The directory to create
 * @param options  An optional options object
 * @returns Returns true if a directory was created, false otherwise.
 */
export function mkdir( dirname: string, options: DirectoryOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };
    const fullPath = path( dirname, opt.cwd );

    if( !fs ) {
        return false;
    }

    if( inAsyncFS( fullPath ) ) {
        fs.mkdir( fullPath );
        return true;
    }

    try {
        fs.mkdirSync( fullPath );
        return true;
    }
    catch( e ) {
        return false;
    }
}

export interface MoveFileOptions {
    /**
     * The directory where the operation takes place. Applies to both source and target parameters.
     *
     * @default "/inform"
     */
    cwd?: string;

    /**
     * If true, any existing file of the same name will be replaced.
     * If false, the operation will not continue if the file already exists.
     * This option is ignored if the source is a directory (a directory will never overwrite a file.)
     *
     * @default true
     */
    replace?: boolean;
}

/**
 * Moves a file or directory to another directory.
 * If the target doesn't exist, the file or directory is renamed.
 *
 * @param source  File/directory to move
 * @param target  Target directory or the new name
 * @param options  An optional options object
 * @returns Returns true on success, false otherwise.
 */
export function move( source: string, target: string, options: MoveFileOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        replace: true,
        ...options
    };

    if( !exists( source, { cwd: opt.cwd }) ) {
        return false;
    }

    const sourceFilename = path( source, opt.cwd );
    const sourceIsDir = info( sourceFilename )?.isDirectory;
    const targetPath = path( target, opt.cwd );
    let targetFilename = targetPath;

    // if the target is a directory, add the source filename to the target
    if( exists( targetPath ) && info( targetPath )?.isDirectory ) {
        targetFilename = path( basename( source ), targetPath );
    }

    if( exists( targetFilename ) ) {
        if( !opt.replace ) {
            // asked not to replace target
            return false;
        }

        if( sourceIsDir ) {
            // directories don't overwrite anything
            return false;
        }

        const targetFileInfo = info( targetFilename );

        if( !targetFileInfo || targetFileInfo.isDirectory ) {
            // directories won't be overwritten
            return false;
        }
    }

    try {
        fs?.renameSync( sourceFilename, targetFilename );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Adds a path to a given filename.
 * See https://nodejs.org/api/path.html#path_path_resolve_paths
 * for rules on how path joining works.
 *
 * The default root directory is /inform so
 * `vorple.file.path( "foo.txt", "bar" )` will resolve to
 * `/inform/bar/foo.txt`.
 *
 * @example
 * ```
 * vorple.file.path( "foo.txt" );                   // --> /inform/foo.txt
 * vorple.file.path( "foo.txt", "bar" );            // --> /inform/bar/foo.txt
 * vorple.file.path( "foo.txt", "/bar" );           // --> /bar/foo.txt
 * vorple.file.path( "../foo.txt", "/bar/xyz" );    // --> /bar/foo.txt
 * vorple.file.path( "foo.txt", "/" );              // --> /foo.txt
 * vorple.file.path( "/foo.txt", "/bar/xyz" );      // --> /foo.txt
 * ```
 *
 * @param filename  Name of the file
 * @param path  Path where the file is appended
 * @returns Returns the full path.
 */
export function path( filename, path = "." ): string {
    return resolve( DEFAULT_PATH, path, filename );
}


export interface ReadFileOptions {
    /**
     * Is the file to be read a binary file.
     *
     * @default false
     */
    binary?: boolean;

    /**
     * The root directory where to look for the file.
     *
     * @default "/inform"
     */
    cwd?: string;

    /**
     * If true, return value contains the Inform 7 header if present.
     * Otherwise the header is not included in the return value.
     *
     * @default false
     */
    header?: boolean;
}


/**
 * Read a text file from the virtual filesystem
 *
 * @param filename  The file to read
 * @param options  An optional options object
 * @returns Returns the contents of the file, or null file could not be read.
 */
export function read( filename: string, options: ReadFileOptions = {}): string | null {
    const opt = {
        binary: false,
        cwd: DEFAULT_PATH,
        header: false,
        ...options
    };

    const encoding = opt.binary ? {} : "utf8";

    // Regardless of what the file actually contains,
    // the handshake response is returned when the story file
    // tries to read the handshake file. This tells it that
    // it's running on the Vorple interpreter.
    if( filename === HANDSHAKE_FILENAME ) {
        return informHeader( I7_FILE_OWNER, filename ) + HANDSHAKE_RESPONSE;
    }

    try {
        const contents: string | null = ( fs?.readFileSync( path( filename, opt.cwd ), encoding ) as unknown as string | null );

        if( typeof contents === "string" && !opt.header && hasHeader( contents ) ) {
            // header not wanted - remove it from the return value
            return contents.substring( contents.indexOf( "\n" ) + 1 );
        }

        return contents;
    }
    catch( e ) {
        return null;
    }
}


export interface DirectoryOptions {
    /**
     * The root directory of the file.
     *
     * @default "/inform"
     */
    cwd?: string;
}


/**
 * Reads the contents of a directory.
 *
 * @param dirname  Name of the directory
 * @param options  An optional options object
 * @returns Returns the list of files and directories as an array of strings.
 *      Returns null if the directory doesn't exist or if trying to read a file.
 */
export function readdir( dirname: string, options: DirectoryOptions = {}): string[] | null {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        return fs?.readdirSync( path( dirname, opt.cwd ) ) || null;
    }
    catch( e ) {
        return null;
    }
}


/**
 * Get the URL to a resource, which can be a normal URL or a data URL containing
 * the resource itself. This is used to get the resource files from the Borogove
 * editor.
 *
 * @param url  URL to the resource
 * @returns Returns the URL or a data URL.
 * @since 3.2.2
 */
export function resourceUrl( url: string ): string {
    // don't do anything to non-strings or empty strings
    if( typeof url !== "string" || !url ) {
        return url;
    }

    const lowerCaseUrl = url.toLowerCase();

    // don't do anything to external URLs
    if( lowerCaseUrl.indexOf( "http://" ) > -1 || lowerCaseUrl.indexOf( "https://" ) > -1 ) {
        return url;
    }

    // special case for Borogove environment
    if( window.borogove &&  "getFileContents" in window.borogove ) {
        return window.borogove.getFileContents( url );
    }

    return url;
}


/**
 * Remove a directory from the virtual filesystem. Directory must be empty.
 *
 * @param dirname
 * @param options  An optional options object
 * @returns Returns true if a directory was removed, false otherwise.
 */
export function rmdir( dirname: string, options: DirectoryOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        fs?.rmdirSync( path( dirname, opt.cwd ) );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Ask the user to choose a save file to restore.
 *
 * @param gameid The IFID of the game
 * @param callback The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @internal
 */
export async function restoreFilePrompt( gameid: string, callback: ( filename: string | null ) => void ): Promise<void> {
    const fullPath = path( gameid, SAVEFILE_PATH );
    const fs = getFS();
    const savefiles: string[] = await new Promise( resolve => fs?.readdir( fullPath, ( err, result ) => resolve( result || [] ) ) );

    if( !savefiles ) {
        window.vex.dialog.open({
            message: "There are no save files yet.",
            buttons: [
                $.extend({}, window.vex.dialog.buttons.YES, { text: "OK" })
            ],
            callback: function() {
                callback( null );
            }
        });
        return;
    }

    window.vex.dialog.open({
        message: "Choose save file to restore:",
        input: "<ul style=\"list-style-type:none\">" +
            savefiles.map( ( file, index ) => `<li>
                <label>
                    <input type="radio" value="${index}" name="fileindex" required>
                    ${file}
                </label>
            </li>` ).join( "" ) +
        "</ul>",
        buttons: [
            $.extend({}, window.vex.dialog.buttons.YES, { text: "Restore" }),
            $.extend({}, window.vex.dialog.buttons.NO, { text: "Cancel" })
        ],
        callback: function( data ) {
            if( !data ) {
                return callback( null );
            } else {
                const source = path( savefiles[ data.fileindex ], fullPath );
                const dest = path( savefiles[ data.fileindex ], TMP_PATH );

                // We need to do this "hack" and copy the save file to the synchronous
                // filesystem so that the engine can read it synchronously
                if( fs ) {
                    fs.readFile( source, {}, ( err, contents ) => {
                        write( dest, contents || "", { binary: true });
                        callback( dest );
                    });
                }
                else {
                    callback( null );
                }
            }
        }
    });
}


/**
 * Ask the user to provide a filename for saving the transcript.
 *
 * @param gameid  The IFID of the game
 * @param callback  The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @internal
 */
export function saveFilePrompt( gameid: string, callback: ( filename: string | null ) => void ): void {
    filePrompt( callback, path( gameid, SAVEFILE_PATH ) );
}


/**
 * Ask the user to provide a filename for saving the transcript.
 *
 * @param callback  The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @internal
 */
export function transcriptFilePrompt( callback: ( filename: string | null ) => void ): void {
    const choice = prompt( "Enter filename" );

    if( !choice ) {
        return callback( null );
    }

    callback( path( choice, TRANSCRIPT_PATH ) );
}


export interface UnlinkOptions {
    /**
     * The root directory of the file.
     *
     * @default "/inform"
     */
    cwd?: string;
}

/**
 * Unlink (i.e. delete) a file from the virtual filesystem.
 * Use [[rmdir]] to remove directories.
 *
 * @param filename  File to unlink
 * @param options  An optional options object
 * @returns Returns true if the file was removed, false otherwise.
 */
export function unlink( filename: string, options: UnlinkOptions = {}): boolean {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        fs?.unlinkSync( path( filename, opt.cwd ) );
        return true;
    }
    catch( e ) {
        return false;
    }
}


export interface WriteFileOptions {
    /**
     * If true, contents are appended to the file, otherwise the file is overwritten with the new content.
     *
     * @default false
     */
    append?: boolean;

    /**
     * If true, writes a binary file instead of a text file.
     *
     * @default false
     */
    binary?: boolean;

    /**
     * The directory where the operation takes place.
     *
     * @default "/inform"
     */
    cwd?: string;

    /**
     * If true, an Inform 7 header is added to the start of the file. On Inform 6 this option does nothing.
     *
     * @default true
     */
    header?: boolean;

    /**
     * The project name that's used in the Inform 7 header. Does nothing on Inform 6 or if the [[header]] option is not set.
     *
     * @default "VORPLE"
     */
    project?: string;

    /**
     * If true, the header gets a "ready" mark (`*`) to signal Inform 7 that the file can be read. Otherwise the header is marked not ready (`-`).
     *  Does nothing on Inform 6 or if the [[header]] option is not set.
     *
     * @default true
     */
    ready?: boolean;
}

/**
 * Write a file to the virtual filesystem.
 *
 * @param filename  Filename/path to write
 * @param contents Contents of what to write to the file, either a string or a byte array
 * @param options  An optional options object
 * @returns Returns true on success, false otherwise.
 */
export function write( filename: string, contents: string | Uint8Array | Buffer, options: WriteFileOptions = {}): boolean {
    const opt = {
        append: false,
        binary: false,
        cwd: DEFAULT_PATH,
        header: true,
        project: I7_FILE_OWNER,
        ready: true,
        ...options
    };

    const fullPath = path( filename, opt.cwd );
    const informVersion = getInformVersion();
    const encoding = opt.binary ? {} : "utf8";
    let header = "";

    if( opt.binary ) {
        // convert binary files to a Buffer
        contents = Buffer.from( contents );
    }
    else if( contents instanceof Uint8Array ) {
        contents = contents.toString();
    }
    else if( Array.isArray( contents ) ) {
        // convert normal arrays to a string
        contents = contents.map( code => String.fromCharCode( code ) ).join( "" );
    }

    if( opt.header && !opt.binary ) {
        header = informHeader( opt.project, filename, opt.ready );
    }

    // If the story is writing to the handshake file, detect the Inform version
    // by checking the possible header
    if( filename === HANDSHAKE_FILENAME && contents.length > 0 && !informVersion ) {
        // in case the handshake file is binary, turn it into string
        const handshake = contents.toString();

        if( handshake === HANDSHAKE_INIT ) {
            setInformVersion( 6 );
            return true;
        }

        if( hasHeader( handshake ) ) {
            setInformVersion( 7 );
            return true;
        }

        console.warn( "Unknown handshake initialization from the story file – can't detect Inform version" );
        return false;
    }

    try {
        if( inAsyncFS( fullPath ) ) {
            // This handles the "special case" of writing savefiles and transcripts - not guaranteed to work in the general case!
            if( contents.length === 0 ) {
                return false;
            }
            if( opt.append ) {
                fs?.appendFile( fullPath, contents, encoding, err => console.log( err ) );
            }
            else {
                fs?.writeFile( fullPath, contents, encoding, err => console.log( err ) );
            }
            return true;
        }

        if( opt.append ) {
            // append the I7 header only if the file doesn't exist
            if( header && !exists( fullPath ) ) {
                fs?.writeFileSync( fullPath, header, encoding );
            }

            fs?.appendFileSync( fullPath, contents, encoding );
        }
        else {
            if( header ) {
                fs?.writeFileSync( fullPath, header + contents, encoding );
            }
            else {
                fs?.writeFileSync( fullPath, contents, encoding );
            }
        }

        return true;
    }
    catch( e ) {
        return false;
    }
}

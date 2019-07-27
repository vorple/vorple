/**
 * This module is the access point to the virtual filesystem. 
 * 
 * The system uses BrowserFS to handle the virtual filesystem in browser's localstorage.
 * See https://jvilk.com/browserfs/2.0.0-beta/classes/_backend_localstorage_.localstoragefilesystem.html
 * for the full API. The getFS() method can be used to retrieve the filesystem object that can be used
 * to access the BrowserFS API directly.
 * 
 * All methods in this module use the synchronous versions of the filesystem methods
 * (readFileSync, writeFileSync etc.)
 * 
 * @module file
 */

import { getInformVersion, setInformVersion } from "./vorple";

const BrowserFS = require( "browserfs" );
const { basename, dirname, resolve } = require( "path" );

const HANDSHAKE_FILENAME = 'VpHndshk';
const HANDSHAKE_INIT = "Callooh!";
const HANDSHAKE_RESPONSE = "Callay!";
const INFORM_PATH = '/inform';        // The directory where Inform reads files
const VORPLE_PATH = '/vorple';        // The directory Vorple uses for its own files
const DEFAULT_PATH = INFORM_PATH;

let fs = null;


/**
 * @private
 * Check if file contents start with an Inform 7 header.
 * 
 * @param {string} contents 
 */
function hasHeader( contents ) {
    return new RegExp( `^[\\-*] //.*// .*\\s+` ).test( contents );
}


/**
 * Copies a file.
 * 
 * @param {*} source File to copy
 * @param {*} target Target directory or the new name
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place. Applies to both source and target parameters.
 * @param {boolean} [options.replace=true] If true, any existing file of the same name will be replaced.
 *   If false, the operation will not continue if the file already exists.
 * @returns {boolean} True on success, false otherwise
 */
export function copy( source, target, options = {} ) {
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
    
    if( info( sourceFilename ).isDirectory ) {
        // won't copy directories
        return false;
    }

    const targetPath = path( target, opt.cwd );
    let targetFilename = targetPath;

    // if the target is a directory, add the source filename to the target
    if( exists( targetPath ) && info( targetPath ).isDirectory ) {
        targetFilename = path( basename( source ), targetPath );
    }

    if( exists( targetFilename ) ) {
        if( !opt.replace ) {
            // asked not to replace target
            return false;
        }

        if( info( targetFilename ).isDirectory ) {
            // directories won't be overwritten
            return false;
        }
    }

    try {
        const contents = read( sourceFilename, { header: true } );
        write( targetFilename, contents, { header: false } );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Does a file or directory exist in the virtual filesystem?
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {boolean} True if the file/directory exists, false otherwise
 */
export function exists( filename, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    return fs.existsSync( path( filename, opt.cwd ) );
}


/**
 * Returns the BrowserFS object for direct access to the BrowserFS API.
 * 
 * @returns {object|null} The FS object or null if the filesystem hasn't been initialized yet
 */
export function getFS() {
    return fs;
}

/**
 * Returns an object with information about a file or directory:
 * 
 * ```
 * {
 *   contents: string | Array<string>,   // Contents of text file, or files inside the directory
 *   directory: string,                  // Parent directory
 *   header: null | {                    // Inform 7 header, or null if doesn't exist/apply
 *     project: string,                  // Project name in the header
 *     ready: boolean                    // File's ready status
 *   },
 *   name: string,                       // Base filename or directory name
 *   isDirectory: boolean,               // True if it's a directory, false if it's a normal file
 *   path: string                        // Full path to the file
 * }
 * ```
 * 
 * Returns null if the file or directory doesn't exist.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {object|null}
 */
export function info( filename, options ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        const fullPath = path( filename, opt.cwd );
        const stats = fs.statSync( fullPath );
        const isDirectory = stats.isDirectory();
        let contents;

        if( isDirectory ) {
            contents = readdir( filename, { cwd: opt.cwd } );
        }
        else {
            contents = read( filename, { cwd: opt.cwd, header: true } );
        }
        
        if( contents === null ) {
            return false;
        }
        
        const header = hasHeader( contents ) ? {
            project: contents.split( '//' )[ 1 ],
            ready: contents.charAt( 0 ) === '*'
        } : null;

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
 * Creates a header for Inform 7 files. If the story is Inform 6, returns an empty string.
 * 
 * @param {string} project Project's name
 * @param {string} filename Filename, path is automatically removed
 * @param {boolean} [ready=true] If true, the file is marked "ready" for Inform 7
 * @returns {string} Inform 7 header or an empty string for Inform 6
 */
export function informHeader( project, filename, ready = true ) {
    const readyMark = ready ? "*" : "-";

    if( getInformVersion() === 7 ) {
        return `${readyMark} //${project}// ${basename( filename )}\n`;
    }

    return '';
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
 * async function getAccessToFS() {
 *   const fs = await vorple.file.init();
 *   
 *   // fs is now the BrowserFS filesystem object (what you'd get from vorple.file.getFS())
 *   // also all vorple.file.* methods are now available
 *   vorple.file.write("info.txt", "Filesystem is now available");
 * }
 * 
 * @returns {Promise<object>} A promise that resolves to the filesystem object
 */
export function init() {
    return new Promise( ( resolve, reject ) => {
        if( fs ) {
            // already initialized!
            return resolve(fs);
        }

        BrowserFS.configure({
            fs: 'LocalStorage',
            options: {}
        }, error => {
            if( error ) {
                return reject( error );
            }

            fs = BrowserFS.BFSRequire('fs');

            // create the necessary directories if they don't exist
            [ '/inform', '/savegames', '/transcripts', '/vorple' ].forEach( dir => {
                if( !exists( dir ) ) {
                    mkdir( dir );
                }
            });

            // Create the handshake file. This file must "really" exist for the interpreter to pick it up.
            fs.writeFileSync( path( HANDSHAKE_FILENAME, VORPLE_PATH ), '', 'utf8' );

            resolve(fs);
        });
    });
}

/**
 * Check if a file has been marked ready for Inform 7 to read.
 * 
 * If the file doesn't exist, it doesn't have a header, or it can't be read,
 * the method returns false. Error conditions must be checked manually if
 * it's important to make a difference between invalid operation and a file
 * that has been marked not ready.
 * 
 * This method always returns false on Inform 6.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {boolean} True if file is ready, false on error or not ready
 */
export function isReady( filename, options = {} ) {
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


export function markReady( filename, ready = true, options = {} ) {
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

    return write( filename, newContents, { cwd: opt.cwd, header: false } );
}


/**
 * Create a new directory in the virtual filesystem. 
 * 
 * This does not create missing subdirectories, e.g. mkdir( 'foo/bar' ) won't work
 * if directory 'foo' doesn't exist.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {boolean} True if directory was created, false otherwise
 */
export function mkdir( dirname, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        fs.mkdirSync( path( dirname, opt.cwd ) );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Moves a file or directory to another directory.
 * If the target doesn't exist, the file or directory is renamed.
 * 
 * @param {*} source File/directory to move
 * @param {*} target Target directory or the new name
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place. Applies to both source and target parameters.
 * @param {boolean} [options.replace=true] If true, any existing file of the same name will be replaced.
 *   If false, the operation will not continue if the file already exists.
 *   This option is ignored if the source is a directory (a directory will never overwrite a file.)
 * @returns {boolean} True on success, false otherwise
 */
export function move( source, target, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        replace: true,
        ...options
    };

    if( !exists( source, { cwd: opt.cwd } ) ) {
        return false;
    }

    const sourceFilename = path( source, opt.cwd );
    const sourceIsDir = info( sourceFilename ).isDirectory;
    const targetPath = path( target, opt.cwd );
    let targetFilename = targetPath;

    // if the target is a directory, add the source filename to the target
    if( exists( targetPath ) && info( targetPath ).isDirectory ) {
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

        if( info( targetFilename ).isDirectory ) {
            // directories won't be overwritten
            return false;
        }
    }

    try {
        fs.renameSync( sourceFilename, targetFilename );
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
 * vorple.file.path( "foo.txt" );                   // --> /inform/foo.txt
 * vorple.file.path( "foo.txt", "bar" );            // --> /inform/bar/foo.txt
 * vorple.file.path( "foo.txt", "/bar" );           // --> /bar/foo.txt
 * vorple.file.path( "../foo.txt", "/bar/xyz" );    // --> /bar/foo.txt
 * vorple.file.path( "foo.txt", "/" );              // --> /foo.txt
 * vorple.file.path( "/foo.txt", "/bar/xyz" );      // --> /foo.txt
 * 
 * @param {string} filename
 * @param {string} path
 */
export function path( filename, path = '.' ) {
    return resolve( DEFAULT_PATH, path, filename );
}


/**
 * Read a text file from the virtual filesystem
 * 
 * @param {string} filename
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @param {boolean} [options.header=false] If true, return value contains the Inform 7 header if present. Otherwise the header is not included in the return value.
 * @returns {string|null} The contents of the file, or null file could not be read
 */
export function read( filename, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        header: false,
        ...options
    };
    
    // Regardless of what the file actually contains, 
    // the handshake response is returned when the story file
    // tries to read the handshake file. This tells it that
    // it's running on the Vorple interpreter.
    if( filename === HANDSHAKE_FILENAME ) {
        return informHeader( 'VORPLE', filename ) + HANDSHAKE_RESPONSE;
    }

    try {
        const contents = fs.readFileSync( path( filename, opt.cwd ), 'utf8', 'r' );

        if( !opt.header && hasHeader( contents ) ) {
            // header not wanted - remove it from the return value
            return contents.substr( contents.indexOf( '\n' ) + 1 );
        }

        return contents;
    }
    catch( e ) {
        return null;
    }
}


/**
 * Returns the contents of a directory. Returns null if the directory doesn't exist
 * or the directory is actually a file.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @return {array|null} The list of files in the directory, or null on error
 */
export function readdir( dirname, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };
    
    try {
        return fs.readdirSync( path( dirname, opt.cwd ) );
    }
    catch( e ) {
        return null;
    }
}


/**
 * Remove a directory from the virtual filesystem. Directory must be empty.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {boolean} True if directory was removed, false otherwise
 */
export function rmdir( dirname, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };
    
    try {
        fs.rmdirSync( path( dirname, opt.cwd ) );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Unlink (i.e. delete) a file from the virtual filesystem.
 * Use rmdir() to remove directories.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @returns {boolean} True if file was removed, false otherwise
 */
export function unlink( filename, options = {} ) {
    const opt = {
        cwd: DEFAULT_PATH,
        ...options
    };

    try {
        fs.unlinkSync( path( filename, opt.cwd ) );
        return true;
    }
    catch( e ) {
        return false;
    }
}


/**
 * Write a file to the virtual filesystem.
 * 
 * @param {string} filename
 * @param {string|array} contents Contents of what to write to the file, either a string or a byte array
 * @param {object} [options={}]
 * @param {boolean} [options.append=false] If true, contents are appended to the file, otherwise the file is overwritten with the new content
 * @param {string} [options.cwd="/inform"] The directory where the operation takes place
 * @param {boolean} [options.header=true] If true, an Inform 7 header is added to the start of the file. On Inform 6 this option does nothing.
 * @param {string} [options.project="VORPLE"] The project name that's used in the Inform 7 header.
 *  Does nothing on Inform 6 or if options.header is false.
 * @param {boolean} [options.ready=true] If true, the header gets a "ready" mark ("*") to signal Inform 7 that the file can be read.
 *  Otherwise the header is marked not ready ("-").
 *  Does nothing on Inform 6 or if options.header is false.
 * @returns {boolean} True on success, false otherwise
 */
export function write( filename, contents, options = {} ) {
    const opt = {
        append: false,
        cwd: DEFAULT_PATH,
        header: true,
        project: "VORPLE",
        ready: true,
        ...options
    };

    const fullPath = path( filename, opt.cwd );
    const informVersion = getInformVersion();
    let header = "";

    if( Array.isArray( contents ) ) {
        contents = contents.map( code => String.fromCharCode( code ) ).join( '' );
    }

    if( opt.header ) {
        header = informHeader( opt.project, filename, opt.ready );
    }

    // If the story is writing to the handshake file, detect the Inform version
    // by checking the possible header
    if( filename === HANDSHAKE_FILENAME && contents.length > 0 && !informVersion ) {
        if( contents === HANDSHAKE_INIT ) {
            setInformVersion( 6 );
            return true;
        }

        if( hasHeader( contents ) ) {
            setInformVersion( 7 );
            return true;
        }

        console.warn( "Unknown handshake initialization from the story file – can't detect Inform version" );
    }

    try {
        if( opt.append ) {
            // append the I7 header only if the file doesn't exist
            if( header && !exists( fullPath ) ) {
                fs.writeFileSync( fullPath, header, 'utf8' );                
            }

            fs.appendFileSync( fullPath, contents, 'utf8' );
        }
        else {
            fs.writeFileSync( fullPath, header + contents, 'utf8' );
        }

        return true;
    }
    catch( e ) {
        return false;
    }
}

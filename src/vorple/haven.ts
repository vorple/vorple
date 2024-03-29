/**
 * Helper functions and monkey patches to the Haven engine
 *
 * @module haven
 * @internal
 */

import "./glk";
import { set as setHavenStyle } from "../haven/style";
import error from "../haven/error";
import { get } from "../haven/options";

interface HavenStyleHints {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

// Inform 7 creates a file that puts the story file in this variable
let base64StoryFile: string | null = null;

const stylehints: HavenStyleHints[] = [];

// default
stylehints[ 0 ] = {
    bold: false,
    italic: false,
    underline: false
//  proportional: true
};

// Emphasized
stylehints[ 1 ] = {
    italic: true
};

// Preformatted
stylehints[ 2 ] = {
// proportional: false
};

// Header
stylehints[ 3 ] = {
    bold: true
};

// Subheader
stylehints[ 4 ] = {
    bold: true
};


/**
 * Start Quixe. Uses the base64StoryFile data (from Inform 7)
 * if a file hasn't been specified
 *
 * @since 3.2.0
 * @internal
 */
export function initQuixe( storyfile: string ): void {
    if( !window.Quixe ) {
        error( "Can't find Quixe" );
    }

    if( !window.GiDispa ) {
        error( "Can't find GiDispa" );
    }

    window.GlkOte = {
        log: (): void => {}
    };

    window.GiLoad.load_run(
        {
            engine_name: "Vorple"
        },
        storyfile,
        typeof storyfile === "string" ? "base64" : undefined
    );
}


/**
 * Load the story file.
 *
 * @since 3.2.0
 * @internal
 */
export function loadStoryFile(): Promise<number[]> | string {
    // use "storyfile" parameter if it exists, to bypass the Quixe file loader
    const url = get( "storyfile" ) || get( "story" );

    if( base64StoryFile ) {
        const storydata = base64StoryFile;
        base64StoryFile = null;   // no need to keep the original data, free the memory
        return storydata;
    }

    return new Promise( ( resolve, reject ) => {
        const httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function(): void {
            if( httpRequest.readyState == XMLHttpRequest.DONE ) {
                switch( httpRequest.status ) {
                    case 200:
                        resolve( Array.from( new Uint8Array( httpRequest.response ) ) );
                        break;

                    default:
                        reject( error( "Error loading game file. Server returned status code " + httpRequest.status + " (" + httpRequest.statusText + ")" ) );
                        break;
                }
            }
        };

        httpRequest.open( "GET", url, true );
        httpRequest.responseType = "arraybuffer";   // this must be exactly here, otherwise IE11 breaks
        httpRequest.send();
    });
}


/**
 * Inform 7 interpreter template calls this to set the story file data.
 *
 * @since 3.2.0
 * @internal
 */
export function setBase64StoryFile( data: string ): void {
    base64StoryFile = data;
}


/**
 * Based on Glulx style code, set the basic style of the text being printed.
 */
export function setStyle( style: number ): void {
    /*
     #define style_Normal (0)
     #define style_Emphasized (1)
     #define style_Preformatted (2)
     #define style_Header (3)
     #define style_Subheader (4)
     #define style_Alert (5)
     #define style_Note (6)
     #define style_BlockQuote (7)
     #define style_Input (8)
     #define style_User1 (9)
     #define style_User2 (10)
     #define style_NUMSTYLES (11)
     */

    if( !stylehints[ style ] ) {
        return;
    }

    for( const i in stylehints[ style ] ) {
        setHavenStyle( i, stylehints[ style ][ i ], 0 );
    }
}


/**
 * Changes the appearance of a default style.
 */
export function setStyleHint( style: number, hint: number, value: number ): void {
    if( !stylehints[ style ] ) {
        stylehints[ style ] = {
            bold: false,
            italic: false,
            underline: false
            //          proportional: true
        };
    }

    const st = stylehints[ style ];

    switch( hint ) {
        case 4:     // Weight
            st.bold = ( value === 1 );
            break;

        case 5:     // Oblique
            st.italic = ( value === 1 );
            break;

        case 6:     // Proportional
            //                st.proportional = (value === 1);
            break;
    }
}

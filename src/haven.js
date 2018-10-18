/**
 * @module haven
 * @private
 *
 * Helper functions and monkey patches to the Haven engine
 */

import { set as setHavenStyle } from "../haven/style";

const stylehints = [];

// default
stylehints[ 0 ] = {
    bold: false,
    italic: false,
    underline: false,
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


export function setStyle( style ) {
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

    for( let i in stylehints[ style ] ) {
        setHavenStyle( i, stylehints[ style ][ i ], 0 );
    }
}


/**
 * Changes the appearance of a default style.
 *
 * @param style
 * @param hint
 * @param value
 */
export function setStyleHint( style, hint, value ) {
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
            st.bold = (value === 1);
            break;

        case 5:     // Oblique
            st.italic = (value === 1);
            break;

        case 6:     // Proportional
//                st.proportional = (value === 1);
            break;
    }
}


// Set Emscripten's command line arguments that load the story file
window.Module.arguments = [
    '-q',   // quiet (don't print interpreter info)
    '-u',   // with unicode support
    '/storyfile.gblorb'
];
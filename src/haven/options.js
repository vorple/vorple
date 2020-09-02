const opt = {
    autosave: true,
    exit_url: '',
    extra_opcodes: true,
    proxy_url: 'https://zcode.appspot.com/proxy/?encode=base64&callback=processBase64Zcode&url=%s',
    use_proxy: 'auto',
    windowing: true
};


/**
 * Parse a GET parameter.
 *
 * @param name
 * @param type
 * @param defaultValue
 */
export function getParameter( name, type, defaultValue ) {
    var valueSearch = new RegExp( '[?&]' + name + '=(.*?)(#|&|$)', 'i' ).exec( window.location.href ),
        value;

    if( valueSearch === null || valueSearch.length < 2 ) {
        return defaultValue;
    }

    value = decodeURIComponent( valueSearch[ 1 ].split( '+' ).join( ' ' ) );

    switch( type ) {
        case 'boolean':
            if( value.toLowerCase() === 'true' || value === 'on' || value === '1' ) {
                return true;
            }

            if( value.toLowerCase() === 'false' || value === 'off' || value === '0' ) {
                return false;
            }

            return defaultValue;

        case 'number':
            if( parseFloat( value ) + "" === value ) {
                return parseFloat( value );
            }

            return NaN;

        default:
            if( value.length === 0 ) {
                return defaultValue;
            }

            return value;
    }
}


/**
 * Returns the value of an option.
 *
 * @param name
 * @returns {*}
 */
export function get( name ) {
    return opt[ name ];
}


/**
 * Read options from the URL
 */
export function init( defaults ) {
    let option_key;

    defaults = defaults || {};

    for( option_key in defaults ) {
        if( defaults.hasOwnProperty( option_key ) && defaults[ option_key ] !== undefined ) {
            opt[ option_key ] = defaults[ option_key ];
        }
    }

    if( !opt.lock_story ) {
        // provide "storyfile" as an option to "story" to get around Quixe's automatic storyfile download if necessary
        opt.story = getParameter( 'story', 'string', opt.story ) || getParameter( 'storyfile', 'string', opt.story );
    }

    if( !opt.lock_options ) {
        for( option_key in opt ) {
            if( option_key !== 'story' && option_key !== 'storyfile' && opt.hasOwnProperty( option_key ) ) {
                opt[ option_key ] = getParameter( option_key, typeof opt[ option_key ], opt[ option_key ] );
            }
        }

        // special cases
        if( opt.exit_url === 'false' || opt.exit_url === '0' ) {
            opt.exit_url = false;
        }
    }
}


/**
 * Set the value of an option.
 *
 * @param name
 * @returns {*}
 */
export function set( name, value ) {
    opt[ name ] = value;
}

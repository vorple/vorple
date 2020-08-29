/**
 * Show an error message and halt.
 */
export default function error( message ) {
    const elem = document.createElement( 'div' );
    const spinner = document.getElementById( 'spinner' );
    const loader = document.getElementById( 'loader' );

    elem.id = 'fatal-error';
    elem.innerHTML = message;
    document.body.appendChild( elem );

    // remove spinner animation if error happened on load
    if( spinner ) {
        spinner.parentNode.removeChild( spinner );
    }

    // visual notification that loading has stopped
    if( loader ) {
        loader.className = 'stopped';
    }

    throw new Error( message );
}

export function remove() {
    const loaderOverlay = document.getElementById( 'loader' );

    if( loaderOverlay ) {
        loaderOverlay.parentNode.removeChild( loaderOverlay );
    }
}
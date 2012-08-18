module( 'notify' );

test( 'Notifications', function() {
    expect( 5 );
    vorple.notify.show( 'test' );
    $note = $( '.noty_bar' );

    equal( $note.length, 1, 'notification created' );

    equal( $note.text(), 'test', 'correct content' );

    $( document ).on( 'noty.close', '.noty_bar', function() {
        ok( true, 'notification removed' );
        $( this ).remove();
    } );

    vorple.notify.close();

    vorple.notify.show( 'test' );
    vorple.notify.show( 'test' );

    vorple.notify.closeAll();
} );

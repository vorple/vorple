/*
module( 'notify' );

test( 'Notifications', function() {

    expect( 2 );
    
    vorple.notify.defaults.callback = {
        onClose: function() {
            ok( true, 'notification removed' );
            $( this ).remove();
        } 
    };
    
    vorple.notify.show( 'test' );
    var $note = $( '.noty_bar' );

    equal( $note.length, 1, 'notification created' );

    equal( $note.text(), 'test', 'correct content' );

    vorple.notify.close();

    vorple.notify.show( 'test' );
    vorple.notify.show( 'test' );

    vorple.notify.closeAll();
    
    // the span is so that it's easier to build the selector
    vorple.notify.alert( '<span class="unittest">alert-test</span>' );
    // equal( $( '.noty_message .noty_text span.unittest' ).text(), 'alert-test' );
    
    // cleanup
    vorple.notify.closeAll();
} );
*/
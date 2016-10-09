require([ 'jquery', 'qunit', 'notify' ], function( $, QUnit, notify ) {
    QUnit.module( 'notify' );

    QUnit.test( 'Notifications', function( assert ) {

        assert.expect( 2 );

        notify.defaults.callback = {
            onClose: function () {
                assert.ok( true, 'notification removed' );
                $( this ).remove();
            }
        };

        notify.show( 'test' );
        var $note = $( '.noty_bar' );

        assert.equal( $note.length, 1, 'notification created' );

        assert.equal( $note.text(), 'test', 'correct content' );

        notify.close();

        notify.show( 'test' );
        notify.show( 'test' );

        notify.closeAll();

        // the span is so that it's easier to build the selector
        notify.alert( '<span class="unittest">alert-test</span>' );
        // assert.equal( $( '.noty_message .noty_text span.unittest' ).text(), 'alert-test' );

        // cleanup
        notify.closeAll();
    });
});
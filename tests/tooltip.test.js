require([ 'jquery', 'qunit', 'tooltip' ], function( $, QUnit, tooltip ) {
    QUnit.module( 'tooltip' );

    var $test1 = $( '<a href="foo" title="Test" id="test1"></a>' );
    var $test2 = $( '<span title="Test2"></a>' );

    $( 'body' ).append( $test1 );

    QUnit.test( 'show', function( assert ) {
        tooltip.show( 'a[title]' );
        assert.ok( $test1.qtip );
    });
});
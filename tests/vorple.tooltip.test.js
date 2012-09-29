module( 'tooltip' );

$( 'body' ).append( '<a href="foo" title="Test" id="test1"></a>' );
$test1 = $( '#test1' );
$test2 = $( '<span title="Test2"></a>' ); 

test( 'show', function() {
    vorple.tooltip.show( 'a[title]' );
    ok( $test1.qtip );
});

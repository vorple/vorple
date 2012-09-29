module('cookie');

test('read', function() {
	vorple.cookie.write( 'foo', 'bar' );
	equal( vorple.cookie.read( 'foo' ), 'bar', 'cookie set' );

	vorple.cookie.write( 'foo', 'baz' );
	equal( vorple.cookie.read( 'foo' ), 'baz', 'cookie reset' );
	
	vorple.cookie.remove( 'foo' );
	equal( vorple.cookie.read( 'foo' ), null, 'cookie removed')

	equal( vorple.cookie.read( 'bar' ), null, 'unknown cookie is null' );
	
	vorple.cookie.write( 'foo', 'baz' );
    vorple.cookie.write( 'bar', 'xyz' );
	var cookieList = vorple.cookie.list();
	
	ok( 
	   $.inArray( 'foo', cookieList ) > -1 && $.inArray( 'bar', cookieList ) > -1, 
	   'list cookie names' 
    );

    // cleanup	
    vorple.cookie.remove( 'foo' );
    vorple.cookie.remove( 'bar' );

});

test('remove', function() {
	vorple.cookie.remove('foo');
	equal(vorple.cookie.read('foo'), null, 'removed cookie is null');
}); 
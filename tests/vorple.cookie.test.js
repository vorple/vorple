module('cookie');

test('read', function() {
	vorple.cookie.write('foo', 'bar')

	equal(vorple.cookie.read('foo'), 'bar', 'cookie set');

	vorple.cookie.write('foo', 'baz');

	equal(vorple.cookie.read('foo'), 'baz', 'cookie reset');

	equal(vorple.cookie.read('bar'), null, 'unknown cookie is null');
});

test('remove', function() {
	vorple.cookie.remove('foo');
	equal(vorple.cookie.read('foo'), null, 'removed cookie is null');
}); 
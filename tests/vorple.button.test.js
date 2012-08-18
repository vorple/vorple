module('buttons');

test('basic button', function() {
	var button = new vorple.button.Button();
	var $element = $(button.html());

	equal($element.html(), '', 'empty button');

	button = new vorple.button.Button('Test', {
		classes : 'foo'
	});
	var $element = $(button.html());

	$element.appendTo('#qunit-fixture');

	equal($element.html(), 'Test', 'text');

	ok($element.hasClass('foo'), 'classes');

	ok(button.isEnabled(), 'Created as enabled');
	button.disable();
	ok(!button.isEnabled(), 'isEnabled is false after disable');

	window.eventTest = false;

	button = new vorple.button.Button('Test', function() {
		window.eventTest = true;
	});

	$element = $(button.html());
	$element.appendTo('#qunit-fixture').trigger('click');

	ok(window.eventTest, 'click event attached');

	window.eventTest = false;
	button.disable();
	$element.trigger('click');

	ok(!window.eventTest, 'no click event triggered when disabled');

	button2 = new vorple.button.Button('Test2', 'bar');
	$(button2.html()).appendTo('#qunit-fixture');
	button.enable();
	ok(button.isEnabled(), 'button 1 re-enabled');

	button2.disable();
	ok(!button2.isEnabled(), 'button 2 disabled');
	ok(button.isEnabled(), 'button 1 still enabled');

});

test('link', function() {
	var button = new vorple.button.Link();
	var $element = $(button.html());

	equal($element.html(), '', 'empty button');

	equal($element.attr('href'), '#', 'default href');

	button = new vorple.button.Link('Test', {
		classes : 'foo',
		href : 'bar'
	});
	$element = $(button.html());

	$element.appendTo('#qunit-fixture');

	equal($element.html(), 'Test', 'text');

	equal($element.attr('href'), 'bar', 'href');

	ok($element.hasClass('foo'), 'classes');

	ok(button.isEnabled(), 'Created as enabled');
	button.disable();
	ok(!button.isEnabled(), 'isEnabled is false after disable');

	window.eventTest = false;

	button = new vorple.button.Link('Test', function() {
		window.eventTest = true;
	});

	$element = $(button.html());
	$element.appendTo('body').trigger('click');

	ok(window.eventTest, 'click event attached');

	window.eventTest = false;
	button.disable();
	$element.trigger('click');

	ok(!window.eventTest, 'no click event triggered when disabled');
});

test('image', function() {
	var button = new vorple.button.Image('test.png');
	var $element = $(button.html());

	equal($element.attr('src'), vorple.media.defaults.imagePath + '/test.png', 'src');

	button = new vorple.button.Image('test.png', {
		classes : 'foo',
		disabledImage : '/disabled.png'
	});
	$element = $(button.html());

	$element.appendTo('#qunit-fixture');

	ok($element.hasClass('foo'), 'classes');

	ok(button.isEnabled(), 'Created as enabled');
	button.disable();
	ok(!button.isEnabled(), 'isEnabled is false after disable');

	equal($element.attr('src'), '/disabled.png', 'disabled image');

	window.eventTest = false;

	button = new vorple.button.Image('test.png', function() {
		window.eventTest = true;
	});

	$element = $(button.html());
	$element.appendTo('body').trigger('click');

	ok(window.eventTest, 'click event attached');

	window.eventTest = false;
	button.disable();
	$element.trigger('click');

	ok(!window.eventTest, 'no click event triggered when disabled');
});

module('button groups');

test('create', function() {
	var g = new vorple.button.Group();
	equal(g.html(), '<div></div>', 'group is empty');

	g = new vorple.button.Group(null, {
		id : 'foo',
		class : 'bar'
	});
	var $g = $(g.html());
	equal($g.attr("id"), 'foo', 'object container id');
	ok($g.hasClass('bar'), 'object container class');

	g = new vorple.button.Group(null, '<ul>');
	equal(g.html(), '<ul></ul>', 'container element specified as string');

	g = new vorple.button.Group('', {
		tag : 'ul'
	});
	equal(g.html(), '<ul></ul>', 'container element specified as tag');

	g = new vorple.button.Group(null, $('<ul>'));
	equal(g.html(), '<ul></ul>', 'jquery object as container');

	g = new vorple.button.Group('<span>bar</span>');
	equal(g.html(), '<div><span>bar</span></div>', 'string content');

	g = new vorple.button.Group(['<span>bar</span>', '<span>baz</span>']);
	equal(g.html(), '<div><span>bar</span><span>baz</span></div>', 'string array content');

	var button = new vorple.button.Button();
	g = new vorple.button.Group(button);
	$g = $(g.html());
	equal($g.find('button').length, 1, 'button content');

	g = new vorple.button.Group([button, '<span>baz</span>']);
	$g = $(g.html());
	equal($g.find('button').length, 1, 'button found');
	equal($g.find('span').length, 1, 'span found');

	$('#qunit-fixture').html('');
	g = new vorple.button.Group(button, $('#qunit-fixture'));
	ok($('#qunit-fixture').find('button').length > 0, 'inserted into container');
});

test('add', function() {
	var button1 = new vorple.button.Button();
	var button2 = new vorple.button.Link();
	var button3 = new vorple.button.Image('test.png');
	var g = new vorple.button.Group([button1, button2, '<span>foo</span>']);

	g.add(button3);
	var $g = $(g.html());
	equal($g.find('img').length, 1, 'button added');

	g.add(button3);
	equal($g.find('img').length, 1, 'button not added twice');
});

test('update', function() {
	var button1 = new vorple.button.Button();
	var button2 = new vorple.button.Link();
	var button3 = new vorple.button.Image('test.png');
	var g = new vorple.button.Group([button1, button2, '<span>foo</span>']);

	g.update([button1, button3]);
	var $g = $(g.html());
	equal($g.find('button').length, 1, 'button not removed');
	equal($g.find('a').length, 0, 'link removed');
	equal($g.find('img').length, 1, 'image added');

	g.update([button2, button3, button1], true);
	$g = $(g.html());
	ok($g.children().eq(0).is('button') && $g.children().eq(1).is('img') && $g.children().eq(2).is('a'), 'order preserved');

	g.update();
	$g = $(g.html());
	equal($g.html(), '', 'empty group');
});

test('enable/disable', function() {
	var button1 = new vorple.button.Button();
	var button2 = new vorple.button.Link();
	var g = new vorple.button.Group([button1, button2, '<span>foo</span>'], $('#qunit-fixture'));

	g.disable();
	ok(!button1.isEnabled() && !button2.isEnabled(), 'contents disabled');

	g.enable();
	ok(button1.isEnabled() && button2.isEnabled(), 'contents re-enabled');
});
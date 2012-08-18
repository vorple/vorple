module( 'html' );

test( '$toHtml', function() {
    equal( vorple.html.$toHtml( $( '<div class="foo">bar</div>' ) ), '<div class="foo">bar</div>' );
} );

test( 'attributes', function() {
    equal( vorple.html.attributes( {
        id : 'foo'
    } ), ' id="foo"', 'id' );
    equal( vorple.html.attributes( {
        classes : 'foo'
    } ), ' class="foo"', 'class' );
    equal( vorple.html.attributes( {
        id : 'foo',
        classes : 'bar'
    } ), ' class="bar" id="foo"', 'id+class' );
    equal( vorple.html.attributes( {
        id : 'foo',
        classes : 'bar',
        foo : 'baz'
    } ), ' class="bar" id="foo"', 'Unrecognized option' );
    equal( vorple.html.attributes( {} ), '', "Empty object" );
    equal( vorple.html.attributes( {
        foo : "bar"
    } ), '', "No valid matches" );
    equal( vorple.html.attributes( {
        classes : 'foo',
        escape : true
    } ), ' class=&quot;foo&quot;', 'Escape quotes' );
} );

test( 'escapeHtmlChars', function() {
    equal( vorple.html.escapeHtmlChars( '<div id="foo">\'hello & hi\'</div>' ), '&lt;div id=&quot;foo&quot;&gt;&apos;hello &amp; hi&apos;&lt;/div&gt;' );
    equal( vorple.html.escapeHtmlChars( 'nothing to change' ), 'nothing to change' );
    equal( vorple.html.escapeHtmlChars( '&& &amp; <&>' ), '&amp;&amp; &amp;amp; &lt;&amp;&gt;' );
} );

test( 'link', function() {
    var $link = $( vorple.html.link( 'foo', 'bar' ) );

    ok( $link.is( 'a' ), 'link created' );

    equal( $link.html(), 'bar', 'content ok' );

    equal( $link.attr( 'href' ), 'foo', 'href ok' );

    $link = $( vorple.html.link( 'foo', 'bar', {
        classes : 'baz',
        id : 'buzz'
    } ) );

    ok( $link.hasClass( 'baz' ) && $link.attr( 'id' ) == 'buzz', 'link options' );

    equal( vorple.html.link( {
        url : 'foo',
        content : 'bar'
    } ), '<a href="foo">bar</a>', 'link object' );

    var $link = $( vorple.html.link( {
        url : 'foo',
        content : 'bar',
        options : {
            classes : 'baz',
            id : 'buzz'
        }
    } ) );

    ok( $link.hasClass( 'baz' ) && $link.attr( 'id' ) == 'buzz', 'link object options' );

    // link popups

    $( vorple.html.link( [ {
        url : 'link1',
        content : 'content1'
    }, {
        url : 'link2',
        content : 'content2'
    }, {
        url : 'link3',
        content : 'content3'
    } ], 'test', {
        id : 'multipleLinkTest'
    } ) ).appendTo( '#qunit-fixture' );

    console.log( vorple.html.$toHtml( $( '#multipleLinkTest' ) ) );
    equal( $( '#multipleLinkTest' ).length, 1, 'popup link created' );

    $( '#multipleLinkTest' ).click();
    $popup = $( '.linkPopup' );

    equal( $popup.length, 1, 'link popup created' );

    equal( $popup.find( 'a' ).length, 3, 'contains all the links' );
} );

test( 'quotes', function() {
    equals( vorple.html.quote( 'foo' ), '"foo"', 'normal text' );

    equals( vorple.html.quote( 'foo "bar" baz' ), '"foo \"bar\" baz"', 'quoted text' );

    equals( vorple.html.quote( 'foo', "'" ), "'foo'", 'different quote style' );

    equals( vorple.html.quote( 'foo', [ '<<', '>>' ] ), '<<foo>>', 'different opening and closing tags' );
} );

test( 'replaceAttributes', function() {
    var $elem = $( '<div>' ).addClass( 'foo' ).attr( 'id', 'bar' );
    var newAttr = {
        rel : 'test',
        id : 'baz',
        classes : 'xyzzy'
    };

    vorple.html.replaceAttributes( $elem, newAttr );

    equal( $elem.attr( 'rel' ), 'test', 'new attribute added' );

    equal( $elem.attr( 'id' ), 'baz', 'old attribute changed' );

    ok( !$elem.hasClass( 'foo' ), 'old attribute removed' );

    ok( $elem.hasClass( 'xyzzy' ), 'new class added' );
} );

test( 'tag', function() {
    equal( vorple.html.tag( 'div', '--', {
        id : 'foo'
    } ), '<div id="foo">--</div>', 'div id' );
    equal( vorple.html.tag( 'br' ), '<br />', 'br' );
    equal( vorple.html.tag( 'div', '' ), '<div></div>', 'empty string content forces close tag' );
    equal( vorple.html.tag( 'div', null, {
        classes : 'foo',
        endTag : "always"
    } ), '<div class="foo"></div>', 'div class force end tag' );
    equal( vorple.html.tag( 'div', 'bar', {
        classes : 'foo',
        endTag : "never"
    } ), '<div class="foo">bar', 'div class no end tag' );
    equal( vorple.html.tag( 'br', '', {
        endTag : "never"
    } ), '<br>', 'br no slash' );
} );

test( 'url', function() {
    equal( vorple.html.url( 'test.html' ), 'test.html', 'basic url' );
    equal( vorple.html.url( 'test.html', 'foo' ), 'foo/test.html', 'filename + path' );
    equal( vorple.html.url( 'bar/test.html', 'foo' ), 'foo/bar/test.html', 'path/filename + path' );
    equal( vorple.html.url( '/bar/test.html', 'foo' ), '/bar/test.html', '/path/filename + path' );
    equal( vorple.html.url( './test.html', 'foo' ), './test.html', 'force local file' );
    equal( vorple.html.url( '../test.html', 'foo' ), '../test.html', 'relative path' );
    equal( vorple.html.url( 'http://example.com/test.html', 'foo' ), 'http://example.com/test.html', 'url + path' );
    equal( vorple.html.url( 'baz.php?s=http://example.com/test.html', 'foo' ), 'foo/baz.php?s=http://example.com/test.html', 'url as the file parameter' );
    equal( vorple.html.url(), '#', 'empty url -> #' );
}); 
require([ 'jquery', 'html', 'qunit' ], function( $, html, QUnit ) {
    QUnit.module( 'html' );

    QUnit.test( '$toHtml', function( assert ) {
        assert.equal(
            html.$toHtml( $( '<div class="foo">bar</div>' ) ),
            '<div class="foo">bar</div>',
            'jQuery object'
        );

        assert.equal(
            html.$toHtml( '<div></div>' ),
            false,
            'invalid parameter'
        );
    });

    QUnit.test( 'attributes', function( assert ) {
        assert.equal( html.attributes( {
            id: 'foo'
        } ), ' id="foo"', 'id' );
        assert.equal( html.attributes( {
            classes: 'foo'
        } ), ' class="foo"', 'class' );
        assert.equal( html.attributes( {
            id: 'foo',
            classes: 'bar'
        } ), ' class="bar" id="foo"', 'id+class' );
        assert.equal( html.attributes( {
            id: 'foo',
            classes: 'bar',
            foo: 'baz'
        } ), ' class="bar" id="foo"', 'Unrecognized option' );
        assert.equal( html.attributes( {} ), '', "Empty object" );
        assert.equal( html.attributes( {
            foo: "bar"
        } ), '', "No valid matches" );
        assert.equal( html.attributes( {
            classes: 'foo',
            escape: true
        } ), ' class=&quot;foo&quot;', 'Escape quotes' );
        assert.equal( html.attributes( {
            classes: 'foo'
        }, true ), ' class=&quot;foo&quot;', 'Escape quotes, given as second parameter' );
    } );

    QUnit.test( 'escapeHtmlChars', function( assert ) {
        assert.equal( html.escapeHtmlChars( '<div id="foo">\'hello & hi\'</div>' ), '&lt;div id=&quot;foo&quot;&gt;&apos;hello &amp; hi&apos;&lt;/div&gt;' );
        assert.equal( html.escapeHtmlChars( 'nothing to change' ), 'nothing to change' );
        assert.equal( html.escapeHtmlChars( '&& &amp; <&>' ), '&amp;&amp; &amp;amp; &lt;&amp;&gt;' );
    } );

    QUnit.test( 'link', function( assert ) {
        var $link = $( html.link( 'foo', 'bar' ) );

        assert.ok( $link.is( 'a' ), 'link created' );

        assert.equal( $link.html(), 'bar', 'content ok' );

        assert.equal( $link.attr( 'href' ), 'foo', 'href ok' );

        $link = $( html.link( 'foo', 'bar', {
            classes: 'baz',
            id: 'buzz'
        } ) );

        assert.ok( $link.hasClass( 'baz' ) && $link.attr( 'id' ) === 'buzz', 'link options' );

        assert.equal( html.link( {
            url: 'foo',
            content: 'bar'
        } ), '<a href="foo">bar</a>', 'link object' );

        $link = $( html.link( {
            url: 'foo',
            content: 'bar',
            options: {
                classes: 'baz',
                id: 'buzz'
            }
        } ) );

        assert.ok( $link.hasClass( 'baz' ) && $link.attr( 'id' ) === 'buzz', 'link object options' );

        // link popups

        $( html.link( [{
            url: 'link1',
            content: 'content1'
        }, {
            url: 'link2',
            content: 'content2'
        }, {
            url: 'link3',
            content: 'content3'
        }], 'test', {
            id: 'multipleLinkTest'
        }) ).appendTo( '#qunit-fixture' );

        assert.equal( $( '#multipleLinkTest' ).length, 1, 'popup link created' );

        $( '#multipleLinkTest' ).click();
        var $popup = $( '.linkPopup' );

        assert.equal( $popup.length, 1, 'link popup created' );
        assert.equal( $popup.find( 'a' ).length, 3, 'contains all the links' );

        $( 'body' ).click();
        assert.ok( !$popup.is( ':visible' ), 'clicking outside popup hides it' );
    } );

    QUnit.test( 'p', function( assert ) {
        assert.equal( html.p( 'test' ), html.tag( 'p', 'test' ) );
    });

    QUnit.test( 'quotes', function( assert ) {
        assert.equal( html.quote( 'foo' ), '"foo"', 'normal text' );

        assert.equal( html.quote( 'foo "bar" baz' ), '"foo \"bar\" baz"', 'quoted text' );

        assert.equal( html.quote( 'foo', "'" ), "'foo'", 'different quote style' );

        assert.equal( html.quote( 'foo', [ '<<', '>>' ] ), '<<foo>>', 'different opening and closing tags' );
    } );

    QUnit.test( 'replaceAttributes', function( assert ) {
        var $elem = $( '<div>' ).addClass( 'foo' ).attr( 'id', 'bar' );
        var newAttr = {
            rel: 'test',
            id: 'baz',
            classes: 'xyzzy'
        };

        html.replaceAttributes( $elem, newAttr );

        assert.equal( $elem.attr( 'rel' ), 'test', 'new attribute added' );

        assert.equal( $elem.attr( 'id' ), 'baz', 'old attribute changed' );

        assert.ok( !$elem.hasClass( 'foo' ), 'old attribute removed' );

        assert.ok( $elem.hasClass( 'xyzzy' ), 'new class added' );
    } );

    QUnit.test( 'tag', function( assert ) {
        assert.equal( html.tag( 'div', '--', {
            id: 'foo'
        } ), '<div id="foo">--</div>', 'div id' );
        assert.equal( html.tag( 'br' ), '<br />', 'br' );
        assert.equal( html.tag( 'div', '' ), '<div></div>', 'empty string content forces close tag' );
        assert.equal( html.tag( 'div', null, {
            classes: 'foo',
            endTag: "always"
        } ), '<div class="foo"></div>', 'div class force end tag' );
        assert.equal( html.tag( 'div', 'bar', {
            classes: 'foo',
            endTag: "never"
        } ), '<div class="foo">bar', 'div class no end tag' );
        assert.equal( html.tag( 'br', '', {
            endTag: "never"
        } ), '<br>', 'br no slash' );
    } );

    QUnit.test( 'url', function( assert ) {
        assert.equal( html.url( 'test.html' ), 'test.html', 'basic url' );
        assert.equal( html.url( 'test.html', 'foo' ), 'foo/test.html', 'filename + path' );
        assert.equal( html.url( 'bar/test.html', 'foo' ), 'foo/bar/test.html', 'path/filename + path' );
        assert.equal( html.url( '/bar/test.html', 'foo' ), '/bar/test.html', '/path/filename + path' );
        assert.equal( html.url( './test.html', 'foo' ), './test.html', 'force local file' );
        assert.equal( html.url( '../test.html', 'foo' ), '../test.html', 'relative path' );
        assert.equal( html.url( 'http://example.com/test.html', 'foo' ), 'http://example.com/test.html', 'url + path' );
        assert.equal( html.url( 'baz.php?s=http://example.com/test.html', 'foo' ), 'foo/baz.php?s=http://example.com/test.html', 'url as the file parameter' );
        assert.equal( html.url(), '#', 'no parameters returns #' );
        assert.equal( html.url( null, '/test' ), '/test', 'null filename returns path' );
    });
});
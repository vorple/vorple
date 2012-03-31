undum.game.id = "b44da7d8-387a-45ed-b83d-df71e916696c";
undum.game.version = "1.0";
undum.game.start = "start";

undum.game.vars = {};


undum.game.situations.start = new undum.SimpleSituation( 
    vorple.html.p( 
        'Click on the buttons in the menu on the right.',
        { classes: 'transient' }
    )
);



/**
 * COOKIES
 */
undum.game.situations.cookie = new undum.Situation({
    enter: function( character, system, from ) {
        // read the contents of stored cookies
        var textCookie = vorple.cookie.read( 'text' );
        
        var counter = vorple.cookie.read( 'counter' );
        
        // if the contents are null, there's no cookie saved
        if( counter == null ) {
            counter = 0;
        }
        
        // say "times" if the counter is not 1
        var s = ( counter == 1 ) ? '' : 's';
        
        system.write( 
            vorple.html.p(
                'You have visited this page '+counter+' time'+s+' before.'
            )
        );
        
        // increment the counter and update the cookie's value
        counter++;
        vorple.cookie.write( 'counter', counter );
        
        if( textCookie != null ) {
            system.write(
                vorple.html.p( 
                    "A cookie says: "
                    + vorple.html.quote( textCookie )
                )
            );
        }
        
        system.write(
            vorple.html.p(
                vorple.html.link(
                    './set-cookie',
                    'Set a cookie'
                ) 
                + ' or '
                + vorple.html.link(
                    './remove-cookie',
                    'remove the previous one'
                )
            )
        );
    },
    act: function( character, system, action ) {
        if( action == 'set-cookie' ) {
            var content = prompt( 'Give the content of the cookie' );
            if( content ) {
                // Write the cookie that expires in a week.
                // The default is one year.
                vorple.cookie.write( 'text', content, { expires: 7 } );
                system.write( 
                    vorple.html.p( 
                        'Cookie set. Reload the page and return here to see the saved cookie.' 
                    ) 
                );
            }
        }
        else {
            vorple.cookie.remove( 'everything' );
            system.write( vorple.html.p( 'Cookie deleted.' ) );            
        }
    }
});


/**
 * CORE
 */
undum.game.situations.core = new undum.Situation({
    enter: function( character, system, from ) {
        /**
         * vorple.core.version & vorple.core.release
         * vorple.core.engine()
         */
        system.write( 
            vorple.html.p(
                "Vorple version " + vorple.core.version
                + " release " + vorple.core.release
                + " using " + vorple.core.engine() + " engine"
            )
        );
        
        /**
         * vorple.core.generateId()
         */
        system.write(
            vorple.html.p(
                    "A random id: " + vorple.core.generateId( 16 )
            )
        );
    }
});


/**
 * HTML
 */
undum.game.situations.html = new undum.Situation({
    enter: function( character, system, from ) {
        /**
         * vorple.html.p()
         */
        system.write(
            vorple.html.p( "Here's a paragraph of text." )
        );
        
        /**
         * vorple.html.link()
         */
        system.write(
            vorple.html.p(
                "Here's a "
                + vorple.html.link( './target', 'normal link' )
                + " and a "
                + vorple.html.link( 
                    './target', 
                    'link with attributes',
                    {
                        classes: 'once',
                        title: 'This is a link!'
                    }
                    // note that a tooltip will be generated
                    // for this link because it has a title
                    // attribute and a tooltip has been
                    // added to all links with titles 
                    // in undum.game.init().
                )
                + ". A link with "
                + vorple.html.link([
                        {
                            content: 'First option',
                            url: './first'
                        },
                        {
                            content: 'Second option',
                            url: './second'
                        }
                    ],
                    'multiple options'
                )
                + '.'
            )
        );

        /**
         * vorple.html.tag()
         */
        system.write(
            vorple.html.p(
                vorple.html.tag( 
                    'div', 
                    "This div's attributes will change when you click "
                    + vorple.html.link( './change', 'this link' ) + ".",
                    {
                        classes: 'attributeChanger'
                    }
                )
            )
        );
    },
    
    /**
     * vorple.html.quote()
     */
    act: function( character, system, action ) {
        switch( action ) {
            case 'target':
                system.write(
                    vorple.html.p(
                        "A hollow voice says, "+vorple.html.quote( 'Fool' )+"."
                    )
                );
                break;
                
            /**
             * jQuery helpers
             * vorple.html.$toHtml()
             * vorple.html.replaceAttributes()
             * 
             * vorple.html.escapeHtmlChars()
             */
            case 'change':
                vorple.html.replaceAttributes(
                    $( '.attributeChanger' ),
                    {
                        style: 'color:#337; font-style:italic;',
                        // the existing attributes must be given
                        // or they'll be removed
                        classes: 'attributeChanger'
                    }
                );
                system.write(
                    vorple.html.p(
                        "The new HTML code of the div is:"
                    )
                    +vorple.html.tag(
                        'code',
                        vorple.html.escapeHtmlChars(
                            vorple.html.$toHtml( $( '.attributeChanger' ) )
                        )
                    )
                );
                break;
            case 'first':
                system.write( vorple.html.p( 'You clicked the first option.' ) );
                break;
            case 'second':
                system.write( vorple.html.p( 'You clicked the second option.' ) );
                break;
        }
    }
});


/**
 * MEDIA
 */

/**
 * Image preloading. The image will be loaded when the story starts so that 
 * when it's displayed in the story it appears immediately. If images are
 * not preloaded they might take some time to appear while they're loaded
 * from the server.
 * 
 * vorple.html.preloadImage( 'image1.jpg', 'image2.jpg', ... );
 * would load several images at the same time.
 */
vorple.media.preloadImage( 'dodo.jpg' );

undum.game.situations.media = new undum.Situation({
    enter: function( character, system, from ) {
        system.write( 
            vorple.html.p(
                "An image of a "
                + vorple.html.link( './puppy', 'puppy' )
                + " and a preloaded image of a "
                + vorple.html.link( './dodo', 'dodo' )
                + ". A "
                + vorple.html.link(
                    './youtube',
                    'YouTube video',
                    { classes: 'transient' }
                )
                /*
                + " and a "
                + vorple.html.link(
                    './video',
                    'local video',
                    { classes: 'transient' }
                )
                */
                + ". Some "
                + vorple.html.link( './emptyrooms', 'music' )
                + " and some "
                + vorple.html.link( './steady', 'more music' )
                + ". Sound effects: "
                + vorple.html.link( './whoosh', 'whoosh' )
                + ", "
                + vorple.html.link( './pong', 'pong' )
                + " and "
                + vorple.html.link( './cheer', 'cheer' )
                + "."
            )
            + vorple.html.p(
                vorple.html.link( './stop-sounds', 'Stop sounds' )
                + ", "
                + vorple.html.link( './stop-music', 'stop music' )
                + ", or "
                + vorple.html.link( './stop-all', 'stop both' )
                + "."
            )
        );
    },
    act: function( character, system, action ) {
        switch( action ) {
        /**
         * Images. vorple.html.image( 'picture.jpg' ) creates a 
         * <img src="media/images/picture.jpg" /> tag. The default
         * media path is added to the filename. 
         * 
         * dodo.jpg should appear immediately because it has been
         * preloaded, but puppy.jpg might have a delay while it's
         * retrieved from the server only at this point.
         */
            case 'puppy':
                system.write( vorple.html.p( vorple.media.image( 'puppy.jpg' ) ) );
                break;
            case 'dodo':
                system.write( vorple.html.p( vorple.media.image( 'dodo.jpg' ) ) );
                break;
        /**
         * YouTube video embedding.
         */
            case 'youtube':
                system.write(
                    vorple.html.p(
                        vorple.media.youtube( 
                            'eFQxRd0isAQ',
                            {
                                width: '500',
                                height: '280',
                                parameters: {
                                    autoplay: '1',  // start playing immediately
                                    controls: '0',  // hide user controls
                                    disablekb: '1', // disable keyboard controls
                                    rel: '0'        // don't load related videos
                                }
                            }
                        ),
                        { classes: 'videocontainer' }
                    )
                );
                break;
            case 'video':
                break;
            case 'emptyrooms':
                vorple.media.playMusic({ 
                    mp3: 'emptyrooms.mp3',
                    oga: 'emptyrooms.ogg'
                });
                break;
            case 'steady':
            /**
             * Music credits:
             *  "Empty rooms (small theme)" by _ghost (http://ccmixter.org/files/_ghost/31006)
             *  "Steady" by Nethis (http://ccmixter.org/files/Nethis/33225)
             */
                vorple.media.playMusic({ 
                    mp3: 'steady.mp3',
                    oga: 'steady.ogg'
                });
                break;
            /**
             * Sound effect credits:
             * whoosh: http://www.freesound.org/people/Benboncan/sounds/62260/
             * pong: http://www.freesound.org/people/schluppipuppie/sounds/13401/
             * cheer: http://www.freesound.org/people/lonemonk/sounds/31169/
             */
            case 'whoosh':
            case 'pong':
            case 'cheer':
                vorple.media.playSound({
                    mp3: action+'.mp3',
                    oga: action+'.ogg'
                });
                break;
            case 'stop-music':
                vorple.media.stopMusic();
                break;
            case 'stop-sounds':
                vorple.media.stopSounds();
                break;
            case 'stop-all':
                vorple.media.stopAll();
                break;
        }
    },
    exit: function( character, system, to ) {
        /**
         * Cleanup for the videos so that they will be removed when we
         * move on to the next situation.
         */
        $( '.videocontainer' ).remove();
        
        /**
         * Stop all music and sound effects when leaving the situation.
         */
        vorple.media.stopAll();
    }
});


/**
 * NOTIFY
 */
undum.game.situations.notify = new undum.Situation({
    enter: function( character, system, from ) {
        vorple.notify.show( 'Welcome!', { layout: 'top' } );
        
        system.write(
            vorple.html.p(
                "Click to trigger notifications:"
            )
            + vorple.html.tag(
                'ul',
                vorple.html.tag(
                    'li',
                    vorple.html.link( 
                        './top',
                        'Top'
                    )
                    + ', '
                    + vorple.html.link( 
                        './bottom',
                        'bottom'
                    )
                    + ', '
                    + vorple.html.link( 
                        './center',
                        'center'
                    )
                    + ', '
                    + vorple.html.link( 
                        './topcenter',
                        'top center'
                    )
                    + ' (notifications are put into a queue)'
                )
                + vorple.html.tag(
                    'li',
                    vorple.html.link( 
                        './topleft',
                        'Top left'
                    )
                    + ', '
                    + vorple.html.link( 
                        './topright',
                        'top right'
                    )
                    + ', '
                    + vorple.html.link( 
                        './bottomleft',
                        'bottom left'
                    )
                    + ', '
                    + vorple.html.link( 
                        './bottomright',
                        'bottom right'
                    )
                )
                + vorple.html.tag(
                    'li',
                    vorple.html.link( 
                        './error',
                        'Error message'
                    )
                    + ', '
                    + vorple.html.link( 
                        './success',
                        'success notification'
                    )
                )
                + vorple.html.tag(
                    'li',
                    vorple.html.link( 
                        './question',
                        'Modal closable dialog'
                    )
                )
            )
        );
    },
    act: function( character, system, action ) {
        switch( action ) {
            case 'top':
                vorple.notify.show( 'Top notification', { layout: 'top' } );
                break;                
            case 'bottom':
                vorple.notify.show( 'Bottom notification', { layout: 'bottom' } );
                break;                
            case 'topleft':
                vorple.notify.show( 'Top left notification', { layout: 'topLeft' } );
                break;                
            case 'topcenter':
                vorple.notify.show( 'Top center notification', { layout: 'topCenter' } );
                break;                
            case 'topright':
                vorple.notify.show( 'Top right notification', { layout: 'topRight' } );
                break;                
            case 'bottomleft':
                vorple.notify.show( 'Bottom left notification', { layout: 'bottomLeft' } );
                break;                
            case 'bottomright':
                vorple.notify.show( 'Bottom right notification', { layout: 'bottomRight' } );
                break;                
            case 'center':
                vorple.notify.show( 'Center notification', { layout: 'center' } );
                break;                  
            case 'error':
                vorple.notify.show( 
                    'Something is wrong!', 
                    { layout: 'topLeft', type: 'error' } 
                );
                break;
            case 'success':
                vorple.notify.show( 
                    'Everything went better than expected!', 
                    { layout: 'topLeft', type: 'success' } 
                );
                break;
            case 'question':
                // make sure the dialog doesn't get stuck in the queue
                vorple.notify.closeAll();
                vorple.notify.show(
                    'How about it?',
                    { 
                        buttons: [ 
                            {
                                type: 'button',
                                text: 'Sure',
                                click: function( $notification ) {
                                    $notification.close();
                                    vorple.notify.show( 
                                        'Great!', 
                                        { layout: 'bottom', type: 'success' } 
                                    );
                                }
                            }, 
                            {
                                type: 'button',
                                text: 'Maybe',
                                click: function( $notification ) {
                                    vorple.notify.show( 
                                        'Make up your mind!', 
                                        { layout: 'topLeft' } 
                                    );
                                }
                            }, 
                            {
                                type: 'button',
                                text: 'Nah',
                                click: function( $notification ) {
                                    $notification.close();
                                    vorple.notify.show( 
                                        'Such a shame.', 
                                        { layout: 'bottom', type: 'error' } 
                                    );
                                }
                            } 
                        ],
                        closable: true,
                        layout: 'center', 
                        modal: true,
                        timeout: false
                    } 
                );
            default:
                break;
        }
    }
});


/**
 * TOOLTIPS
 */
undum.game.situations.tooltip = new undum.Situation({
    enter: function( character, system, from ) {
        system.write(
            vorple.html.p(
                vorple.html.tag(
                    'ul',
                    vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Tooltip on hover',
                            { title: 'Hello!', classes: 'hoverTooltip' }
                        )
                    )
                    + vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Tooltip on click',
                            { title: 'You clicked me!', classes: 'clickTooltip' }
                        )
                    )
                    + vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Tooltip in different position',
                            { title: "Now I'm here!", classes: 'positionTooltip' }
                        )
                    )
                    + vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Tooltip with a different target',
                            { title: "This is the current version of Vorple.", classes: 'projectedTooltip' }
                        )
                    )
                    + vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Immediately triggered tooltip',
                            { classes: 'triggeredTooltip' }
                        )
                    )
                    + vorple.html.tag(
                        'li',
                        vorple.html.tag( 
                            'span',
                            'Tooltip following the mouse',
                            { title: "This tooltip follows the mouse!", classes: 'mouseTooltip' }
                        )
                    )
                )
            )
        );
        
        vorple.tooltip.enable( '.hoverTooltip' );
        vorple.tooltip.enable( '.clickTooltip', { show: { event: 'click' } } );
        vorple.tooltip.enable( '.positionTooltip', { position: { my: 'left top', at: 'right center' } } );
        vorple.tooltip.enable( 
            '.projectedTooltip', 
            { 
                position: { 
                    target: $( '.vorple-version' ),
                    my: 'bottom center', 
                    at: 'top center' 
                }
            } 
        );
        
         
        vorple.tooltip.enable(
            '.mouseTooltip',
            {
                position: {
                    target: 'mouse'
                }
            }
        ); 
        
        $( '.triggeredTooltip' ).attr( 'title', 'test' );
        vorple.tooltip.show( '.triggeredTooltip', 'This tooltip was triggered when you entered this situation' );
         
        /**
         * The overwrite option will replace the old tooltip with this one
         * when the element is clicked.
         */
        $( '.delegatedTooltip' ).click( function( e ) {
            vorple.tooltip.enable(
                '.delegatedTooltip',
                { 
                    overwrite: true,
                    show: { event: 'click', ready: true },
                    content: { text: "Clicking doesn't do anything! Well, except change the tooltip." }
                }
            );
            e.preventDefault();
        });
         
    }
});


/**
 * UNDUM
 */
undum.game.situations.undum = new undum.Situation({
    enter: function( character, system, from ) {
        system.write(
            vorple.html.p(
                vorple.html.link(
                    './dispose-now',
                    'Disposable link'
                )
                + ', '
                + vorple.html.link(
                    './dispose-next',
                    'a link that disposes of the next link'
                )
                + ' ('
                + vorple.html.link(
                    './dispose-target',
                    'this one' 
                )
                + ').'
            )
            + vorple.html.p(
                vorple.html.link(
                    './unique-demo',
                    'First unique link',
                    { classes: 'unique' }
                )
                + ', '
                + vorple.html.link(
                    './unique-demo',
                    'second unique link',
                    { classes: 'unique' }
                )
                + ' and '
                + vorple.html.link(
                    './unique-demo',
                    'third unique link',
                    { classes: 'unique' }
                )
                + ' &mdash; only the first one is active.'
            )
        );
    },
    act: function( character, system, action ) {
        switch( action ) {
            case 'dispose-next':
                vorple.undum.dispose( 'dispose-target' );
                system.write( vorple.html.p( "Disposed." ) );
                break;
            case 'dispose-now':
                system.write( 
                    vorple.html.p( 
                        "The link won't be shown the next time you return to this situation."
                    )
                );
                break;
            case 'dispose-target':
            case 'unique-demo':
                system.write( 
                    vorple.html.p( 
                        "That link doesn't do anything."
                    )
                );
                break;
                
        }
    }
});


/**
 * Enable tooltips in all links
 */
vorple.tooltip.enable( 'a' );


undum.game.init = function( character, system ) {
    /**
     * BUTTONS
     */

    // clear the navigation element so that buttons won't be duplicated
    // when clearing the save game (which restarts the game and re-runs 
    // undum.game.init()
    $( '#navButtons' ).empty();
    
    var navButtonGroup = new vorple.button.Group([
        new vorple.button.Button( 'Cookie', function() { system.doClick( 'cookie' ); } ),
        new vorple.button.Button( 'Core', function() { system.doClick( 'core' ); } ),
        new vorple.button.Button( 'HTML', function() { system.doClick( 'html' ); } ),
        new vorple.button.Button( 'Media', function() { system.doClick( 'media' ); } ),
        new vorple.button.Button( 'Notify', function() { system.doClick( 'notify' ); } ),
        new vorple.button.Button( 'Tooltip', function() { system.doClick( 'tooltip' ); } ),
        new vorple.button.Button( 'Undum', function() { system.doClick( 'undum' ); } )
     ], '#navButtons' );

    // Handler for the "toggle all" button
    $( '#toggleAll' ).click( function() {
        vorple.media.toggleMute( [ 'music', 'sound' ] );
    });
        
    vorple.core.settings.confirmWindowClose = true;
    vorple.core.settings.debug = true;
    
    vorple.undum.settings.disposableLinks = [ 'dispose-now' ];
 
    
    /** Initialize and start Vorple. This line is mandatory. */
    vorple.core.init( system );
};

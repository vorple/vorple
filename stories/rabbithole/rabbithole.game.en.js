undum.game.id = "36c3ad41-4924-434b-8632-bab19a24124a";
undum.game.version = "1.0";
undum.game.start = "start";


// vorple.core.settings.debug = true;
vorple.core.settings.confirmWindowClose = true;


undum.game.situations.start = new undum.Situation( {
    enter: function( character, system, from ) {
        character.sandbox.atStart = true;

        if( from == null ) {
            // show the intro for the first time
            system.write(
                vorple.html.p( "Down, down, down. Would the fall "
                    + vorple.html.tag( 'em', 'never' )
                    + " come to an end!" )
                + vorple.html.p( "Suddenly, thump! thump! down you come upon a "
                    + "heap of sticks and dry leaves, and the fall is over." )
                + vorple.html.p( "You find yourself in a long, low hall, which is lit by "
                    + vorple.html.link(
                        "./lamps",
                        "a row of lamps",
                        { classes: 'once' }
                    ) + " hanging from the roof. There are doors all round "
                    + "the hall with signs above them." 
                )
                + vorple.html.tag( 
                    'span', 
                    '?',
                    {
                        "data-dialog": "buttons",
                        classes: "info-icon outside transient"
                    }
                )
            );
        }
        else {
            system.write( vorple.html.p( "You return to the hall." ) );
        }

        system.write( undum.game.mainButtons.html() );
    },
    exit: function( character, system, to ) {
        // show a tooltip that describes what the back button does,
        // but only on the first time
        if( character.sandbox.firstVisit ) {
            vorple.tooltip.show(
                '#reset-button',
                "Click this button to go back to the start and select a new door",
                {
                    position: {
                        my: 'top right',
                        at: 'bottom center'
                    },
                    delay: 3000,
                    // this makes sure the tooltip stays fixed when the page scrolls
                    style: {
                        classes: 'static-tooltip' 
                    }
                }
            );
            character.sandbox.firstVisit = false;
        }
                
        character.sandbox.atStart = false;
    },
    act: function( character, system, action ) {
        // there's only one action, no need to check which it is
        
        // image by Paul-Henri S (http://www.flickr.com/photos/polanri/1385235361/)
        system.write( 
                vorple.html.tag(
                    'div',
                    '?',
                    {
                        "data-dialog": "helpers",
                        classes: "info-icon outside transient"
                    }
                )
            );
        system.write( vorple.media.image( 'lamps.jpg' ) );
    }
} );

undum.game.situations.theater = new undum.Situation( {
    enter: function( character, system, from ) {
        // The container for the video player
        system.write( 
            vorple.html.tag( 'div', '', { id: 'silverscreen' } ) 
            + vorple.html.tag(
                'div',
                '?',
                {
                    "data-dialog": "youtube",
                    classes: "info-icon outside transient"
                }
            ) 

        );
        
        system.write( 
            vorple.html.p( "You enter a lavish movie theater. "
                + "There's a "
                + vorple.html.link( './movie', 'movie projector' )
                + " on the opposite wall from the silverscreen."
            ) 
        );
    },
    act: function( character, system, action ) {
        // choose which element on the screen acts as the video's container
        $screen = $( '#silverscreen' ); 
        
        // If the screen is empty, start the video. Otherwise remove it.
        if( $screen.html() == '' ) {
            $screen.html(
                vorple.media.youtube( 
                    'bsGEWHNJ3s8',
                    {
                        width: '500',
                        height: '281',
                        parameters: {
                            autoplay: '1',  // start playing immediately
                            controls: '0',  // hide user controls
                            disablekb: '1', // disable keyboard controls
                            rel: '0'        // don't load related videos
                        }
                    }
                )
            );
        }
        else {
            $screen.empty();
            system.write(
                vorple.html.p(
                    'You switch the projector off.',
                    { classes: 'transient' }
                )
            );
        }
    },
    exit: function( character, system, to ) {
        // Stop the embedded video by removing its container.
        // Slide the container up and remove it after the animation is done.
        $( '#silverscreen' ).slideUp( function() { 
            $( '#silverscreen' ).remove();
        });
    }
});

undum.game.situations.museum = new undum.Situation({
    enter: function( character, system, from ) {
        var visited = vorple.cookie.read( 'libraryVisit' );
        
        system.write(
            vorple.html.tag(
                'div',
                '?',
                {
                    "data-dialog": "cookies",
                    classes: "info-icon outside transient"
                }
            ) 
        );
        
        if( visited ) {
            system.write(
                vorple.html.p( 
                    vorple.html.quote( "Oh, it's you again," )
                    + " the curator says and goes back to his tasks."
                )
            );
        }
        else {
            system.write(
                vorple.html.p(
                    "The curator greets you as you enter. "
                    + vorple.html.quote( "Welcome, stranger," )
                    + " he says."
                )
            );
        }
        
        
        system.write(
            vorple.html.p(
                "A couple of paintings hang on the museum walls." )
                + vorple.html.tag(
                    'div',
                    '?',
                    {
                        "data-dialog": "tooltips",
                        classes: "info-icon outside transient"
                    }
                ) 
                + vorple.media.image( 
                    'teaparty.jpg', 
                    { 
                        title: "Mad Hatter's tea party", 
                        classes: 'float-left museum-image' 
                    } 
                )
                + vorple.media.image( 
                    'rabbit.jpg', 
                    { 
                        title: "The White Rabbit", 
                        classes: 'float-left museum-image' 
                    } 
                )
            
            + vorple.html.tag( 'div', '', { classes: 'clear-float' } )
        );
        
        vorple.cookie.write( 'libraryVisit', '1' );
    }
});

undum.game.situations.music = new undum.Situation({
    enter: function( character, system, from ) {
        system.write( 
            vorple.html.tag(
                'div',
                '?',
                {
                    "data-dialog": "audio",
                    classes: "info-icon outside transient"
                }
            ) 
            + vorple.html.p(
                "An old "
                + vorple.html.link( './gramophone', 'gramophone' )
                + " sits in the corner and there are many musical instruments here."
            ) +
            vorple.html.p(
                vorple.html.link( 
                    './guitar', 
                    vorple.media.image( 'guitar.png', { classes: 'float-left' } )
                )
                + vorple.html.link(
                    './drum',
                    vorple.media.image( 'drum.png', { classes: 'float-left' } )
                )
                + vorple.html.link(
                    './glockenspiel',    
                    vorple.media.image( 'glockenspiel.png', { classes: 'float-left' } )
                )
            )
            + vorple.html.tag( 'div', '', { classes: 'clear-float' } )
        );
        /*
         * Image credits:
         * guitar.png: Marfalogia CC-BY-SA-3.0 (http://commons.wikimedia.org/wiki/File:CrafterD-8TS.jpg)
         * drum.png: Geheimnisträgerin CC-BY-SA-3.0 (http://commons.wikimedia.org/wiki/File:Trixon_Tom.jpg)
         * glockenspiel.png: flamurai, public domain (http://commons.wikimedia.org/wiki/File:Glockenspiel-malletech.jpg)
         */
    },
    exit: function( character, system, to ) {
        // make sure the music stops when we leave
        vorple.media.stopMusic();
    },
    act: function( character, system, action ) {
        switch( action ) {
            // music player
            case 'gramophone':
                // "Alpine Summer" by rocavaco (feat. Mihai Sorohan, Die lustigen Toggenburger, vo1k1, Clarence Simpson)
                // http://ccmixter.org/files/rocavaco/28950
                vorple.media.playMusic({ 
                    mp3: 'Alpine_Summer.mp3',
                    oga: 'Alpine_Summer.ogg'
                });
                system.write(
                    vorple.html.p(
                        'The gramophone starts playing a tune. You can '
                        + vorple.html.link( 
                            './gramophone-off', 
                            'turn it off',
                            { classes: 'once' }
                        )
                        + ' at any time.',
                        { classes: 'transient' }
                    )
                );
                break;
            case 'gramophone-off':
                vorple.media.stopMusic();
                system.write( vorple.html.p( 'You turn the gramophone off.' ) );
                break;
            /* Everything else. The actions are named the same
             * as the sound files so we can use the action's
             * name to load the files.
             *  
             * Credits:
             * glockenspiel: cfork CC-BY (http://www.freesound.org/people/cfork/sounds/26876/)
             * guitar: ERH CC-BY (http://www.freesound.org/people/ERH/sounds/58827/)
             * drum: Zajo CC Sampling+ (http://www.freesound.org/people/Zajo/sounds/4853/)
             */
            default:
                vorple.media.playSound({
                    mp3: action+'.mp3',
                    oga: action+'.ogg'
                });
                break;
        }
    }
});

undum.game.situations.garden = new undum.SimpleSituation(
    vorple.html.tag(
        'div',
        '?',
        {
            "data-dialog": "undum",
            classes: "info-icon outside transient"
        }
    ) + vorple.html.p(
        "You enter a beautiful garden. The "
        + vorple.html.link( './smells', 'smells', { classes: 'once' } )
        + " and the "
        + vorple.html.link( './sights', 'sights', { classes: 'once' } )
        + " are most agreeable. There's a "
        + vorple.html.link( './cage', 'bird cage' )
        + " hanging from a tree."
    ),
    {
        actions: {
            smells: vorple.html.p( "The "
                + vorple.html.link( './flowers', 'flowers', { classes: 'unique' } )
                + " fill the air with sweet scents." ),
            sights: vorple.html.p( "All kinds of "
                + vorple.html.link( './flowers', 'flowers', { classes: 'unique' } )
                + " make the garden look like a colorful quilt." ),
            cage: vorple.html.p( "As you approach the cage you see a hummingbird "
                + "trapped inside it. You open the cage door and the bird "
                + "flies to freedom." ),
            flowers: vorple.html.p( "Flowers of every color grow everywhere in the garden." )
        }
    }
);

undum.game.init = function( character, system ) {
    character.sandbox.atStart = true;
    character.sandbox.firstVisit = true;
    
    // Disposable links
    vorple.undum.settings.disposableLinks = [ 'cage' ];
    
    // Main room buttons
    var buttons = [
           new vorple.button.template.Link({ url: 'theater', text: 'Theater' }),
           new vorple.button.template.Link({ url: 'museum', text: 'Museum' }),
           new vorple.button.template.Link({ url: 'music', text: 'Music room' }),
           new vorple.button.template.Link({ url: 'garden', text: 'Garden' })
       ];
    
    undum.game.mainButtons = new vorple.button.Group( buttons, { classes: 'transient mainbuttons' } );
    
    // Go back to the start when the back button is clicked
    $( '#reset-button' ).click( function( e ) {
        if( !character.sandbox.atStart ) {
            character.sandbox.atStart = true;
            system.doClick( 'start' );
            e.preventDefault();
        }
        else {
            system.write(
                vorple.html.p( 
                    'You are already in the hallway.',
                    { classes: 'transient' }
                )
            );
        }
    });
    

    // have the museum pictures trigger a tooltip
    vorple.tooltip.enable(
        '.museum-image',
        {
            position: {
                my: 'top center',
                at: 'bottom center'
            }
        }
    );
    
    
    vorple.core.init();
};


/*
 * This makes clicking on the ? buttons open the dialogs.
 * The info texts are inside the html file. 
 */
$( document ).delegate( '.info-icon', 'click', function( event ) {
    $( '#' + $( this ).data( 'dialog' ) ).dialog( {
        buttons: { "Close": function() { $( this ).dialog( "close" ); } },
        modal: true,
        resizable: false,
        width:800
    });
} );

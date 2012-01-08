/*  vorple.media.js - Videos and sounds */

( function( $ ) {
    /** @namespace Audio and video functions. */
    vorple.media = {
        _muted: { 
            music: false,
            sound: false
        }
    };
    
    
    /**
     * Default options for the media player
     */
    vorple.media.defaults = {
        type: 'sound',
        
        // default locations of media
        audioPath: 'media/audio',
        imagePath: 'media/image',
        musicPath: 'media/music',
        videoPath: 'media/video',
        
        // jPlayer options
        muted: false,
        mainContainer: 'vorple-media',
        musicContainer: 'vorple-music',
        soundContainer: 'vorple-sound',
        playerSolution: 'html, flash',
        preload: 'auto',
        swfPath: 'lib',
        volume: 0.8
    };
    
    
    /**
     * Creates the main audio container if it doesn't exist already.
     * 
     * @param {jQuery} id The id of the container to create
     * @param {jQuery} [$parent] The parent to append this container to.
     * The default is document body.
     * @return {jQuery} The container itself as a jQuery object.
     * @private
     */
    vorple.media._createMainContainer = function( id, $parent ) {
        if( $( '#'+id ).length == 0 ) {
            if( typeof $parent === 'undefined' ) {
                $parent = $( 'body' );
            }
            
            $parent.append( $( '<div id="'+id+'"></div>' ) );
        }
        
        return $( '#'+id );
    };
        

    /**
     * Creates a container that can be used by the media player.
     * 
     * @param {Object} [options] 
     * @param {String|jQuery} [options.element]
     * An existing container as a jQuery object or a jQuery constructor string.
     * If the container option is given, the existing container is returned
     * and no new one is created.
     * @param {String|jQuery} [options.parent]
     * The parent of the the player element. If it doesn't exist,
     * it will be created and appended to the HTML body.
     * @return The created container as a jQuery object.
     * @private
     */
    vorple.media._createPlayer = function( options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );
                
        if( typeof opt.element == 'string' ) {
            return $( '#'+opt.element );
        }
        else if( $.type( opt.element ) === 'object' && opt.element.jquery ) {
            return opt.element;
        }
        else {
            var $parent;
            if( typeof opt.parent === 'object' && opt.parent.jquery ) {
                $parent = opt.parent;
            }
            else if( typeof opt.parent === 'string' ) {
                $parent = self._createMainContainer( opt.parent, $( '#'+opt.mainContainer ) );
            }
            else if( typeof opt.mainContainer === 'object' && opt.mainContainer.jquery ) {
                $parent = opt.mainContainer;
            }
            else {
                $parent = $( '#'+opt.mainContainer ); 
            }
            
            $element = $( '<div id="jplayer_'+vorple.core.generateId()
                    +'" class="jp-jplayer"></div>' );

            $parent.append( $element );
            
            return $element;
        }
    };
    
    
    /**
     * Mutes or unmutes all given types of media. Muting affects also future 
     * instances of the given media. 
     * Note that muting doesn't stop loading the media files, 
     * they are just played without sound.
     * 
     * @example Mute music and unmute sound: 
     *   vorple.media.mute({ music: true, sound: false });
     * 
     * @param {Object} types The types of media to affect and the mute status
     * of those objects as boolean (true: mute, false: unmute).
     * @param {Object} options Options if default containers must be overridden.
     */
    vorple.media.mute = function( types, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );

        if( typeof types.music !== 'undefined' ) {
            self._muted.music = types.music;
            $( '#'+opt.musicContainer ).jPlayer(
                ( types.music ? 'mute' : 'unmute' )
            );
            // toggle muteboxes
            $( 'input.mute[value="music"]' ).attr( 'checked', types.music );
            $( 'input.unmute[value="music"]' ).attr( 'checked', !types.music );
            if( !types.music ) {
                $( 'input.mute[value="all"]' ).attr( 'checked', false );
            }
            else {
                $( 'input.unmute[value="all"]' ).attr( 'checked', false );
            }
        }
        
        if( typeof types.sound !== 'undefined' ) {
            self._muted.sound = types.sound;
            $( '#'+opt.soundContainer ).children().jPlayer(
                ( types.sound ? 'mute' : 'unmute' )
            );
            // toggle muteboxes
            $( 'input.mute[value="sound"]' ).attr( 'checked', types.sound );
            $( 'input.unmute[value="sound"]' ).attr( 'checked', !types.sound );
        }
        
        // check the status of the global mute
        $( 'input.mute[value="all"]' ).attr( 'checked', self._muted.sound && self._muted.music );
        $( 'input.unmute[value="all"]' ).attr( 'checked', !self._muted.sound && !self._muted.music );
        
        // remember the mute status in a cookie
        vorple.cookie.write(
            'vorpleMute', 
            ( self._muted.sound ? '1' : '0' )+','+( self._muted.music ? '1' : '0' ) 
        );
    };
    
    
    /**
     * Mutes or unmutes all media types.
     * 
     * @param {Boolean} state True to mute or false to unmute all.
     * @return {Boolean} The new state of global mute (true: all muted,
     * false: all unmuted).
     */
    vorple.media.muteAll = function( state ) {
        var self = this;
        
        if( typeof state == 'undefined' ) {
            state = true;
        }
        
        self.mute( {
            music: state,
            sound: state
        } );
        
        return state;
    };
    

    /**
     * Common audio player element called by sound and music players. 
     */
    vorple.media._play = function( files, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );
        var $container;
       
        if( opt.onReady ) {
            var callback = opt.onReady;
        }
        
        if( typeof opt.container == 'undefined' || !opt.container ) {
            $container = self._createPlayer( options );
        }
        else {
            $container = opt.container;
        }
        
        // clear the container
        $container.jPlayer( 'destroy' );
        
        // Change the filenames to actual urls and
        // extract a list of supplied formats for jPlayer.supplied
        var urls = {};
        var suppliedFormats = [];
        
        $.each( files, function( index, filename ) {
            urls[ index ] = vorple.html.url( filename, opt.audioPath );
            suppliedFormats.push( index );
        } );
        
        $container.jPlayer({
            muted: opt.muted,
            preload: "auto",
            ready: function() {
                $( this ).jPlayer( "setMedia", urls ).jPlayer( 'play' );
                if( $.isFunction( callback ) ) {
                    callback();
                }
            },
            solution: opt.solution,
            supplied: suppliedFormats.join( ', ' ),
            swfPath: opt.swfPath,
            volume: opt.volume
        }); 

        return $container;
    };

    
    /**
     * Creates an img tag.
     * 
     * @example 
     * vorple.media.image( 'foo.jpg', { class: 'bar' } )
     *     == &lt;img src="media/image/foo.jpg" class="bar"&gt;
     *     
     * @param {String} file The filename of the image. 
     * If no path is specified, vorple.media.defaults.imagePath will be used.
     * @param {Object} [options] Additional attributes added to the image.
     * 
     * @return {String} The HTML code for the img tag.
     */
    vorple.media.image = function( file, options ) {
        var self = this;
        var imagePath = self.defaults.imagePath;

        if( typeof options === 'object' && typeof options.imagePath !== 'undefined' ) {
            imagePath = options.imagePath;
        }
        
        var opt = $.extend( {}, { src: vorple.html.url( file, imagePath ) }, options );

        return vorple.html.tag( 
            'img', 
            null,
            opt 
        );
    };
    
    
    /**
     * Check whether a media type is muted and return the current status.
     * 
     * @param {string|string[]} types The audio type (music, sound, or all)
     * as a single string or an array.
     * 
     * @return {boolean|boolean[]} true if media type is muted, false otherwise.
     * An array of truth values is returned if the parameter was given 
     * as an array. 
     */
    vorple.media.isMuted = function( types ) {
        var self = this;
        var input = types;
        var result = [];
        
        if( typeof types == 'string' ) {
            input = [ types ];
        }
        
        var toggle = {};
        $.each( input, function( key, type ) {
        	if( type === 'all' ) {
        		result.push( self._muted.sound && self._muted.music );
        	}
        	else {
            	result.push( self._muted[ type ] );
        	}
        });

        if( typeof types == 'string' ) {
            return result[ 0 ];
        }
        
        return result;     	
    };
    
    /**
     * Play an audio file.
     * 
     * @see vorple.media.playAudio
     * @see <a href="http://jplayer.org/latest/developer-guide/">http://jplayer.org/latest/developer-guide/</a>
     * 
     * @param {Object} files The list of different versions of the sound to be played.
     * See the manual for further explanation.  
     * @param {Object} [options] See vorple.media.playAudio
     * @return {Object} A jPlayer element.
     */
    vorple.media.playMusic = function( files, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );
        opt.audioPath = self.defaults.musicPath;

        if( self._muted.music ) {
            opt.muted = true;
        }
                
        $musicContainer = self._createMainContainer( opt.musicContainer, $( '#'+opt.mainContainer ) );
        opt.container = $musicContainer;
        return self._play( files, opt );
    };
    
    
    /**
     * Play an audio file.
     * 
     * @see <a href="http://jplayer.org/latest/developer-guide/">http://jplayer.org/latest/developer-guide/</a>
     * 
     * @param {Object} files The list of different versions of the sound to be played.
     * See the manual for further explanation.  
     * @param {Object} [options]
     * Any jPlayer constructor options are allowed. The default option set is
     * <code>{ playerSolution 'html, flash', preload: 'auto', 
     * swfPath: 'lib', volume: 0.8 }</code>. The "supplied" argument is automatically
     * decided from the supplied files. The "muted" argument defaults to "false",
     * but if Undum is restoring a saved story or the global mute switch is on,
     * "muted" is forced to "true". 
     * @link {<a href="http://jplayer.org/latest/developer-guide/#jPlayer-constructor">http://jplayer.org/latest/developer-guide/#jPlayer-constructor</a>}
     * @return A jPlayer element.
     */
    vorple.media.playSound = function( files, options ) {
        // If we're loading a saved story, no sound effects shouldn't play
        // to avoid all of them playing at the same time.
        if( vorple.core.engine( 'undum' ) && !undum.isInteractive() ) {
            return;
        }

        var self = this;
        var opt = $.extend( {}, self.defaults, options );
        
        if( self._muted.sound ) {
            opt.muted = true;
        }
                
        $container = self._createMainContainer( opt.soundContainer, $( '#'+opt.mainContainer ) );

        opt.mainContainer = $container;
        
        var $player = self._play( files, opt );
        $player.bind( $.jPlayer.event.ended, function() {
            $( this ).jPlayer( 'destroy' );
        });
        
        return $player;
    };

    
    /**
     * Preload image files.
     * 
     * @param {String|Array} files Filename of the image to load, or an array
     * of files to load.
     * @param {Object} [options] 
     * <table><tr><th>name</th><th>type</th><th>default</th><th>description</th></tr>
     * <tr><td>imagePath</td><td>string</td><td></td><td>'media/image'</td>
     * <td>The default path for the images.</td>
     * </tr></table>
     * @return {Image|Image[]} The Image object of the preloaded images,
     *  or an array of Image objects if multiple image files were given.   
     */
    vorple.media.preloadImage = function( files, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults, options );
        
        if( typeof files == 'string' ) {
            var image = new Image();
            image.src = vorple.html.url( files, opt.imagePath );
            return image;
        }
        else if( $.isArray( files ) ) {
            var images = [];
            $.each( files, function() {
                var image = new Image();
                image.src = vorple.html.url( this, opt.imagePath );
                images.push( image );
            } );
            return images;
        }
        else {
            throw new Error( "Illegal file type given to the image preloader (only String and Array allowed)" );
        }
    };
    

    /**
     * Stop all music and sound effects.
     */
    vorple.media.stopAll = function() {
        this.stopMusic();
        this.stopSounds();
    };

    
    /**
     * Stop the current music.
     */
    vorple.media.stopMusic = function() {
        $( '#'+this.defaults.musicContainer ).jPlayer( 'destroy' );
    };
    
    
    /**
     * Stop all currently playing sound effects.
     */
    vorple.media.stopSounds = function() {
        $( '#'+this.defaults.soundContainer ).children().jPlayer( 'destroy' );
    };
    
    
    /**
     * Toggle mute status of given media types.
     * 
     * @param {String|Array} types The media type to toggle, or an array
     * of media types to toggle.
     * @return If a string was given as the parameter, the new mute status
     * is returned as a boolean (true: muted, false: unmuted). If an array
     * is given, an array is returned with the corresponding mute statuses. 
     */
    vorple.media.toggleMute = function( types ) {
        var self = this;
        var input = types;
        var result = [];
        
        if( typeof types == 'string' ) {
            input = [ types ];
        }
        
        var toggle = {};
        $.each( input, function( key, type ) {
            toggle[ type ] = !self._muted[ type ];
            result.push( !self._muted[ type ] );
        });

        self.mute( toggle );
        
        if( typeof types == 'string' ) {
            return result[ 0 ];
        }
        
        return result; 
    };
    
    
    /**
     * YouTube video embedding.
     * 
     * @see <a href="http://code.google.com/apis/youtube/player_parameters.html">
     * http://code.google.com/apis/youtube/player_parameters.html</a> for
     * available parameters. 
     * 
     * @param {string} id The id of the video to embed (the xxx part of
     * youtube.com/watch?v=xxx)
     * @param {object} [options] 
     * <table>
     * <tr><td>height</td><td>Height of the player</td></tr>
     * <tr><td>width</td><td>Width of the player</td></tr>
     * <tr><td>parameters</td><td>YouTube player parameters (see
     * <a href="http://code.google.com/apis/youtube/player_parameters.html">
     * http://code.google.com/apis/youtube/player_parameters.html</a>)</td></tr>
     * </table>
     * Any HTML attributes are allowed and they're applied to the generated
     * &lt;object&gt; tag.
     * 
     * @return {String} Embedding HTML code
     */
    vorple.media.youtube = function( id, options ) {
        var self = this;
        var opt = $.extend( {}, self.defaults.youtube, options );
        var url = 'http://www.youtube.com/v/'+id+'?version=3';
        var parameters = $.param( opt.parameters );
        
        if( parameters ) {
            url += '&'+parameters;
        }
        
        return '<object width="'+opt.width+'" height="'+opt.height+'">'
            +'<param name="movie" value="'+url+'"></param>'
            +'<param name="allowScriptAccess" value="always"></param>'
            +'<embed src="'+url+'" '
            +'type="application/x-shockwave-flash" allowscriptaccess="always" '
            +'width="'+opt.width+'" height="'+opt.height+'"></embed>'
            +'</object>';
    };

    vorple.media.defaults.youtube = {
        width: 640,
        height: 390,
        parameters: {
                autoplay: '1',          // start playing immediately
                controls: '0',          // hide user controls
                disablekb: '1',         // disable keyboard controls
                modestbranding: '1',    // hide YouTube logos
                rel: '0'                // don't load related videos
        }
    };
    
    

    $( document ).bind( 'vorpleInit', function() {
        /**
         * If the main audio container doesn't exist, create it
         */
        if( $( '#'+vorple.media.defaults.mainContainer ).length == 0 ) {
            $( 'body' ).append( $( '<div id="'+vorple.media.defaults.mainContainer+'"></div>' ) );
        }
        
        
        /**
         * Autocreated mute checkboxes
         */
        
        // read the previous mute status saved to a cookie
        var previousStatus = vorple.cookie.read( 'vorpleMute' );
        
        // if the previous status was found, change the checkboxes accordingly
        if( previousStatus ) {
            previousStatus = previousStatus.split( ',' );

            vorple.media.mute({
                sound: ( previousStatus[ 0 ] == '1' ),
                music: ( previousStatus[ 1 ] == '1' )
            });
        }
        
        $( document ).delegate( 'input.mute', 'change', function() {
            var $this = $( this );
            
            if( $this.val() == 'all' ) {
                vorple.media.muteAll( $this.is( ":checked" ) );
            }
            else {
                var type = {};
                type[ $this.val() ] = $this.is( ":checked" );
                vorple.media.mute( type );
            }
        });

        $( document ).delegate( 'input.unmute', 'change', function() {
            var $this = $( this );
            
            if( $this.val() == 'all' ) {
                vorple.media.muteAll( !$this.is( ":checked" ) );
            }
            else {
                var type = {};
                type[ $this.val() ] = !$this.is( ":checked" );
                vorple.media.mute( type );
            }
        });
    });


})( jQuery );

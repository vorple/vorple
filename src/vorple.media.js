/*  vorple.media.js - Videos and sounds */

/**
 * @namespace media
 * @name media
 * @description Audio and video functions.
 */
vorple.media = (function($) {
    var self = {};

    /**
     * The mute status of music and sound
     *
     * @private
     * @field
     * @name media~_muted
     */
    var _muted = {
        music: false,
        sound: false
    };

    /**
     * The next song in the queue
     *
     * @private
     * @field
     * @name media~_nextSong
     */
    var _nextSong = null;

    /**
     * Counter for sounds currently fading out
     *
     * @private
     * @field
     * @name media~_fadingSounds
     */
    var _fadingSounds = 0;

    
    /**
     * Default options for the media player
     *
     * @public
     * @field
     * @name media#defaults
     */
    self.defaults = {
        // default media locations
        audioPath: 'media/audio',
        imagePath: 'media/image',
        musicPath: 'media/music',
        
        // SoundManager options
        autoPlay: true,
        destructAfter: true, // should the sound instance be destroyed when it stops playing?
        swfPath: 'vendor/soundmanager',
        volume: 80
    };


    /**
     * Fade out a sound.
     * 
     * @param {Object} sound SoundManager object
     * @param {int} speed Fade out speed
     * @param {function} [callback] Callback function to execute when done
     *
     * @private
     * @method
     * @name media~_fadeOut
     */    
    var _fadeOut = function( sound, speed, callback ) {
        if( typeof sound === 'undefined' ) {
            // sound already stopped or invalid sound
            if( typeof callback === 'function' ) {
                callback();
            }
            return;
        }

        var newVolume = sound.volume - speed;
        
        sound.setVolume( Math.max( 0, newVolume ) );
        
        if( newVolume > 0 ) {
            setTimeout( function() {
                _fadeOut( sound, speed, callback );
            }, 50 );
        }
        else {
            sound.stop();
            if( typeof callback === 'function' ) {
                callback();
            }
        }
    };


    /**
     * Play an audio file.
     * 
     * @param {object} options
     * @private
     * @method
     * @name media~_playAudio
     */
    var _playAudio = function( options ) {
        // If we're loading a saved story, no sound effects shouldn't play
        // to avoid all of them playing at the same time.
        if( vorple.core.engine( 'undum' ) && !undum.isInteractive() ) {
            return;
        }
        
        // If SoundManager hasn't initialized yet
        // try again when it has.
        if( !soundManager.ok() ) {
            soundManager.onready( function() {
                _playAudio( file, options );
            });
            
            return;
        }
 
        var callback = $.noop;
        if( typeof options.onfinish === 'function' ) {
            callback = options.onfinish;
        }
        
        options.onfinish = function() {
            callback();
            if( options.loop ) {
                this.play({ onfinish: options.onfinish });
            }
            else if( options.destructAfter ) {
                this.destruct();
            }
        };
        
        soundManager.createSound( options );
        
        if( self.isMuted( 'sound' ) ) {
            soundManager.getSoundById( options.id ).mute();
        }
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
     * @returns {String} The HTML code for the img tag.
     *
     * @public
     * @method
     * @name media#image
     */
    self.image = function( file, options ) {
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
     * @returns {boolean|boolean[]} true if media type is muted, false otherwise.
     * An array of truth values is returned if the parameter was given 
     * as an array.
     *
     * @public
     * @method
     * @name media#isMuted
     */
    self.isMuted = function( types ) {
        var input = types,
            result = [];
        
        if( typeof types === 'string' ) {
            input = [ types ];
        }
        
        $.each( input, function( key, type ) {
             if( type === 'all' ) {
                  result.push( _muted.sound && _muted.music );
             }
             else {
                 result.push( _muted[ type ] );
             }
        });

        if( typeof types === 'string' ) {
            return result[ 0 ];
        }
        
        return result;          
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
     * 
     * @public
     * @method
     * @name media#mute
     */
    self.mute = function( types, options ) {
        var opt = $.extend( {}, self.defaults, options );

        if( typeof types.music !== 'undefined' ) {
            _muted.music = types.music;

            var musicplayer = soundManager.getSoundById( 'vorpleBgMusic' );
            
            if( musicplayer ) {
                if( types.music ) {
                    musicplayer.mute();
                }
                else {
                    musicplayer.unmute();
                }
            }            
            
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
            _muted.sound = types.sound;
                   
            $.each( soundManager.soundIDs, function( index, id ) {
                if( id === 'vorpleBgMusic' ) {
                    return;
                }
                
                var soundplayer = soundManager.getSoundById( id );

                if( types.sound ) {
                    soundplayer.mute();
                }
                else {
                    soundplayer.unmute();
                }
            });

            // toggle muteboxes
            $( 'input.mute[value="sound"]' ).attr( 'checked', types.sound );
            $( 'input.unmute[value="sound"]' ).attr( 'checked', !types.sound );
        }
        
        // check the status of the global mute
        $( 'input.mute[value="all"]' ).attr( 'checked', _muted.sound && _muted.music );
        $( 'input.unmute[value="all"]' ).attr( 'checked', !_muted.sound && !_muted.music );
        
        // remember the mute status in a cookie
        vorple.cookie.write(
            'vorpleMute', 
            ( _muted.sound ? '1' : '0' )+','+( _muted.music ? '1' : '0' ) 
        );
    };
    
    
    /**
     * Mutes or unmutes all media types.
     * 
     * @param {Boolean} [state=true] True to mute or false to unmute all.
     * @returns {Boolean} The new state of global mute (true: all muted,
     * false: all unmuted).
     *
     * @public
     * @method
     * @name media#muteAll
     */
    self.muteAll = function( state ) {
        if( typeof state === 'undefined' ) {
            state = true;
        }
        
        self.mute( {
            music: state,
            sound: state
        } );
        
        return state;
    };
    

    /**
     * Play a music file.
     * 
     * This is otherwise functionally identical to vorple.media.playSound(),
     * with two key differences:
     * 
     * - Any previously playing music (if any) fades out before the new starts
     * 
     * - Music loops automatically unless otherwise instructed.  
     *  
     * @see vorple.media.playSound
     * @param {string} file Music file to be played
     * @param {object} [options] Any SoundManager's createSound() options,
     * plus these:
     * - loop: set to false to not have the music loop again after playing
     * - fadeSpeed: how fast the old music should fade out before starting
     *   the new one. Set to 100 for no fade. See media#stopMusic for details.
     * @returns {string} The audio player's id.
     *
     * @public
     * @method
     * @name media#playMusic
     */
    self.playMusic = function( file, options ) {
        var opt = $.extend(
            {}, 
            self.defaults,
            { 
                id: 'vorpleBgMusic',
                loop: true,
                fadeSpeed: 5
            }, 
            options 
        );

        opt.url = vorple.html.url( file, opt.musicPath );                
        
        var oldMusic = soundManager.getSoundById( 'vorpleBgMusic' );
        
        if( oldMusic ) {
            _fadeOut( oldMusic, opt.fadeSpeed, function() {
                oldMusic.destruct();
                _playAudio( opt );
            });
        }
        else {
            _playAudio( opt );
        }

        return opt.id;
    };
    
    
    /**
     * Play an audio file.
     * 
     * If SoundManager has not finished initializing yet, the sound file 
     * waits for it to happen before it starts. The function returns its
     * id even if it hasn't been passed to SoundManager yet.
     * 
     * If Undum is replaying a saved story, Vorple will not play the sound.
     * Even in that case the (hypothetical) id is returned.
     * 
     * The volume will be set to 0 if sounds have been muted.
     * 
     * @see http://www.schillmania.com/projects/soundmanager2/doc/
     * 
     * @param {string} file The sound file to be played.
     * @param {object} [options]
     * Any SoundManager's createSound() options, plus these:  
     * - loop: set to true to have the sound repeat (indefinitely) after playing.  
     * - destructAfter: set to false to have SoundManager not destroy the player
     *     instance after the sound has finished playing.
     * @returns {string} The audio player's id.
     * 
     * @public
     * @method
     * @name media#playSound
     */
    self.playSound = function( file, options ) {
        var opt = $.extend(
            {}, 
            self.defaults,
            { 
                id: vorple.core.generateId(),
                loop: false
            }, 
            options 
        );
        
        opt.url = vorple.html.url( file, opt.audioPath );                

        _playAudio( opt );

        return opt.id;
    };

    
    /**
     * Preload image files.
     * 
     * @param {string|string[]} files Filename of the image to load, or an array
     * of files to load.
     * @param {Object} [options] 
     * <table><tr><th>name</th><th>type</th><th>default</th><th>description</th></tr>
     * <tr><td>imagePath</td><td>string</td><td></td><td>'media/image'</td>
     * <td>The default path for the images.</td>
     * </tr></table>
     * @returns {Image|Image[]} The Image object of the preloaded images,
     *  or an array of Image objects if multiple image files were given.
     *  
     * @public
     * @method
     * @name media#preloadImage
     */
    self.preloadImage = function( files, options ) {
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
            throw new Error( "Illegal file type given to the image preloader (only string and Array allowed)" );
        }
    };
    

    /**
     * Stop all music and sound effects. This is shorthand for calling both
     * {@see media#stopMusic} and {@see media#stopSounds}.
     * 
     * There is no callback for when all sound has stopped. If one is needed
     * it's easiest to call {@see media#stopMusic} and {@see media#stopSounds} separately
     * with the callback attached to either one of them.
     * 
     * @param {number} [fadeSpeed=5] The speed in which sounds fade out,
     * larger is faster. Use 100 to stop sounds immediately.
     * 
     * @public
     * @method
     * @name media#stopAll
     */
    self.stopAll = function( fadeSpeed ) {
        if( typeof fadeSpeed !== 'number' || fadeSpeed <= 0 ) {
            fadeSpeed = 5;
        }
        
        self.stopMusic( fadeSpeed );
        self.stopSounds( fadeSpeed );
    };

    
    /**
     * Stop the currently playing music.
     * 
     * @param {integer} [fadeSpeed=5] The speed in which the music fades out,
     * larger is faster. Use 100 to stop the sound immediately.
     * The number tells how much the volume is decreased every 50 milliseconds.
     * For example using the default volume 80 and the default fade out speed
     * 5, it takes 80 / 5 * 50 = 800 milliseconds = 0.8 seconds for the sound
     * to fade out.
     * @param {function} [callback] A callback function to execute when
     * the music has actually stopped (i.e. has faded out completely). 
     * 
     * @public
     * @method
     * @name media#stopMusic
     */
    self.stopMusic = function( fadeSpeed, callback ) {
        if( typeof fadeSpeed !== 'number' || fadeSpeed <= 0 ) {
            fadeSpeed = 5;
        }
        
        _fadeOut( soundManager.getSoundById( 'vorpleBgMusic' ), fadeSpeed, callback );
   };
    
    
    /**
     * Stop a single audio file.
     * 
     * @param {string} id The id of the audio to stop
     * @param {integer} [fadeSpeed=100] Fade out speed. See stopMusic().
     * @param {function} [callback] A callback function to execute when
     * the sound has actually stopped (i.e. has faded out completely). 
     * 
     * @public
     * @method
     * @name media#stopSound
     */
    self.stopSound = function( id, fadeSpeed, callback ) {
        if( typeof fadeSpeed !== 'number' || fadeSpeed <= 0 ) {
            fadeSpeed = 100;
        }
        
        _fadeOut( soundManager.getSoundById( id ), fadeSpeed, callback );
    };
    
    
    /**
     * Stop all currently playing sound effects.
     * 
     * @param {integer} [fadeSpeed=100] Fade out speed. See stopMusic().
     * @param {function} [callback] A callback function to execute when
     * all sounds have actually stopped (i.e. faded out completely).
     * Callback is called immediately if there are no sounds active.
     * 
     * @public
     * @method
     * @name media#stopSounds
     */
    self.stopSounds = function( fadeSpeed, callback ) {
        if( typeof fadeSpeed !== 'number' || fadeSpeed <= 0 ) {
            fadeSpeed = 100;
        }

        var fadingSounds = soundManager.soundIDs.length;
        if( $.inArray( 'vorpleBgMusic', soundManager.soundIDs ) > -1 ) {
            fadingSounds--;
        }

        _fadingSounds = fadingSounds;
        
        $.each( soundManager.soundIDs, function( index, id ) {
            if( id === 'vorpleBgMusic' ) {
                return;
            }

            if( typeof callback !== 'function' ) {
                callback = $.noop;
            }
            
            _fadeOut(
                soundManager.getSoundById( id ), 
                fadeSpeed,
                function() {
                    _fadingSounds--;
                    
                    if( _fadingSounds === 0 ) {
                        callback();
                    }
                }  
            );            
        });
        
        if( fadingSounds === 0 && typeof callback === 'function' ) {
            callback();
        }
    };
    
    
    /**
     * Toggle mute status of given media types.
     * 
     * @param {string|Array} types The media type to toggle, or an array
     * of media types to toggle.
     * @returns {boolean|boolean[]} If a string was given as the parameter, the new mute status
     * is returned as a boolean (true: muted, false: unmuted). If an array
     * is given, an array is returned with the corresponding mute statuses.
     * 
     * @public
     * @method
     * @name media#toggleMute
     */
    self.toggleMute = function( types ) {
        var input = types;
        var result = [];
        
        if( typeof types == 'string' ) {
            input = [ types ];
        }
        
        var toggle = {};
        $.each( input, function( key, type ) {
            toggle[ type ] = !_muted[ type ];
            result.push( !_muted[ type ] );
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
     * @see http://code.google.com/apis/youtube/player_parameters.html
     * 
     * @param {string} id The id of the video to embed (the xxx part of
     * youtube.com/watch?v=xxx)
     * @param {object} [options] 
     * <table>
     * <tr><td>height</td><td>Height of the player</td></tr>
     * <tr><td>width</td><td>Width of the player</td></tr>
     * <tr><td>parameters</td><td>YouTube player parameters (see
     * http://code.google.com/apis/youtube/player_parameters.html)</td></tr>
     * </table>
     * Any HTML attributes are allowed and they're applied to the generated
     * &lt;object&gt; tag.
     * 
     * @returns {string} Embedding HTML code
     *
     * @public
     * @method
     * @name media#youtube
     */
    self.youtube = function( id, options ) {
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

    self.defaults.youtube = {
        width: 600,
        height: 365,
        parameters: {
                autoplay: '1',          // start playing immediately
                controls: '0',          // hide user controls
                disablekb: '1',         // disable keyboard controls
                modestbranding: '1',    // hide YouTube logos
                rel: '0'                // don't load related videos
        }
    };


    /**
     * Initializing
     */
    $( document ).on( 'init.vorple', function() {
        // init SoundManager
        if( typeof soundManager !== 'undefined' ) {
            soundManager.setup({ 
                url: self.defaults.swfPath,
                debugMode: false
            });        
        }
        
        /**
         * Autocreated mute checkboxes
         */
        
        // read the previous mute status saved to a cookie
        var previousStatus = vorple.cookie.read( 'vorpleMute' );
        
        // if the previous status was found, change the checkboxes accordingly
        if( previousStatus ) {
            previousStatus = previousStatus.split( ',' );

            self.mute({
                sound: ( previousStatus[ 0 ] === '1' ),
                music: ( previousStatus.length > 1 && previousStatus[ 1 ] === '1' )
            });
        }
        
        $( document ).on( 'change', 'input.mute', function() {
            var $this = $( this );
            
            if( $this.val() == 'all' ) {
                self.muteAll( $this.is( ":checked" ) );
            }
            else {
                var type = {};
                type[ $this.val() ] = $this.is( ":checked" );
                self.mute( type );
            }
        });

        $( document ).on( 'change', 'input.unmute', function() {
            var $this = $( this );
            
            if( $this.val() === 'all' ) {
                self.muteAll( !$this.is( ":checked" ) );
            }
            else {
                var type = {};
                type[ $this.val() ] = !$this.is( ":checked" );
                self.mute( type );
            }
        });
    });

    return self;
})( jQuery );

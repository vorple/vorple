(function() {
    "use strict";

    var audio = {},
        fadeOutTimer,
        musicQueue = [],
        musicPauseTimer,
        playlist = [];


    /**
     * Fade out sound over the duration of 1 second.
     *
     * @param element
     * @param callback
     */
    function fadeOut( element, callback ) {
        var $sound = $( element ),
            sound = $sound.get(0);

        clearTimeout( fadeOutTimer );

        $sound.data( 'stopping', true );

        function next( volume ) {
            sound.volume = Math.max( volume, 0 );

            if( volume > 0 ) {
                fadeOutTimer = setTimeout( function() {
                    next( volume - 0.05 );
                }, 50 );
            }
            else {
                $sound.remove();
                callback();
            }
        }

        next( sound.volume - 0.05 );
    }


    /**
     * Set a timer that starts the next track in the music queue after 1 second.
     */
    function timeNextTrack() {
        clearTimeout( musicPauseTimer );

        if( musicQueue.length === 0 && playlist.length > 0 ) {
            musicQueue = playlist.slice();
        }

        // no tracks in any queue, do nothing
        if( musicQueue.length === 0 ) {
            return;
        }

        musicPauseTimer = setTimeout( function() {
            var next = musicQueue.shift();

            if( next ) {
                audio.playMusic( next );
            }
        }, 1000 );
    }


    /**
     * Clear the playlist and the music queue.
     */
    audio.clearPlaylist = function() {
        playlist = [];
        musicQueue = [];
    };


    /**
     * Gets the name of the currently playing music file, or null if nothing
     * is playing. If music has been asked to stop, returns the
     * music that will play next.
     *
     * @returns {string|null}
     */
    audio.currentMusicPlaying = function() {
        var $music = $( '.vorple-music' );

        if( $music.length === 0 ) {
            return null;
        }

        if( $music.data( 'stopping' ) ) {
            if( musicQueue.length > 0 ) {
                return musicQueue[ 0 ];
            }

            if( playlist.length > 0 ) {
                return playlist[ 0 ];
            }

            return null;
        }

        return $music.attr( 'src' );
    };

    /**
     * Check if any audio is playing.
     */
    audio.isAudioPlaying = function() {
        return audio.isEffectPlaying() || audio.isMusicPlaying();
    };


    /**
     * Check if any sound effect is playing.
     *
     * @returns {boolean}
     */
    audio.isEffectPlaying = function() {
        var isEffectPlaying = false;

        $( '.vorple-sound' ).each( function() {
            if( audio.isElementPlaying( this ) ) {
                isEffectPlaying = true;
                return false;
            }
        });

        return isEffectPlaying;
    };


    /**
     * Check if an audio element is playing.
     *
     * @param audioElement DOM element, jQuery object or jQuery selector of the audio element
     * @returns {boolean}
     */
    audio.isElementPlaying = function( audioElement ) {
        var elem = $( audioElement ).get( 0 );

        return !!( elem && elem.currentTime > 0 && !elem.paused );
    };


    /**
     * Check if music is playing. Returns true if music is actually playing
     * and it isn't fading out at the moment.
     */
    audio.isMusicPlaying = function() {
        var $music = $( '.vorple-music' );

        // if the audio element doesn't exist, music is never playing
        if( $music.length === 0 ) {
            return false;
        }

        // if there are tracks in the music queue, music is playing
        if( musicQueue.length > 0 ) {
            return true;
        }

        // if the queue is empty but there's a playlist, music is playing
        if( playlist.length > 0 ) {
            return true;
        }

        // if the music is stopping, it's not considered playing
        if( $music.data( 'stopping' ) ) {
            return false;
        }

        // finally check the audio's actual play state
        return audio.isElementPlaying( $music );
    };


    /**
     * Start playing music. If the same music file is already playing, do nothing
     * except set the looping property. If another music file is playing,
     * fade out the old one before playing the new one.
     *
     * @param url
     * @param loop
     */
    audio.playMusic = function( url, loop ) {
        var $music = $( '.vorple-music' );

        clearTimeout( musicPauseTimer );

        // check if this specific track is already playing
        if( ( $music.length > 0 && $music.attr( 'src' ) === url ) ||
            ( $music.length === 0 && musicQueue[0] === url ) ) {
            // if the music is fading out, stop the fadeout and continue
            clearTimeout( fadeOutTimer );

            $music.prop( 'volume', 1 ).data( 'stopping', false )
                .prop( 'loop', !!loop ).get( 0 ).play();
        }
        else if( audio.isElementPlaying( '.vorple-music' ) ) {
            musicQueue.unshift( url );
            fadeOut( $music, timeNextTrack )
        }
        else {
            $music.remove();
            $( '<audio class="vorple-audio vorple-music">' )
                .attr( 'src', url )
                .prop( 'loop', !!loop )
                .appendTo( 'body' )
                .on( 'ended', timeNextTrack )
                .get(0).play();
        }
    };


    /**
     * Set the playlist and start playing it.
     *
     * @param list
     */
    audio.setPlaylist = function( list, looping ) {
        if( list.length === 0 ) {
            musicQueue = [];
            playlist = [];
            return;
        }

        musicQueue = list.slice( 1 );

        if( looping ) {
            playlist = list.slice();
        }

        // start the first track unless it's already playing
        if( !audio.isElementPlaying( '.vorple-music' ) || $( '.vorple-music' ).attr( 'src' ) !== list[ 0 ] ) {
            audio.playMusic( list[ 0 ] );
        }
    };


    /**
     * Stop playing music.
     */
    audio.stopMusic = function() {
        var $music = $( '.vorple-music' );

        musicQueue = [];
        playlist = [];

        if( $music.length > 0 ) {
            fadeOut( $music, timeNextTrack )
        }
    };

    vorple.audio = audio;
})();
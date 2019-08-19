/**
 * @module audio
 */

/**
 * @private
 */
let musicQueue = [];

/**
 * @private
 */
let musicPauseTimer;

/**
 * @private
 */
let playlist = [];


/**
 * Default values for durations.
 *
 * @type {{fadeDuration: number, pauseBetweenTracks: number}}
 */
export const defaults = {
    fadeDuration: 1000,         // the duration of fade in or out, in milliseconds
    pauseBetweenTracks: 1000    // how long to pause between music tracks, in milliseconds
};


/**
 * @private
 *
 * Sets a timer that starts the next track in the music queue
 * after the time specified by defaults.pauseBetweenTracks.
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

    // make sure the "stopping" flag is set (even though the audio has already stopped)
    $( '.vorple-music' ).data( "stopping", true );

    musicPauseTimer = setTimeout( function() {
        const next = musicQueue.shift();

        if( next ) {
            playMusic( next.url, next.looping );
        }
    }, defaults.pauseBetweenTracks );
}


/**
 * Clears the playlist and the music queue. Does not stop music that's
 * currently playing.
 */
export function clearPlaylist() {
    playlist = [];
    musicQueue = [];
}


/**
 * Gets the name of the currently playing music file, or null if nothing
 * is playing. If music has been asked to stop, returns the
 * music that will play next.
 *
 * @returns {string|null}
 */
export function currentMusicPlaying() {
    const $music = $( '.vorple-music' );

    if( $music.length === 0 ) {
        return null;
    }

    if( $music.data( 'stopping' ) || !isMusicPlaying() ) {
        if( musicQueue.length > 0 ) {
            return musicQueue[ 0 ].url;
        }

        if( playlist.length > 0 ) {
            return playlist[ 0 ].url;
        }

        return null;
    }

    return $music.attr( 'src' );
}


/**
 * Fades out sound.
 *
 * @param {string|object} element  The audio element that should fade out
 * @param {number} [duration=1000]  The duration of the fade in milliseconds,
 *      default 1000 ms (1 second) or the value set in
 *      vorple.defaults.fadeDuration. Note that the duration is calculated from
 *      100% volume, even if the current volume of the sound is less than that.
 * @param {function} [callback]  Function that is called when the audio has
 *      stopped completely with a boolean as the first parameter that matches
 *      what this function returned
 *
 * @returns {boolean}  False if the element doesn't exist or is not an audio
 *      element, true otherwise
 */
export function fadeOut( element, duration, callback ) {
    const tick = 50;    // how often the volume is changed
    const $sound = $( element );
    const sound = $sound.get( 0 );

    const runCallbackIfExists = remove => {
        if( remove ) {
            $sound.remove();
        }

        if( typeof callback === "function" ) {
            callback();
        }
    };

    if( typeof duration !== "number" ) {
        duration = defaults.fadeDuration;
    }

    if( !sound || sound.tagName !== "AUDIO" ) {
        runCallbackIfExists( false );
        return false;
    }

    if( duration <= 0 ) {
        runCallbackIfExists( true );
        return true;
    }

    duration = Math.min( duration, 60000 ); // cap the duration to 1 minute

    const delta = tick / duration;  // how much to change the volume on each tick

    clearTimeout( $sound.data( "fadeouttimer" ) );

    $sound.data( "stopping", true );

    function next( volume ) {
        sound.volume = Math.max( volume, 0 );

        if( volume > 0 ) {
            const newTimer = setTimeout( function() {
                next( volume - delta );
            }, tick );

            $sound.data( "fadeouttimer", newTimer );
        }
        else {
            $sound.remove();
            runCallbackIfExists( true );
        }
    }

    next( sound.volume - delta );

    return true;
}


/**
 * Checks if any audio is playing. Note that sound that is being loaded or
 * has received a play command but isn't playing for some other reason
 * isn't considered as playing, even though it's about to start.
 *
 * @returns {boolean}
 */
export function isAudioPlaying() {
    return isEffectPlaying() || isMusicPlaying();
}


/**
 * Checks if any sound effect is playing.
 *
 * @returns {boolean}
 */
export function isEffectPlaying () {
    let isEffectPlaying = false;

    $( '.vorple-sound' ).each( function() {
        if( isElementPlaying( this ) ) {
            isEffectPlaying = true;
            return false;
        }
    } );

    return isEffectPlaying;
}


/**
 * Checks if an audio element is playing.
 *
 * @param {string|object} audioElement  DOM element, jQuery object or jQuery
 *      selector of the audio element
 * @returns {boolean}
 */
export function isElementPlaying( audioElement ) {
    const elem = $( audioElement ).get( 0 );

    return !!( elem && elem.tagName === "AUDIO" && !elem.paused );
}


/**
 * Checks if music is playing. Returns true if music is actually playing
 * and it isn't fading out at the moment.
 *
 * @returns {boolean}
 */
export function isMusicPlaying() {
    const $music = $( '.vorple-music' );

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
    return isElementPlaying( $music );
}


/**
 * Starts playing music. If the same music file is already playing, does nothing
 * except sets the looping property. If another music file is playing,
 * fades out the old one before playing the new one.
 *
 * @param {string} url
 * @param {object} [options={}]
 * @param {boolean} [options.looping=false]  If true, the track keeps repeating
 * @param {boolean} [options.restart=false]  If true, always starts playing from
 *   the start, even when this track is already playing
 */
export function playMusic( url, options = {} ) {
    const $music = $( '.vorple-music' );
    const { looping, restart } = options;

    clearTimeout( musicPauseTimer );

    // check if this specific track is already playing
    if( !restart && (
            ( $music.length > 0 && $music.attr( 'src' ) === url ) ||
            ( $music.length === 0 && musicQueue.length > 0 && musicQueue[ 0 ].url === url )
        ) ) {
        // if the music is fading out, stop the fadeout and continue
        clearTimeout( $music.data( "fadeOutTimer" ) );

        $music.prop( 'volume', 1 ).data( 'stopping', false )
            .prop( 'loop', !!looping ).get( 0 ).play();
    }
    else if( restart && isElementPlaying( '.vorple-music' ) ) {
        musicQueue.unshift( { url, looping: !!looping} );
        fadeOut( $music, null, timeNextTrack )
    }
    else {
        $music.remove();
        $( '<audio class="vorple-audio vorple-music">' )
            .attr( 'src', url )
            .prop( 'loop', !!looping )
            .appendTo( 'body' )
            .on( 'ended', timeNextTrack )
            .get( 0 ).play();
    }
}


/**
 * Starts playing a sound effect.
 *
 * @param {string} url
 * @param {object} [options={}]
 * @param {string} [options.id=""]  The id to attach to the audio element
 * @param {boolean} [options.looping=false]  If true, the sound effect keeps repeating
 * @returns {object} The audio DOM element
 */
export function playSound( url, options = {} ) {
    const looping = !!options.looping;

    const $audio = $( '<audio class="vorple-audio vorple-music">' )
        .attr( 'src', url )
        .prop( 'loop', looping )
        .appendTo( 'body' );

    if( options.id ) {
        $audio.attr( 'id', options.id );
    }

    const audioElement = $audio.get( 0 );
    audioElement.play();

    // if the sound is not looping, remove the element from the DOM when it finishes playing
    if( !looping ) {
        $audio.on( 'ended', function() {
            this.remove();
        });
    }

    return audioElement;
}


/* from https://stackoverflow.com/a/6274381 */
function shuffleArray( a ) {
    for( let i = a.length - 1; i > 0; i-- ) {
        const j = Math.floor( Math.random() * (i + 1) );
        [ a[ i ], a[ j ] ] = [ a[ j ], a[ i ] ];
    }
    return a;
}


/**
 * Sets a playlist and starts playing it.
 *
 * @param {string[]} list  An array of music file URLs
 * @param {object} [options={}]
 * @param {boolean} [options.looping=false]  If true, the playlist starts playing again
 *      from the start when it ends
 * @param {boolean} [options.restart=false]  If true, always play from the start even
 *      when a track in the playlist is already playing
 * @param {boolean} [options.shuffle=false]  If true, shuffles the playlist in random
 *      order before playing it
 */
export function setPlaylist( list, options = {} ) {
    if( list.length === 0 ) {
        musicQueue = [];
        playlist = [];
        return;
    }

    const { looping, restart, shuffled } = options;
    const currentTrackUrl = currentMusicPlaying();

    // if the playlist is a list of URLs, turn them into objects that have
    // the "looping" property
    const pl = list.map( item => {
        if( typeof item === 'string' ) {
            return {
                url: item,
                looping: false
            };
        }

        return item;
    });

    if( shuffled ) {
        shuffleArray( pl );
    }

    const currentlyPlayingIndex = restart ? -1 : pl.findIndex( track => track.url === currentTrackUrl );
    const startFromIndex = ( currentlyPlayingIndex < 1 ) ? 0 : currentlyPlayingIndex;

    musicQueue = pl.slice( startFromIndex + 1 );

    if( looping ) {
        playlist = pl.slice();
    }

    // start the first track unless it's already playing
    if( currentTrackUrl !== pl[ startFromIndex ].url ) {
        playMusic( pl[ startFromIndex ].url );
    }
}


/**
 * Stops playing music. Clears the music queue and the playlist.
 *
 * @param {number} [fadeoutDuration=1000] The duration of the fadeout. Set to 0
 *      to stop immediately.
 */
export function stopMusic( fadeoutDuration ) {
    const $music = $( '.vorple-music' );

    musicQueue = [];
    playlist = [];

    if( $music.length > 0 ) {
        // note: although we just cleared the playlist and queue,
        // it's possible that a new track is added while the music is fading out.
        // That's why we have to add the timeNextTrack callback so that the
        // next track will start playing in that case.
        fadeOut( $music, fadeoutDuration, timeNextTrack )
    }
}

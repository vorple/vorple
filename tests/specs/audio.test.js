const expectElement = expect;
const assert = require( "chai" ).expect;
const { vorple } = require( "../utility" );

const getVolume = id => {
    return browser.execute( function( id ) {
        let $audio = $( "audio#" + id ).get( 0 );

        return $audio ? $audio.volume : 0;
    }, id );
};

// the test sound files are silent on purpose
const audiofile = "/media/silence.mp3";  // duration 30 s
const shortaudio = "/media/short1.mp3";  // duration 180 ms
const shortaudio2 = "/media/short2.mp3"; // identical to shortaudio

const startSound = ( id = "", file = audiofile ) => {
    browser.execute( function( id, file ) {
        vorple.audio.playSound(file, { id });
    }, id, file );
};

const stopSound = ( id ) => {
    browser.execute( function( id ) {
        $( "audio#" + id ).remove();
    }, id );
};

describe( "Audio methods", () => {
    // Chrome doesn't play sounds before user has interacted with the page
    before( () => {
        $( "body" ).click();
    });

    describe( "checking audio playing status", () => {
        it( "when no sound is playing", () => {
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when an external sound is playing", () => {
            browser.execute( function( audiofile ) {
                $( "<audio src='" + audiofile + "' id='externalSound' autoplay>" ).appendTo( 'body' )
            }, audiofile );
            browser.pause( 200 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            stopSound( "externalSound" );
        });

        it( "when only sound effect is playing", () => {
            startSound( "onlysound" );
            browser.pause( 100 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            stopSound( "onlysound" );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when sound effect has stopped by itself", () => {
            startSound( "blip-autostop", shortaudio );
            browser.pause( 10 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            browser.pause( 500 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when only music is playing", () => {
            vorple( "audio", "playMusic", audiofile );
            browser.pause( 100 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.true;
            vorple( "audio", "stopMusic", 0 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when both music and sound effects are playing", () => {
            vorple( "audio", "playMusic", audiofile );
            startSound( "together" );
            browser.pause( 100 );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.true;
            vorple( "audio", "stopMusic", 0 );
            stopSound( "together" );
            assert( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            assert( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "is false when element doesn't exist", () => {
            assert( vorple( "audio", "isElementPlaying", "doesntexist" ) ).to.be.false;
        });
    });

    describe( "currentMusicPlaying", () => {
        it( "returns null when no music is playing", () => {
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
        });

        it( "retrieves the currently playing music", () => {
            vorple( "audio", "playMusic", audiofile );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.equal( audiofile );
            vorple( "audio", "stopMusic", 0 );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
        });

        it( "returns null when only a sound effect is playing", () => {
            startSound( "no-music-playing" );
            browser.pause( 100 );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
            stopSound( "no-music-playing" );
        });
    });

    describe( "playlists", () => {
        it( "gets set and plays correctly", () => {
            /*
            Timeline:
            0   - start playing track 1
            0   - check that track 1 plays
            180 - track 1 ends
            300 - check that track 2 plays (=is about to play)
            380 - track 2 starts
            450 - check that track 2 plays
            580 - track 2 ends
            800 - check that nothing is playing
            */
            browser.execute( function() { vorple.audio.defaults.pauseBetweenTracks = 200; });
            vorple( "audio", "setPlaylist", [ shortaudio, shortaudio2 ] );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio );
            browser.pause( 300 );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio2 );    // we're at the pause between tracks
            browser.pause( 150 );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio2 );    // track 2 has started playing
            browser.pause( 350 );
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;                 // playlist has ended
        });

        it( "are cleared correctly", () => {
            browser.execute( function() { vorple.audio.defaults.pauseBetweenTracks = 200; });
            vorple( "audio", "setPlaylist", [ shortaudio, audiofile ] );
            vorple( "audio", "clearPlaylist" );
            // doesn't stop the currently playing music
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio );
            browser.pause( 300 );
            // the first audio file should have stopped and the second has not started
            assert( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;

        });
    });

    describe( "fadeOut", () => {
        it( "fades out in 1 second", () => {
            startSound( "onesec" );
            vorple( "audio", "fadeOut", "#onesec" );
            browser.pause( 500 );
            assert( getVolume( "onesec" ) ).to.be.above( 0 );
            browser.pause( 600 );
            assert( getVolume( "onesec" ) ).to.equal( 0 );
        });

        it( "fades out in custom duration", () => {
            startSound( "longsound" );
            vorple( "audio", "fadeOut", "#longsound", 2000 );
            browser.pause( 1800 );
            assert( getVolume( "longsound" ) ).to.be.above( 0 );
            browser.pause( 400 );
            assert( getVolume( "longsound" ) ).to.equal( 0 );
        });

        it( "duration zero stops the sound immediately", () => {
            startSound( "stopnow" );
            assert( getVolume( "stopnow" ) ).to.be.above( 0 );
            vorple( "audio", "fadeOut", "#stopnow", 0 );
            assert( getVolume( "stopnow" ) ).to.equal( 0 );
            browser.pause( 100 );
            assert( getVolume( "stopnow" ) ).to.equal( 0 );
        });

        it( "multiple sounds simultaneously fading out don't affect each other", () => {
            startSound( "one" );
            startSound( "two" );
            vorple( "audio", "fadeOut", "#one", 2000 );
            browser.pause( 500 );
            vorple( "audio", "fadeOut", "#two", 1000 );
            assert( getVolume( "one" ) ).to.be.above( 0 );
            assert( getVolume( "two" ) ).to.be.above( 0 );
            browser.pause( 1000 );
            assert( getVolume( "one" ) ).to.be.above( 0 );
            assert( getVolume( "two" ) ).to.equal( 0 );
            browser.pause( 600 );
            assert( getVolume( "one" ) ).to.equal( 0 );
            assert( getVolume( "two" ) ).to.equal( 0 );
        });

        it( "fading out a sound in the middle of fadeout changes the fadeout speed", () => {
            startSound( "change" );
            vorple( "audio", "fadeOut", "#change", 1000 );
            browser.pause( 500 );
            vorple( "audio", "fadeOut", "#change", 2000 );
            // at this point the volume should be about 0.5 and the total duration is 1000/2 + 2000/2 = 1500 ms
            assert( getVolume( "change" ) ).to.be.above( 0 );
            browser.pause( 800 );
            assert( getVolume( "change" ) ).to.be.above( 0 );
            browser.pause( 400 );
            assert( getVolume( "change" ) ).to.equal( 0 );
        });

        it( "fading out a non-audio element should do nothing", () => {
            assert( () => vorple( "audio", "fadeOut", "body" ) ).to.not.throw();
            expectElement( $( "body" ) ).toExist();
        });
    });
});
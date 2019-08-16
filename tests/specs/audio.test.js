const chai = require( "chai" );
const chaiWebdriver = require( "chai-webdriverio" ).default;
chai.use( chaiWebdriver( browser ) );

const expect = chai.expect;
const { vorple, waitForLineInput } = require( "../utility" );

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
        $( "<audio src='" + file + "' id='" + id + "' class='vorple-audio vorple-sound' autoplay>" ).appendTo( 'body' )
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
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when an external sound is playing", () => {
            browser.execute( function( audiofile ) {
                $( "<audio src='" + audiofile + "' id='externalSound' autoplay>" ).appendTo( 'body' )
            }, audiofile );
            browser.pause( 200 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            stopSound( "externalSound" );
        });

        it( "when only sound effect is playing", () => {
            startSound( "onlysound" );
            browser.pause( 100 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            stopSound( "onlysound" );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when sound effect has stopped by itself", () => {
            startSound( "blip-autostop", shortaudio );
            browser.pause( 100 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
            browser.pause( 200 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when only music is playing", () => {
            vorple( "audio", "playMusic", audiofile );
            browser.pause( 100 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.true;
            vorple( "audio", "stopMusic", 0 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "when both music and sound effects are playing", () => {
            vorple( "audio", "playMusic", audiofile );
            startSound( "together" );
            browser.pause( 100 );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.true;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.true;
            vorple( "audio", "stopMusic", 0 );
            stopSound( "together" );
            expect( vorple( "audio", "isAudioPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isEffectPlaying" ) ).to.be.false;
            expect( vorple( "audio", "isMusicPlaying" ) ).to.be.false;
        });

        it( "is false when element doesn't exist", () => {
            expect( vorple( "audio", "isElementPlaying", "doesntexist" ) ).to.be.false;
        });
    });

    describe( "currentMusicPlaying", () => {
        it( "returns null when no music is playing", () => {
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
        });

        it( "retrieves the currently playing music", () => {
            vorple( "audio", "playMusic", audiofile );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.equal( audiofile );
            vorple( "audio", "stopMusic", 0 );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
        });

        it( "returns null when only a sound effect is playing", () => {
            startSound( "no-music-playing" );
            browser.pause( 100 );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;
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
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio );
            browser.pause( 300 );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio2 );    // we're at the pause between tracks
            browser.pause( 150 );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio2 );    // track 2 has started playing
            browser.pause( 350 );
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;                 // playlist has ended
        });

        it( "are cleared correctly", () => {
            browser.execute( function() { vorple.audio.defaults.pauseBetweenTracks = 200; });
            vorple( "audio", "setPlaylist", [ shortaudio, audiofile ] );
            vorple( "audio", "clearPlaylist" );
            // doesn't stop the currently playing music
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.equal( shortaudio );
            browser.pause( 300 );
            // the first audio file should have stopped and the second has not started
            expect( vorple( "audio", "currentMusicPlaying" ) ).to.be.null;

        });
    });

    describe( "fadeOut", () => {
        it( "fades out in 1 second", () => {
            startSound( "onesec" );
            vorple( "audio", "fadeOut", "#onesec" );
            browser.pause( 500 );
            expect( getVolume( "onesec" ) ).to.be.above( 0 );
            browser.pause( 600 );
            expect( getVolume( "onesec" ) ).to.equal( 0 );
        });

        it( "fades out in custom duration", () => {
            startSound( "longsound" );
            vorple( "audio", "fadeOut", "#longsound", 2000 );
            browser.pause( 1800 );
            expect( getVolume( "longsound" ) ).to.be.above( 0 );
            browser.pause( 400 );
            expect( getVolume( "longsound" ) ).to.equal( 0 );
        });

        it( "duration zero stops the sound immediately", () => {
            startSound( "stopnow" );
            expect( getVolume( "stopnow" ) ).to.be.above( 0 );
            vorple( "audio", "fadeOut", "#stopnow", 0 );
            expect( getVolume( "stopnow" ) ).to.equal( 0 );
            browser.pause( 100 );
            expect( getVolume( "stopnow" ) ).to.equal( 0 );
        });

        it( "multiple sounds simultaneously fading out don't affect each other", () => {
            startSound( "one" );
            startSound( "two" );
            vorple( "audio", "fadeOut", "#one", 2000 );
            browser.pause( 500 );
            vorple( "audio", "fadeOut", "#two", 1000 );
            expect( getVolume( "one" ) ).to.be.above( 0 );
            expect( getVolume( "two" ) ).to.be.above( 0 );
            browser.pause( 1000 );
            expect( getVolume( "one" ) ).to.be.above( 0 );
            expect( getVolume( "two" ) ).to.equal( 0 );
            browser.pause( 600 );
            expect( getVolume( "one" ) ).to.equal( 0 );
            expect( getVolume( "two" ) ).to.equal( 0 );
        });

        it( "fading out a sound in the middle of fadeout changes the fadeout speed", () => {
            startSound( "change" );
            vorple( "audio", "fadeOut", "#change", 1000 );
            browser.pause( 500 );
            vorple( "audio", "fadeOut", "#change", 2000 );
            // at this point the volume should be about 0.5 and the total duration is 1000/2 + 2000/2 = 1500 ms
            expect( getVolume( "change" ) ).to.be.above( 0 );
            browser.pause( 800 );
            expect( getVolume( "change" ) ).to.be.above( 0 );
            browser.pause( 400 );
            expect( getVolume( "change" ) ).to.equal( 0 );
        });

        it( "fading out a non-audio element should do nothing", () => {
            expect( () => vorple( "audio", "fadeOut", "body" ) ).to.not.throw();
            expect( "body" ).to.be.there();
        });
    });
});
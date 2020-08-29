"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.em_init = em_init;
exports.prompt = prompt;
exports.readUIState = readUIState;
exports.syncfs = syncfs;

require("custom-event-polyfill");

var _assets = require("./assets");

var _error = _interopRequireDefault(require("./error"));

var _input = require("./input");

var _options = require("./options");

var _prompt = require("./prompt");

var _state = require("./state");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var interpreterLoaded = false;
var isGamefileLoaded = false;
var gamefile;
var checksum;
var datadir;
var storyFilename;
/**
 * FNV32-algorithm to calculate the story file's checksum.
 * The checksum is used to name the directories for save games.
 *
 * Taken from https://codepen.io/ImagineProgramming/post/checksum-algorithms-in-javascript-checksum-js-engine
 */

function fnv32(a) {
  var len = a.length;
  var fnv = 0;

  for (var i = 0; i < len; i++) {
    fnv = fnv + ((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24) >>> 0) ^ a[i] & 0xff;
  }

  return fnv >>> 0;
}
/**
 * Writes the loaded game file into the virtual file system, but only
 * if both the interpreter and the game file are both loaded.
 *
 * @returns {boolean} true when all required assets have finished loading
 */


function writeGamefile(done) {
  // re-show loader if hidden
  document.getElementById('loader').style.display = "block";

  if (!interpreterLoaded || !isGamefileLoaded) {
    if (!interpreterLoaded) {
      document.getElementById('loader-message').innerHTML = 'Loading interpreter';
    } else {
      document.getElementById('loader-message').innerHTML = 'Loading game file';
    }
  }

  document.getElementById('loader-message').innerHTML = 'Starting game';
  FS.writeFile(storyFilename, gamefile, {
    encoding: 'binary'
  }); // create the virtual savefile directory if it doesn't exist

  datadir = '/gamedata_' + checksum;

  if (!FS.analyzePath(datadir).exists) {
    FS.mkdir(datadir);
  }

  FS.mount(IDBFS, {
    root: '.'
  }, datadir); // create a directory for shared game data

  if (!FS.analyzePath('gamedata').exists) {
    FS.mkdir('gamedata');
  }

  FS.mount(IDBFS, {
    root: '.'
  }, 'gamedata');
  FS.chdir('gamedata'); // synchronize with local data

  FS.syncfs(true, function () {
    if ((0, _options.get)('autosave')) {
      _state.autosave.setName('/gamedata_' + checksum + '/autosave');

      _state.autosave.restore();
    } // start reacting to keypresses


    _input.keypress.init();

    done();
  });
}
/**
 * Start loading the story file.
 */


function em_init(virtualFilename) {
  var gameUrl = (0, _options.get)('story');
  var uploadedFile = (0, _options.get)('uploadedFile');
  var proxyOption = (0, _options.get)('use_proxy');
  var requestUrl;
  var useProxy;

  var processStoryFile = function processStoryFile(file) {
    isGamefileLoaded = true;
    gamefile = new Uint8Array(file);
    checksum = fnv32(gamefile).toString(16); // signal that the story file is ready

    (0, _assets.finished)('storyfile');
  };

  storyFilename = virtualFilename; // store data saved by the game file

  window.onbeforeunload = function () {
    FS.syncfs(false, function () {});
  }; // if the user has uploaded a file, process that instead of loading from a URL


  if (uploadedFile) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var uploadContainer = document.getElementById('uploadContainer');

      if (uploadContainer) {
        uploadContainer.parentNode.removeChild(uploadContainer);
      }

      processStoryFile(e.target.result);
    };

    (0, _assets.addCallback)(writeGamefile);
    reader.readAsArrayBuffer(uploadedFile);
    return;
  } else if (!gameUrl) {
    (0, _error["default"])("No story file specified");
  }

  var xmlhttp = new XMLHttpRequest();

  switch ("" + proxyOption) {
    case 'always':
    case 'true':
    case '1':
      useProxy = true;
      break;

    case 'never':
    case 'false':
    case '0':
      useProxy = false;
      break;
    //          case 'auto':

    default:
      // use proxy for CORS requests
      useProxy = /^https?:\/\//.test(gameUrl) && gameUrl.indexOf(window.location.protocol + '//' + window.location.host) !== 0; // warn about invalid option

      if (proxyOption !== 'auto') {
        console.warn('Unknown use_proxy option "' + proxyOption + '", using "auto"');
      }

      break;
  }

  if (useProxy) {
    requestUrl = (0, _options.get)('proxy_url').split('%s').join(encodeURIComponent(gameUrl));
  } else {
    requestUrl = gameUrl;
  }

  (0, _assets.addCallback)(writeGamefile);

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) {
      switch (xmlhttp.status) {
        case 200:
          processStoryFile(xmlhttp.response);
          break;

        case 404:
          (0, _error["default"])("Game file not found");
          break;

        case 415:
          if (useProxy) {
            (0, _error["default"])(String.fromCharCode.apply(null, new Uint8Array(xmlhttp.response)));
          } else {
            (0, _error["default"])('Unsupported Media Type error encountered when loading game file');
          }

          break;

        case 0:
          // probably cross-origin error
          (0, _error["default"])("Unspecified error loading game file (possibly cross-origin restriction)");
          break;

        default:
          (0, _error["default"])("Error loading game file. Server returned status code " + xmlhttp.status + " (" + xmlhttp.statusText + ")");
          break;
      }
    }
  };

  xmlhttp.open("GET", requestUrl, true);
  xmlhttp.responseType = "arraybuffer"; // this must be exactly here, otherwise IE11 breaks

  xmlhttp.send();
}
/**
 * Ask the user to provide a file name.
 *
 * @param why The reason why a file is being prompted.
 *            One of "for command recording", "for command playback",
 *            "to restore", "to save" or "to begin transcription (or printer name)"
 */


function prompt(why) {
  var filename = window.prompt("Enter filename " + why);

  if (filename && /\S/.test(filename)) {
    filename = datadir + '/' + filename.split('/').join('-');
  } else {
    filename = "";
  }
  /*
  // we'll have to wait for the UI to get ready before submitting the input
  setTimeout( function() {
      getPrompt.dispatchEvent( new Event( 'submit' ) );
       // ..and another timeout to sync the filesystem.
      // We should hook to the file save itself, but this should do for now,
      // especially since this exists only as a backup measure if the
      // same thing in the onbeforeunload event fails.
      setTimeout( function() {
          FS.syncfs( false, function() {} );
      }, 1000 );
  }, 1 );
  */
  // pass the filename to the engine


  Module.ccall('haven_getfilename', 'null', ['string'], [filename + '\n']);
}
/**
 * Read the UI state from the filesystem.
 */


function readUIState() {
  try {
    var state = FS.readFile(autosaveFilename + '_haven_uidata', {
      encoding: 'utf8'
    });
    return JSON.parse(state);
  } catch (e) {
    return null;
  }
}
/**
 * Synchronize virtual filesystem status with IndexedDB.
 * Called by the engine.
 */


function syncfs() {
  FS.syncfs(false, function () {});
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copy = copy;
exports.exists = exists;
exports.filePrompt = filePrompt;
exports.getFS = getFS;
exports.inAsyncFS = inAsyncFS;
exports.info = info;
exports.informHeader = informHeader;
exports.init = init;
exports.isReady = isReady;
exports.markReady = markReady;
exports.mkdir = mkdir;
exports.move = move;
exports.path = path;
exports.read = read;
exports.readdir = readdir;
exports.resourceUrl = resourceUrl;
exports.rmdir = rmdir;
exports.restoreFilePrompt = restoreFilePrompt;
exports.saveFilePrompt = saveFilePrompt;
exports.transcriptFilePrompt = transcriptFilePrompt;
exports.unlink = unlink;
exports.write = write;
exports.TMP_PATH = exports.TRANSCRIPT_PATH = exports.SAVEFILE_PATH = exports.VORPLE_PATH = exports.INFORM_PATH = exports.ASYNC_FS_ROOT = exports.JS_RETURN_VALUE_TYPE_FILENAME = exports.JS_RETURN_VALUE_FILENAME = exports.JS_EVAL_FILENAME = exports.HANDSHAKE_FILENAME = void 0;

var _vorple = require("./vorple");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var BrowserFS = require("browserfs");

var _require = require("path"),
    basename = _require.basename,
    dirname = _require.dirname,
    resolve = _require.resolve;

var vex = require("vex-js");

var HANDSHAKE_FILENAME = 'VpHndshk';
exports.HANDSHAKE_FILENAME = HANDSHAKE_FILENAME;
var JS_EVAL_FILENAME = 'VpJSEval';
exports.JS_EVAL_FILENAME = JS_EVAL_FILENAME;
var JS_RETURN_VALUE_FILENAME = 'VpJSRtrn';
exports.JS_RETURN_VALUE_FILENAME = JS_RETURN_VALUE_FILENAME;
var JS_RETURN_VALUE_TYPE_FILENAME = 'VpJSType';
exports.JS_RETURN_VALUE_TYPE_FILENAME = JS_RETURN_VALUE_TYPE_FILENAME;
var HANDSHAKE_INIT = "Callooh!";
var HANDSHAKE_RESPONSE = "Callay!";
var SYNC_FS_ROOT = '/';
/**
 * The directory root for the extended filesystem which has more space (IndexedDB)
 * and uses asynchronous access.
 * 
 * @type {string}
 */

var ASYNC_FS_ROOT = '/extended/';
/**
 *  The directory where Inform reads author-provided files (not saves or transcripts).
 * 
 * @type {string}
 */

exports.ASYNC_FS_ROOT = ASYNC_FS_ROOT;
var INFORM_PATH = SYNC_FS_ROOT + 'inform';
/**
 *  The directory Vorple uses for its own files for communication between the interpreter and the game file.
 * 
 * @type {string}
 */

exports.INFORM_PATH = INFORM_PATH;
var VORPLE_PATH = SYNC_FS_ROOT + 'vorple';
/**
 * Save file directory in the extended filesystem.
 * 
 * @type {string}
 */

exports.VORPLE_PATH = VORPLE_PATH;
var SAVEFILE_PATH = ASYNC_FS_ROOT + 'savefiles';
/**
 * Transcripts directory in the extended filesystem.
 * 
 * @type {string}
 */

exports.SAVEFILE_PATH = SAVEFILE_PATH;
var TRANSCRIPT_PATH = ASYNC_FS_ROOT + 'transcripts';
/**
 * The directory for temporary files. The temporary directory is emptied after leaving the page.
 * 
 * @type {string}
 */

exports.TRANSCRIPT_PATH = TRANSCRIPT_PATH;
var TMP_PATH = '/tmp';
exports.TMP_PATH = TMP_PATH;
var DEFAULT_PATH = INFORM_PATH;
var fs = null;
/**
 * Check if file contents start with an Inform 7 header.
 * 
 * @private
 * @param {string} contents 
 */

function hasHeader(contents) {
  return new RegExp("^[\\-*] //.*// .*\\s+").test(contents);
}
/**
 * Copies a file.
 * 
 * @param {*} source File to copy
 * @param {*} target Target directory or the new name
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place. Applies to both source and target parameters.
 * @param {boolean} [options.replace=true] If true, any existing file of the same name will be replaced.
 *   If false, the operation will not continue if the file already exists.
 * @returns {boolean} True on success, false otherwise
 */


function copy(source, target) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH,
    replace: true
  }, options);

  var sourceFilename = path(source, opt.cwd);

  if (!exists(sourceFilename)) {
    // can't copy files that don't exist
    return false;
  }

  if (info(sourceFilename).isDirectory) {
    // won't copy directories
    return false;
  }

  var targetPath = path(target, opt.cwd);
  var targetFilename = targetPath; // if the target is a directory, add the source filename to the target

  if (exists(targetPath) && info(targetPath).isDirectory) {
    targetFilename = path(basename(source), targetPath);
  }

  if (exists(targetFilename)) {
    if (!opt.replace) {
      // asked not to replace target
      return false;
    }

    if (info(targetFilename).isDirectory) {
      // directories won't be overwritten
      return false;
    }
  }

  try {
    var contents = read(sourceFilename, {
      header: true
    });
    write(targetFilename, contents, {
      header: false
    });
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Does a file or directory exist in the virtual filesystem?
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if the file/directory exists, false otherwise
 */


function exists(filename) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  return fs.existsSync(path(filename, opt.cwd));
}
/**
 * Show a modal asking the user to provide a filename.
 * 
 * @param {function} callback The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @param {string} [filepath=/inform] The root path of the file
 */


function filePrompt(_callback) {
  var filepath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INFORM_PATH;
  var needsAsync = inAsyncFS(filepath);
  var fs = getFS();

  var asyncExists = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(filename) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", new Promise(function (resolve) {
                try {
                  fs.exists(filename, function (status) {
                    return resolve(status);
                  });
                } catch (e) {
                  resolve(false);
                }
              }));

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function asyncExists(_x) {
      return _ref.apply(this, arguments);
    };
  }();

  var askForFilename = function askForFilename() {
    vex.dialog.open({
      message: 'Enter filename:',
      input: ['<input name="filename" type="text" required />'].join(''),
      buttons: [$.extend({}, vex.dialog.buttons.YES, {
        text: 'Save'
      }), $.extend({}, vex.dialog.buttons.NO, {
        text: 'Cancel'
      })],
      callback: function () {
        var _callback2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(data) {
          var finalPath;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (data) {
                    _context2.next = 4;
                    break;
                  }

                  _callback(null);

                  _context2.next = 16;
                  break;

                case 4:
                  finalPath = path(data.filename, filepath);

                  if (!needsAsync) {
                    _context2.next = 15;
                    break;
                  }

                  _context2.next = 8;
                  return asyncExists(finalPath);

                case 8:
                  if (!_context2.sent) {
                    _context2.next = 12;
                    break;
                  }

                  askToOverwrite(finalPath);
                  _context2.next = 13;
                  break;

                case 12:
                  _callback(finalPath);

                case 13:
                  _context2.next = 16;
                  break;

                case 15:
                  if (exists(finalPath)) {
                    askToOverwrite(finalPath);
                  } else {
                    _callback(finalPath);
                  }

                case 16:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        function callback(_x2) {
          return _callback2.apply(this, arguments);
        }

        return callback;
      }()
    });
  };

  var askToOverwrite = function askToOverwrite(finalPath) {
    vex.dialog.open({
      message: 'File already exists. Overwrite?',
      buttons: [$.extend({}, vex.dialog.buttons.YES, {
        text: 'Overwrite'
      }), $.extend({}, vex.dialog.buttons.NO, {
        text: 'Cancel'
      })],
      callback: function callback(overwrite) {
        if (overwrite) {
          _callback(finalPath);
        } else {
          _callback(null);
        }
      }
    });
  };

  if (needsAsync) {
    _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return asyncExists(filepath);

            case 2:
              if (_context3.sent) {
                _context3.next = 4;
                break;
              }

              mkdir(filepath, askForFilename);

            case 4:
              askForFilename();

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }))();
  } else {
    if (!exists(filepath)) {
      mkdir(filepath);
    }

    askForFilename();
  }
}
/**
 * Returns the BrowserFS object for direct access to the BrowserFS API.
 * 
 * @returns {object|null} The FS object or null if the filesystem hasn't been initialized yet
 */


function getFS() {
  return fs;
}
/**
 * Check if a file is in a filesystem that requires asynchronous access.
 * 
 * (Asynchronous file access isn't officially supported so this is for internal use only.)
 * 
 * @private
 * @param {string} fullPath Path to the file. Must be a full path, not relative.
 */


function inAsyncFS(fullPath) {
  return fullPath.startsWith(ASYNC_FS_ROOT);
}
/**
 * Returns an object with information about a file or directory:
 * 
 * ```
 * {
 *   contents: string | Array<string>,   // Contents of text file, or files inside the directory
 *   directory: string,                  // Parent directory
 *   header: null | {                    // Inform 7 header, or null if doesn't exist/apply
 *     project: string,                  // Project name in the header
 *     ready: boolean                    // File's ready status
 *   },
 *   name: string,                       // Base filename or directory name
 *   isDirectory: boolean,               // True if it's a directory, false if it's a normal file
 *   path: string                        // Full path to the file
 * }
 * ```
 * 
 * Returns null if the file or directory doesn't exist.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {object|null}
 */


function info(filename, options) {
  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  try {
    var fullPath = path(filename, opt.cwd);
    var stats = fs.statSync(fullPath);
    var isDirectory = stats.isDirectory();
    var contents;

    if (isDirectory) {
      contents = readdir(filename, {
        cwd: opt.cwd
      });
    } else {
      contents = read(filename, {
        cwd: opt.cwd,
        header: true
      });
    }

    if (contents === null) {
      return false;
    }

    var header = hasHeader(contents) ? {
      project: contents.split('//')[1],
      ready: contents.charAt(0) === '*'
    } : null;
    return {
      contents: contents,
      directory: dirname(fullPath),
      name: basename(fullPath),
      header: header,
      isDirectory: isDirectory,
      path: fullPath
    };
  } catch (e) {
    // file doesn't exist or couldn't be opened
    return null;
  }
}
/**
 * Creates a header for Inform 7 files. If the story is Inform 6, returns an empty string.
 * 
 * @param {string} project Project's name
 * @param {string} filename Filename, path is automatically removed
 * @param {boolean} [ready=true] If true, the file is marked "ready" for Inform 7
 * @returns {string} Inform 7 header or an empty string for Inform 6
 */


function informHeader(project, filename) {
  var ready = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var readyMark = ready ? "*" : "-";

  if ((0, _vorple.getInformVersion)() === 7) {
    return "".concat(readyMark, " //").concat(project, "// ").concat(basename(filename), "\n");
  }

  return '';
}
/**
 * Initialize the filesystem. This gets called automatically when calling
 * vorple.init() but it can be called manually before that to get access
 * to the filesystem earlier.
 * 
 * The method returns a promise that resolves into the BrowserJS filesystem
 * object, but after the promise has resolved all vorple.file.* are also
 * available.
 * 
 * @example 
 * async function getAccessToFS() {
 *   const fs = await vorple.file.init();
 *   
 *   // fs is now the BrowserFS filesystem object (what you'd get from vorple.file.getFS())
 *   // also all vorple.file.* methods are now available
 *   vorple.file.write("info.txt", "Filesystem is now available");
 * }
 * 
 * @returns {Promise<object>} A promise that resolves to the filesystem object
 */


function init() {
  return new Promise(function (resolve, reject) {
    var _options;

    if (fs) {
      // already initialized!
      return resolve(fs);
    }

    BrowserFS.configure({
      fs: 'MountableFileSystem',
      options: (_options = {}, _defineProperty(_options, SYNC_FS_ROOT, {
        fs: "LocalStorage",
        options: {}
      }), _defineProperty(_options, ASYNC_FS_ROOT, {
        fs: "IndexedDB",
        options: {}
      }), _defineProperty(_options, TMP_PATH, {
        fs: "InMemory",
        options: {}
      }), _options)
    }, /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(error) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!error) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return", reject(error));

              case 2:
                // save a reference to BrowserFS methods
                fs = BrowserFS.BFSRequire('fs'); // create the necessary directories if they don't exist

                [VORPLE_PATH, INFORM_PATH].forEach(function (dir) {
                  if (!exists(dir)) {
                    mkdir(dir);
                  }
                }); // the same thing for paths that need async operations

                _context4.next = 6;
                return Promise.all([SAVEFILE_PATH, TRANSCRIPT_PATH].map(function (dir) {
                  return new Promise(function (resolve) {
                    fs.exists(dir, function (alreadyExists) {
                      if (!alreadyExists) {
                        fs.mkdir(dir, resolve);
                      } else {
                        resolve();
                      }
                    });
                  });
                }));

              case 6:
                // Create the handshake file. This file must "really" exist for the interpreter to pick it up.
                try {
                  fs.writeFileSync(path(HANDSHAKE_FILENAME, VORPLE_PATH), '', 'utf8');
                } catch (e) {// already exists - no need to do anything
                }

                resolve(fs);

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }());
  });
}
/**
 * Check if a file has been marked ready for Inform 7 to read.
 * 
 * If the file doesn't exist, it doesn't have a header, or it can't be read,
 * the method returns false. Error conditions must be checked manually if
 * it's important to make a difference between invalid operation and a file
 * that has been marked not ready.
 * 
 * This method always returns false on Inform 6.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if file is ready, false on error or not ready
 */


function isReady(filename) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  if ((0, _vorple.getInformVersion)() !== 7) {
    return false;
  }

  var contents = read(filename, {
    cwd: opt.cwd,
    header: true
  });

  if (contents === null) {
    // read failed
    return false;
  }

  if (!hasHeader(contents)) {
    return false;
  }

  return contents.charAt(0) === "*";
}
/**
 * Marks a file ready to read (or not ready to read) for Inform 7.
 * This is equivalent of the phrases "mark (external file) as ready to read"
 * and "mark (external file) as not ready to read" in Inform 7.
 * 
 * If the file doesn't have an Inform 7 header the method does nothing and returns false.
 * 
 * In Inform 6 this method does nothing and always returns false.
 * 
 * @param {string} filename 
 * @param {boolean} [ready=true] If true, marks the file ready. Otherwise marks the file not ready.
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if operation was successful, false otherwise.
 *  Returns true even if no change was made to the file (was already marked ready.)
 */


function markReady(filename) {
  var ready = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  if ((0, _vorple.getInformVersion)() !== 7) {
    return false;
  }

  var contents = read(filename, {
    cwd: opt.cwd,
    header: true
  });

  if (!contents) {
    // read failed
    return false;
  }

  if (!hasHeader(contents)) {
    return false;
  }

  var readyMarker = ready ? "*" : "-";
  var newContents = readyMarker + contents.substr(1);
  return write(filename, newContents, {
    cwd: opt.cwd,
    header: false
  });
}
/**
 * Create a new directory in the virtual filesystem. 
 * 
 * This does not create missing subdirectories, e.g. mkdir( 'foo/bar' ) won't work
 * if directory 'foo' doesn't exist.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if directory was created, false otherwise
 */


function mkdir(dirname) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  var fullPath = path(dirname, opt.cwd);

  if (inAsyncFS(fullPath)) {
    return fs.mkdir(fullPath);
  }

  try {
    fs.mkdirSync(fullPath);
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Moves a file or directory to another directory.
 * If the target doesn't exist, the file or directory is renamed.
 * 
 * @param {*} source File/directory to move
 * @param {*} target Target directory or the new name
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place. Applies to both source and target parameters.
 * @param {boolean} [options.replace=true] If true, any existing file of the same name will be replaced.
 *   If false, the operation will not continue if the file already exists.
 *   This option is ignored if the source is a directory (a directory will never overwrite a file.)
 * @returns {boolean} True on success, false otherwise
 */


function move(source, target) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH,
    replace: true
  }, options);

  if (!exists(source, {
    cwd: opt.cwd
  })) {
    return false;
  }

  var sourceFilename = path(source, opt.cwd);
  var sourceIsDir = info(sourceFilename).isDirectory;
  var targetPath = path(target, opt.cwd);
  var targetFilename = targetPath; // if the target is a directory, add the source filename to the target

  if (exists(targetPath) && info(targetPath).isDirectory) {
    targetFilename = path(basename(source), targetPath);
  }

  if (exists(targetFilename)) {
    if (!opt.replace) {
      // asked not to replace target
      return false;
    }

    if (sourceIsDir) {
      // directories don't overwrite anything
      return false;
    }

    if (info(targetFilename).isDirectory) {
      // directories won't be overwritten
      return false;
    }
  }

  try {
    fs.renameSync(sourceFilename, targetFilename);
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Adds a path to a given filename.
 * See https://nodejs.org/api/path.html#path_path_resolve_paths
 * for rules on how path joining works.
 * 
 * The default root directory is /inform so
 * `vorple.file.path( "foo.txt", "bar" )` will resolve to
 * `/inform/bar/foo.txt`.
 * 
 * @example
 * vorple.file.path( "foo.txt" );                   // --> /inform/foo.txt
 * vorple.file.path( "foo.txt", "bar" );            // --> /inform/bar/foo.txt
 * vorple.file.path( "foo.txt", "/bar" );           // --> /bar/foo.txt
 * vorple.file.path( "../foo.txt", "/bar/xyz" );    // --> /bar/foo.txt
 * vorple.file.path( "foo.txt", "/" );              // --> /foo.txt
 * vorple.file.path( "/foo.txt", "/bar/xyz" );      // --> /foo.txt
 * 
 * @param {string} filename
 * @param {string} path
 */


function path(filename) {
  var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '.';
  return resolve(DEFAULT_PATH, path, filename);
}
/**
 * Read a text file from the virtual filesystem
 * 
 * @param {string} filename
 * @param {object} [options={}]
 * @param {boolean} [options.binary=false] Is it a binary file?
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @param {boolean} [options.header=false] If true, return value contains the Inform 7 header if present. Otherwise the header is not included in the return value.
 * @returns {string|null} The contents of the file, or null file could not be read
 */


function read(filename) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    binary: false,
    cwd: DEFAULT_PATH,
    header: false
  }, options);

  var encoding = opt.binary ? {} : 'utf8'; // Regardless of what the file actually contains, 
  // the handshake response is returned when the story file
  // tries to read the handshake file. This tells it that
  // it's running on the Vorple interpreter.

  if (filename === HANDSHAKE_FILENAME) {
    return informHeader('VORPLE', filename) + HANDSHAKE_RESPONSE;
  }

  try {
    var contents = fs.readFileSync(path(filename, opt.cwd), encoding, 'r');

    if (!opt.header && hasHeader(contents)) {
      // header not wanted - remove it from the return value
      return contents.substr(contents.indexOf('\n') + 1);
    }

    return contents;
  } catch (e) {
    return null;
  }
}
/**
 * Returns the contents of a directory. Returns null if the directory doesn't exist
 * or the directory is actually a file.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {array|null} The list of files in the directory, or null on error
 */


function readdir(dirname) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  try {
    return fs.readdirSync(path(dirname, opt.cwd));
  } catch (e) {
    return null;
  }
}
/**
 * Get the URL to a resource, which can be a normal URL or a data URL containing
 * the resource itself. This is used to get the resource files from the Borogove
 * editor.
 *  
 * @param {string} url
 * @returns {string} The URL or a data URL
 * @since 3.2.2
 */


function resourceUrl(url) {
  // don't do anything to non-strings or empty strings
  if (typeof url !== "string" || !url) {
    return url;
  }

  var lowerCaseUrl = url.toLowerCase(); // don't do anything to external URLs

  if (lowerCaseUrl.indexOf("http://") > -1 || lowerCaseUrl.indexOf("https://") > -1) {
    return url;
  } // don't do anything unless we're in a Borogove environment


  if (!window.borogove || !window.borogove.getFileContents) {
    return url;
  }

  return window.borogove.getFileContents(url);
}
/**
 * Remove a directory from the virtual filesystem. Directory must be empty.
 * 
 * @param {string} dirname 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if directory was removed, false otherwise
 */


function rmdir(dirname) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  try {
    fs.rmdirSync(path(dirname, opt.cwd));
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Ask the user to choose a save file to restore.
 * 
 * @param {string} gameid The IFID of the game
 * @param {function} callback The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @private
 */


function restoreFilePrompt(_x4, _x5) {
  return _restoreFilePrompt.apply(this, arguments);
}
/**
 * Ask the user to provide a filename for saving the transcript.
 * 
 * @param {function} callback The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @private
 */


function _restoreFilePrompt() {
  _restoreFilePrompt = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(gameid, _callback3) {
    var fullPath, fs, savefiles;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            fullPath = path(gameid, SAVEFILE_PATH);
            fs = getFS();
            _context5.next = 4;
            return new Promise(function (resolve) {
              return fs.readdir(fullPath, function (err, result) {
                return resolve(result);
              });
            });

          case 4:
            savefiles = _context5.sent;

            if (savefiles) {
              _context5.next = 8;
              break;
            }

            vex.dialog.open({
              message: 'There are no save files yet.',
              buttons: [$.extend({}, vex.dialog.buttons.YES, {
                text: 'OK'
              })],
              callback: function callback() {
                _callback3(null);
              }
            });
            return _context5.abrupt("return");

          case 8:
            vex.dialog.open({
              message: 'Choose save file to restore:',
              input: '<ul style="list-style-type:none">' + savefiles.map(function (file, index) {
                return "<li>\n                <label>\n                    <input type=\"radio\" value=\"".concat(index, "\" name=\"fileindex\" required>\n                    ").concat(file, "\n                </label>\n            </li>");
              }).join('') + '</ul>',
              buttons: [$.extend({}, vex.dialog.buttons.YES, {
                text: 'Restore'
              }), $.extend({}, vex.dialog.buttons.NO, {
                text: 'Cancel'
              })],
              callback: function callback(data) {
                if (!data) {
                  return _callback3(null);
                } else {
                  var source = path(savefiles[data.fileindex], fullPath);
                  var dest = path(savefiles[data.fileindex], TMP_PATH); // We need to do this "hack" and copy the save file to the synchronous
                  // filesystem so that the engine can read it synchronously

                  fs.readFile(source, {}, function (err, contents) {
                    write(dest, contents, {
                      binary: true
                    });

                    _callback3(dest);
                  });
                }
              }
            });

          case 9:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _restoreFilePrompt.apply(this, arguments);
}

function saveFilePrompt(gameid, callback) {
  filePrompt(callback, path(gameid, SAVEFILE_PATH));
}
/**
 * Ask the user to provide a filename for saving the transcript.
 * 
 * @param {function} callback The function to call with the filename as the parameter
 *   after the user has selected the filename, or null if action was canceled
 * @private
 */


function transcriptFilePrompt(callback) {
  var choice = prompt('Enter filename');

  if (!choice) {
    return callback(null);
  }

  callback(path(choice, TRANSCRIPT_PATH));
}
/**
 * Unlink (i.e. delete) a file from the virtual filesystem.
 * Use rmdir() to remove directories.
 * 
 * @param {string} filename 
 * @param {object} [options={}]
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @returns {boolean} True if file was removed, false otherwise
 */


function unlink(filename) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opt = _objectSpread({
    cwd: DEFAULT_PATH
  }, options);

  try {
    fs.unlinkSync(path(filename, opt.cwd));
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Write a file to the virtual filesystem.
 * 
 * @param {string} filename
 * @param {string|array} contents Contents of what to write to the file, either a string or a byte array
 * @param {object} [options={}]
 * @param {boolean} [options.append=false] If true, contents are appended to the file, otherwise the file is overwritten with the new content
 * @param {boolean} [options.binary=false] If true, writes a binary file instead of a text file
 * @param {string} [options.cwd=/inform] The directory where the operation takes place
 * @param {boolean} [options.header=true] If true, an Inform 7 header is added to the start of the file. On Inform 6 this option does nothing.
 * @param {string} [options.project=VORPLE] The project name that's used in the Inform 7 header.
 *  Does nothing on Inform 6 or if `options.header` is false.
 * @param {boolean} [options.ready=true] If true, the header gets a "ready" mark (`*`) to signal Inform 7 that the file can be read.
 *  Otherwise the header is marked not ready (`-`).
 *  Does nothing on Inform 6 or if `options.header` is false.
 * @returns {boolean} True on success, false otherwise
 */


function write(filename, contents) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var opt = _objectSpread({
    append: false,
    binary: false,
    cwd: DEFAULT_PATH,
    header: true,
    project: "VORPLE",
    ready: true
  }, options);

  var fullPath = path(filename, opt.cwd);
  var informVersion = (0, _vorple.getInformVersion)();
  var encoding = opt.binary ? {} : 'utf8';
  var header = "";

  if (opt.binary) {
    // convert binary files to a Buffer
    contents = Buffer.from(contents);
  } else if (contents instanceof Uint8Array) {
    contents = contents.toString();
  } else if (Array.isArray(contents)) {
    // convert normal arrays to a string
    contents = contents.map(function (code) {
      return String.fromCharCode(code);
    }).join('');
  }

  if (opt.header && !opt.binary) {
    header = informHeader(opt.project, filename, opt.ready);
  } // If the story is writing to the handshake file, detect the Inform version
  // by checking the possible header


  if (filename === HANDSHAKE_FILENAME && contents.length > 0 && !informVersion) {
    // in case the handshake file is binary, turn it into string
    var handshake = contents.toString();

    if (handshake === HANDSHAKE_INIT) {
      (0, _vorple.setInformVersion)(6);
      return true;
    }

    if (hasHeader(handshake)) {
      (0, _vorple.setInformVersion)(7);
      return true;
    }

    console.warn("Unknown handshake initialization from the story file – can't detect Inform version");
    return false;
  }

  try {
    if (inAsyncFS(fullPath)) {
      // This handles the "special case" of writing savefiles and transcripts - not guaranteed to work in the general case!
      if (contents.length === 0) {
        return;
      }

      if (opt.append) {
        fs.appendFile(fullPath, contents, encoding, function (err) {
          return console.log(err);
        });
      } else {
        fs.writeFile(fullPath, contents, encoding, function (err) {
          return console.log(err);
        });
      }

      return true;
    }

    if (opt.append) {
      // append the I7 header only if the file doesn't exist
      if (header && !exists(fullPath)) {
        fs.writeFileSync(fullPath, header, encoding);
      }

      fs.appendFileSync(fullPath, contents, encoding);
    } else {
      if (header) {
        fs.writeFileSync(fullPath, header + contents, encoding);
      } else {
        fs.writeFileSync(fullPath, contents, encoding);
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}
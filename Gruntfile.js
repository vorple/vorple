module.exports = function( grunt ) {
    var i, j;
    var exec = require('execSync');

    var thirdpartyLibraries = [
        'vendor/jquery-1.11.0.min.js',
        'vendor/jquery-migrate-1.2.1.min.js',
        'vendor/jquery.noty.min.js',
        'vendor/jquery.qtip.min.js',
        'vendor/soundmanager2.min.js'
    ];

    var themenames = grunt.file.expand(
        { filter: 'isDirectory', cwd: 'themes' },
        '*'
    );


    // build the commands for creating the theme file structure
    var themecopy = [
        {
            expand: true,
            src: 'themes/**',
            dest: 'release/'
        }
    ];

    for( i = 0; i < themenames.length; ++i ) {
        themecopy.push( {
            expand: true,
            cwd: 'release/themes/',
            src: 'vorple.game.en.js',
            dest: 'release/themes/'+themenames[ i ]+'/'
        } );

        themecopy.push( {
            expand: true,
            cwd: 'release/',
            src: [
                'lib/vorple.undum.min.js',
                'lib/vorple.lib.css',
                'lib/soundmanager/*'
            ],
            dest: 'release/themes/'+themenames[ i ]+'/'
        } );
    }


    // The only way I could get it to work was to make each theme
    // a separate task which is not ideal
    var zips = {
        'examples': {
            expand: true,
            src: [ 'stories/undum/**/*', 'lib/**/*', 'vendor/parchment*', 'vendor/soundmanager/*' ],
            dest: 'release/zip/vorple-examples.zip'
        },
        'i7-template': {
            cwd: 'release/inform7/templates/',
            src: [ 'release/inform7/templates/Vorple/*' ],
            dest: 'release/zip/vorple-inform7-template.zip'
        },
        'extensions': {
            cwd: 'release/inform7/extensions/',
            src: 'release/inform7/extensions/**/*',
            dest: 'release/zip/vorple-inform7-extensions.zip'
        },
        'doc': {
            cwd: 'release/',
            src: [ 'release/doc/**/*' ],
            dest: 'release/zip/vorple-documentation.zip'
        }
    };

    for( i = 0; i < themenames.length; ++i ) {
        zips[ 'theme-' + themenames[ i ] ] = {
            expand: true,
            src: 'release/themes/' + themenames[ i ] + '/**/*',
            dest: 'release/zip/vorple-undum-' + themenames[ i ] + '.zip'
        };
    }


    // extract I7 examples
    // todo: parametrize
    grunt.task.registerTask( 'i7examples', 'Extract and compile I7 example code', function() {
        var i7extensions = grunt.file.expand(
            { cwd: 'src/inform7/extensions/' },
            'Vorple*.i7x'
        );

        var listHTML = '<div id="examplelinks">\n',
            totalExamples = 0,
            i7result, i6result;

        grunt.file.mkdir( 'build/tmp/i7example/Build' );
        grunt.file.mkdir( 'build/tmp/i7example/Index' );
        grunt.file.mkdir( 'build/Extensions/Reserved' );

        for( i = 0; i < i7extensions.length; ++i ) {
            var extension = i7extensions[ i ].substr( 0, i7extensions[ i ].length - 4 ),
                contents = grunt.file.read( 'src/inform7/extensions/' + i7extensions[ i ] );

            grunt.file.mkdir( 'release/doc/inform7/examples/stories/' + extension );
            listHTML += '\n<h3>' + extension + '</h3>\n';

            var lines = contents.split( '\n' ),
                examplename = false,
                nifiles = {};

            for( j = 0; j < lines.length; ++j ) {
                if( lines[ j ].indexOf( 'Example: *' ) === 0 ) {
                    var header = /Example: (\**) (.*?)( -(.*))?$/.exec( lines[ j ] );

                    examplename = header[ 2 ];
                    nifiles[ examplename ] = '';

                    listHTML += '<h4>' + examplename + '</h4>'
                        + '<div class="blurb">' + header[ 4 ] + '</div>'
                        + '<div class="dl_links"><a href="/vorple/release/doc/inform7/examples/interpreter.html?story=stories/' + encodeURIComponent( extension ) + '/' + encodeURIComponent( examplename ) + '.z8">play</a>'
                        + '&mdash; <a href="/vorple/release/doc/inform7/examples/stories/' + encodeURIComponent( extension ) + '/' + encodeURIComponent( examplename ) + '.ni">view source</a></div>\n';
                }
                else if( examplename && ( lines[ j ].indexOf( '\t' ) === 0 || lines[ j ].replace( /\s/, '' ) === '' ) ) {
                    nifiles[ examplename ] += lines[ j ].substring( 1 ).replace( /^\*: /, '' ) + '\n';

                    if( lines[ j ].indexOf( '\tTest me with ' ) === 0 ) {
                        listHTML += '<div class="testme">Try: <span class="testcommands">'
                            + /\tTest me with "(.*)"/.exec( lines[ j ] )[ 1 ]
                            + '</span></div>\n';
                    }
                }
            }

            for( var k in nifiles ) {
                if( nifiles.hasOwnProperty( k ) ) {
                    var out = 'release/doc/inform7/examples/stories/' + extension + '/' + k + '.ni';

                    // write source
                    grunt.file.write( out, nifiles[ k ] );

                    // compile with I7
                    grunt.file.copy( out, 'build/tmp/i7example/Source/story.ni' );

                    i7result = exec.exec( 'cd build/tmp/i7example; ni -package . -rules /Applications/Inform_DEV.app/Contents/Resources/Inform7/Extensions -extensions ../../Extensions -sandboxed -extension=z8' );
//                    a = 'ni "-rules" "/Applications/Inform_DEV.app/Contents/Resources/Inform7/Extensions" "-sandboxed" "-extensions" "/Users/jleinonen/Library/Inform/Extensions" "-package" "/Users/jleinonen/Documents/if/Inform/Vorple extensions.inform" "-extension=z8" "-release"'

                    if( i7result.code ) {
                        grunt.fail.warn( 'ni compilation for ' + k + ' in extension ' + extension + ' failed.\n' + i7result.stdout, i7result.code );
                    }
                    else {
                        i6result = exec.exec( 'cd build/tmp/i7example; inform6-biplatform Build/auto.inf +"../../Library/6.11/" -kE2SDwv8 -o "../../../release/doc/inform7/examples/stories/' + extension + '/' + k + '.z8"' );

                        if( i6result.code ) {
                            grunt.fail.warn( 'Inform 6 compilation for ' + k + ' in extension ' + extension + ' failed.\n' + i6result.stdout, i6result.code );
                        }
                    }

                    totalExamples++;
                }
            }
        }

        listHTML += '</div>';

        grunt.file.write( 'release/doc/inform7/examples/list.html', listHTML );

        // unit test
        grunt.file.copy( 'tests/lib/story.ni', 'build/tmp/i7example/Source/story.ni' );
        i7result = exec.exec( 'cd build/tmp/i7example; ni -package . -rules /Applications/Inform_DEV.app/Contents/Resources/Inform7/Extensions -extensions ../../Extensions -sandboxed -extension=z8' );

        if( i7result.code ) {
            grunt.fail.warn( 'ni compilation for the unit test story failed.\n' + i7result.stdout, i7result.code );
        }
        else {
            i6result = exec.exec( 'cd build/tmp/i7example; inform6-biplatform Build/auto.inf +"../../Library/6.11/" -kE2SDwv8 -o "../../../tests/lib/unittest.z8"' );

            if( i6result.code ) {
                grunt.fail.warn( 'Inform 6 compilation for the unit test story failed.\n' + i6result.stdout, i6result.code );
            }
        }

        grunt.log.writeln( 'Extracted and compiled ' + totalExamples.toString().cyan + ' Inform 7 examples in ' + i7extensions.length.toString().cyan + ' extensions and the unit test story.' );
    });


    // Project configuration.
    grunt.initConfig( {
        pkg: grunt.file.readJSON( 'package.json' ),
        'closure-compiler': {
            main: {
                closurePath: 'build/closure-compiler',
                js: [ 'src/vorple.core.js', 'src/*.js' ],
                jsOutputFile: 'release/lib/vorple.min.js',
                noreport: true,
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'
                }
            },
            parchment: {
                closurePath: 'build/closure-compiler',
                js: [ thirdpartyLibraries, 'vendor/parchment.min.js', 'src/vorple.core.js', 'src/*.js' ],
                jsOutputFile: 'release/lib/vorple.parchment.min.js',
                noreport: true,
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'
                }
            },
            thirdparty: {
                closurePath: 'build/closure-compiler',
                js: thirdpartyLibraries,
                jsOutputFile: 'release/lib/vorple.3rdparty-bundle.min.js',
                noreport: true,
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'
                }
            },
            undum: {
                closurePath: 'build/closure-compiler',
                js: [ thirdpartyLibraries, 'vendor/undum.js', 'src/vorple.core.js', 'src/*.js' ],
                jsOutputFile: 'release/lib/vorple.undum.min.js',
                noreport: true,
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'
                }
            },
            vanilla: {
                closurePath: 'build/closure-compiler',
                js: [ thirdpartyLibraries, 'src/vorple.core.js', 'src/*.js' ],
                jsOutputFile: 'release/lib/vorple.vanilla.min.js',
                noreport: true,
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    language_in: 'ECMASCRIPT5_STRICT'
                }
            }
        },
        concat: {
            css: {
                // CSS files required by the library
                src: [
                    'vendor/qtip/jquery.qtip.min.css',
                    'vendor/noty/jquery.noty.css',
                    'vendor/noty/noty_theme_default.css'
                ],
                dest: 'release/lib/vorple.lib.css'
            },
            i7: {
                // CSS for the I7 template
                src: [
                    'release/lib/vorple.lib.css',
                    'vendor/parchment/parchment.css',
                    'src/inform7/templates/Vorple/vorple.css'
                ],
                dest: 'release/inform7/templates/Vorple/vorple.css'
            }
        },
        copy: {
            doc: {
                files: [
                    {
                        expand: true,
                        src: 'doc/**/*',
                        dest: 'release/'
                    }
                ]
            },
            examples: {
                files: [
                    {
                        expand: true,
                        src: 'stories/**/*',
                        dest: 'release/'
                    }
                ]
            },
            i7examples: {   // for use with examples extracted from extensions
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'src/inform7/extensions/Vorple*.i7x',
                    dest: 'build/Extensions/Juhana Leinonen/'
                },
                {
                    expand: true,
                    flatten: true,
                    src: [
                        'vendor/soundmanager/soundmanager2.swf',
                        'release/lib/vorple.parchment.min.js',
                        'vendor/parchment/*',
                        'release/inform7/templates/vorple/vorple.css'
                    ],
                    dest: 'release/doc/inform7/examples/lib/'
                }]
            },
            i7extensions: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'src/inform7/extensions/Vorple*.i7x',
                    dest: 'release/inform7/extensions/Juhana Leinonen/'
                }]
            },
            i7template: {
                files: [
                    {
                        'release/inform7/templates/Vorple/(manifest).txt': [ 'src/inform7/templates/Vorple/(manifest).txt' ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [ 'vendor/soundmanager/soundmanager2.swf', 'release/lib/vorple.parchment.min.js' ],
                        dest: 'release/inform7/templates/vorple/'
                    }
                ]
            },
            lib: {
                files: [{
                    expand: true,
                    cwd: 'vendor',
                    src: [ 'soundmanager/*', 'parchment/*' ],
                    dest: 'release/lib'
                }]
            },
            themes: {
                files: themecopy
            }
        },
        jsdoc: {
            dist: {
                src: [ 'src/vorple.*.js', 'jsdoc.readme.md' ],
                options: {
                    destination: 'release/doc/API',
                    template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    configure : "jsdoc.conf.json",
                    private: false
                }
            }
        },
        jshint: {
            src: {
                options: {
                    '-W002': true,  // "e can be overridden in IE8"
                    '-W014': true,  // "bad line breaking before '+'" (personal preference)
                    '-W069': true,  // "use dot notation" (unavoidable with Closure Compiler)
                    '-W083': true,  // "don't make functions within a loop" (chokes on valid usages of anonymous functions)
                    globals: {
                        jQuery: true
                    }
                },
                src: [ 'src/vorple.*.js', 'doc/inform7/examples/resources/javascript/*.js', 'Gruntfile.js' ]
            }
        },
        karma: {
            test: {
                configFile: 'tests/karma.conf.js',
                autoWatch: true
            }
        },
        zip: zips
    } );

    grunt.loadNpmTasks( 'grunt-closure-compiler' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-jsdoc' );
    grunt.loadNpmTasks( 'grunt-karma' );
    grunt.loadNpmTasks( 'grunt-template' );
    grunt.loadNpmTasks( 'grunt-zip' );

    // Default tasks
    grunt.registerTask(
        'default', [
            'jshint',       // should run first
            'concat',
            'closure-compiler',
            'copy',         // must run after closure-compiler
            'i7examples',   // must run after copy
            'jsdoc',
            'zip'           // must run last
        ]
    );
};
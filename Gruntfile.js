module.exports = function( grunt ) {
    var exec = require( 'child_process' ).execFile;

    grunt.task.registerTask( 'unittest', 'Extract and compile I7 example code', function() {
        var done = this.async();

        // unit test
        grunt.file.copy( 'tests/lib/story.ni', '../build/tmp/unittest/Source/story.ni' );
        grunt.file.mkdir( '../build/tmp/unittest/Build' );

        exec(
            'ni',
            [ '-package', '.', '-rules', '/Applications/Inform_DEV.app/Contents/Resources/Inform7/Extensions', '-extensions', '../../../inform7/extensions', '-extension=z8' ],
            {
                cwd: '../build/tmp/unittest'
            },
            function( error ) {
                if( error ) {
                    grunt.fail.fatal( 'ni compilation for the unit test story failed:\n' + error );
                    return;
                }

                exec(
                    'inform6',
                    [ 'Build/auto.inf', '+"../../Library/6.11/"', '-kE2SDwv8', '-o', '../../../vorple/tests/lib/unittest.z8' ],
                    {
                        cwd: '../build/tmp/unittest'
                    },
                    function( error, stdout, stderr ) {
                        if( error ) {
                            grunt.fail.fatal( 'inform6 compilation for the unit test story failed:\n' + error + stdout + stderr );
                            return;
                        }
                        grunt.log.writeln( 'I7 unit test story file compiled' );
                        done();
                    }
                );
            }
        );
    });

    grunt.initConfig( {
        pkg: grunt.file.readJSON( 'package.json' ),

        clean: {
            release: {
                cwd: '../build',
                src: [
                    'release',
                    'tmp'
                ]
            }
        },

        copy: {
            html: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: 'src/html/index.html',
                        dest: '../build/release/'
                    }
                ]
            },

            parchment: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        cwd: '../parchment/lib/',
                        src: 'zvm.min.js',
                        dest: '../build/release/lib/'
                    }
                ]
            }
        },

        cssmin: {
            inform: {
                files: {
                    '../build/release/lib/vorple.inform.min.css': [
                        '../parchment/lib/parchment.min.css',
                        'node_modules/qtip2/dist/jquery.qtip.css',
                        '../inform7/templates/Vorple/vorple.css'
                    ]
                }
            }
        },

        jshint: {
            src: {
                options: {
                    '-W002': true,  // "e can be overridden in IE8"
                    '-W014': true,  // "bad line breaking before '+'" (personal preference)
                    '-W083': true,  // "don't make functions within a loop" (chokes on valid usages of anonymous functions)
                    '-W097': true,  // "use the function form of 'use strict'"
                    globals: {
                        requirejs: true
                    }
                },
                src: [ 'src/**/*.js', 'doc/inform7/examples/resources/javascript/*.js', 'Gruntfile.js' ]
            }
        },

        requirejs: {
            options: {
                wrap: true,
                wrapShim: true,
                almond: true,
                findNestedDependencies: true,
                baseUrl: "src",
                mainConfigFile: "src/config.js",
                name: "../node_modules/almond/almond",
                //    optimize: "uglify2"
                    optimize: "none"
            },
            inform7: {
                options: {
                    include: "inform",
                    out: "../build/release/lib/vorple.inform.min.js"
                }
            }
        }
    } );

    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-requirejs' );

    // Default tasks
    grunt.registerTask( 'default', [ 'jshint', 'clean', 'copy', 'requirejs', 'cssmin' ] );
};
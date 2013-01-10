# build.py
# 
# A script that creates a release version of Vorple.

import os
import shutil
import argparse
import sys
from subprocess import call
from glob import glob

# handle command line arguments

available_tasks = [ 
             'minify_vorple', 
             'minify_lib', 
             'api', 
             'themes', 
             'undum_examples', 
             'i7_examples', 
             'i7_templates'
         ];

parser = argparse.ArgumentParser()
parser.add_argument(
    '-a', '--all',
    action='store_true',
    help="Run all build tasks"    
)
parser.add_argument(
    '-t', '--tasks',
    choices=available_tasks,
    nargs='*',
    help="Run individual build tasks"
)
parser.add_argument( 
    '-u', '--update',
    action='store_true',
    help='Update library files before building'
) 
parser.add_argument(
    '-c', '--coverage',
    action='store_true',
    help='Create unit test coverage files. Requires jscoverage installed on path.'
);

arguments = parser.parse_args()
if arguments.all:
    arguments.tasks = available_tasks
    
if arguments.coverage:
    if arguments.tasks:
        arguments.tasks.append( "coverage" )
    else:
        arguments.tasks = [ "coverage" ]
    
if not arguments.tasks:
    sys.exit( "You must give either --tasks, --all or --coverage as an argument. --help for more options." )

builddir = os.path.abspath( "./" ) + "/"
srcdir = os.path.abspath( "../src" ) + "/"
libdir = os.path.abspath( "../lib" ) + "/"
themedir = os.path.abspath( "../themes" ) + "/"
apidir = os.path.abspath( "../doc/API" ) + "/"
apigeneratordir = os.path.abspath( "../../jsdoc-toolkit" ) + "/"
minifierdir = os.path.abspath( "../../closure/closure-compiler" ) + "/"
exampledir = os.path.abspath( "../stories/undum" ) + "/"
unittestdir = os.path.abspath( "../tests" ) + "/"
i7extensiondir = os.path.abspath( "../src/inform7/extensions" ) + "/"
i7mediadir = os.path.abspath( "../src/inform7/media" ) + "/"
i7templatedir = os.path.abspath( "../src/inform7/templates/Vorple" ) + "/" # TODO: handle multiple templates

destination = os.path.abspath( "release" ) + "/"

srcfiles = glob( srcdir+"vorple.*.js" )
corelib = srcdir+"vorple.core.js"
srcfiles.remove( corelib )

if os.path.exists( destination ):
    shutil.rmtree( destination )

os.mkdir( destination )

if arguments.update:
    print "Updating Closure Compiler..."
    call([ "curl", 
        "-L", "http://closure-compiler.googlecode.com/files/compiler-latest.zip",
        "-o", minifierdir+"compiler-latest.zip"
    ])    
    call([ "unzip",
        "-oq", minifierdir+"compiler-latest.zip",
        "-d", minifierdir
    ])


# run the minifier
if "minify_vorple" in arguments.tasks:
    print "Minifying Vorple..."
    
    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar", 
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--js_output_file", libdir+"vorple.min.js",
                      "--js", corelib
                      ]
    
    for filename in srcfiles:
        minifiercommand.append( "--js" )
        minifiercommand.append( filename )
        
    call( minifiercommand )


if "minify_lib" in arguments.tasks:
    print "Minifying complete library packages..."
    
    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar", 
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--warning_level", "QUIET",
                      "--js_output_file", libdir+"vorple.undum.min.js",
                      "--js", libdir+"jquery-1.8.3.min.js",
                      "--js", libdir+"jquery.noty.js",
                      "--js", libdir+"noty/default.js",
                      "--js", libdir+"noty/layouts.js",
                      "--js", libdir+"jquery.qtip.min.js",
                      "--js", libdir+"soundmanager2.min.js",
                      "--js", libdir+"undum.js",
                      "--js", libdir+"vorple.min.js"
                      ]
    
    call( minifiercommand )

    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar", 
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--warning_level", "QUIET",
                      "--js_output_file", libdir+"vorple.parchment.min.js",
                      "--js", libdir+"jquery-1.8.3.min.js",
                      "--js", libdir+"jquery.noty.js",
                      "--js", libdir+"noty/default.js",
                      "--js", libdir+"noty/layouts.js",
                      "--js", libdir+"jquery.qtip.min.js",
                      "--js", libdir+"soundmanager2.min.js",
                      "--js", libdir+"parchment.min.js",
                      "--js", libdir+"vorple.min.js"
                      ]
    
    call( minifiercommand )


# create API

if "api" in arguments.tasks:
    print "Generating the API..."
    
    call([ "/usr/bin/java",
           "-jar", apigeneratordir+"jsrun.jar", apigeneratordir+"app/run.js",
           "-a",
           "-t="+apigeneratordir+"templates/codeview",
           srcdir,
           "-d="+apidir,
           '-D="noGlobal:true"',
           '-D="title:Vorple"'
        ])
    

# create theme packages

if "themes" in arguments.tasks:
    print "Creating theme packages:"
    themeroot = glob( themedir+"*" )
    themes = []
    
    if os.path.exists( "themes" ):
        shutil.rmtree( "themes" )
    os.mkdir( "themes" )
    
    for themesource in themeroot:
        if os.path.isdir( themesource ):
            themename = os.path.basename( themesource )
            print " - "+themename
            target = "themes/"+themename
            shutil.copytree( themesource, target )
            shutil.copy( themedir+"vorple.game.en.js", target )
            shutil.copytree( libdir, target+"/lib" )
            os.mkdir( target+"/media" )
            os.mkdir( target+"/media/audio" )
            os.mkdir( target+"/media/image" )
            os.mkdir( target+"/media/music" )
            os.mkdir( target+"/media/video" )
            os.chdir( target )
            call([
                  "zip",
                  "-rq",
                  destination+"vorple-"+themename+".zip",
                  ".",
                  # exclude OS X's system files
                  "-x", '*.DS_Store*'
                ])
            os.chdir( '../../' )


# package examples

if "undum_examples" in arguments.tasks:
    print "Packaging Undum example stories..."
    os.chdir( exampledir )
    os.chdir( "../../" )
    call([
          "zip",
          "-rq",
          destination+"example-stories.zip",
          "stories/undum/",
          "-x", '*.DS_Store*'
        ])
    
    os.chdir( libdir )
    os.chdir( "../" )
    call([
          "zip",
          "-grq",
          destination+"example-stories.zip",
          "lib/",
          "-x", '*.DS_Store*'
          ])



# create the Inform 7 interpreter package

if "i7_templates" in arguments.tasks:
    print "Copying files for the I7 interpreter..."
    
    i7releasedir = os.path.join( builddir, "i7/templates/Vorple" )
    
    if os.path.exists( i7releasedir ):
        shutil.rmtree( i7releasedir )
    os.makedirs( i7releasedir )
    
    # the paths must be flattened because the template doesn't read subdirectories
    
    for root, dirs, files in os.walk( libdir ):
        for file in files:
            if file != '.DS_Store':
                shutil.copy( os.path.join( root, file ), i7releasedir )
    
    for file in os.listdir( i7templatedir ):
        filename = os.path.join( i7templatedir, file )
        if not os.path.isdir( filename ) and file != '.DS_Store':
            shutil.copy( filename, i7releasedir )
    
    # write the names of the files to the manifest
    
    manifest = open( os.path.join( i7releasedir, '(manifest).txt' ), 'a' )
    
    for file in os.listdir( i7releasedir ):
        if not os.path.isdir( os.path.join( i7releasedir, file ) ) and file != '(manifest).txt' and file != '.DS_Store':
            manifest.write( file +"\n" )
                    
    manifest.close()
    
    print "Packaging the I7 interpreter..."
    os.chdir( i7releasedir )
    os.chdir( "../" )
    call([
          "zip",
          "-rq",
          destination+"i7-Vorple.zip",
          "Vorple",
          "-x", '*.DS_Store*'
        ])
    
if "i7_examples" in arguments.tasks:
    print "Compiling I7 examples from the extensions..."

if "coverage" in arguments.tasks:
    print "Creating library coverage tests..."
    os.chdir( unittestdir )
    call([
          'jscoverage',
          libdir,
          'coverage/'
      ])
    
    
print "Done.\n"

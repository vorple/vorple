# build.py
# 
# A script that creates a release version of Vorple.

import os
import shutil
from subprocess import call
from glob import glob

srcdir = os.path.abspath( "../src" ) + "/"
libdir = os.path.abspath( "../lib" ) + "/"
themedir = os.path.abspath( "../themes" ) + "/"
apidir = os.path.abspath( "../doc/API" ) + "/"
apigeneratordir = os.path.abspath( "../../jsdoc-toolkit" ) + "/"
minifierdir = os.path.abspath( "../../closure/closure-compiler" ) + "/"
exampledir = os.path.abspath( "../stories" ) + "/"
destination = os.path.abspath( "release" ) + "/"
srcfiles = glob( srcdir+"vorple.*.js" )

corelib = srcdir+"vorple.core.js"
srcfiles.remove( corelib )

if os.path.exists( destination ):
    shutil.rmtree( destination )

os.mkdir( destination )



# update Closure
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
print "Running Closure Compiler..."

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


# create API

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

print "Packaging example stories..."
os.chdir( exampledir )
os.chdir( "../" )
call([
      "zip",
      "-rq",
      destination+"example-stories.zip",
      exampledir,
      libdir,
      "-x", '*.DS_Store*'
    ])


print "Done.\n"

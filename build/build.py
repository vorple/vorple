# build.py
# 
# A script that creates a release version of Vorple.

import os
import shutil
from subprocess import call
from glob import glob

builddir = os.path.abspath( "./" ) + "/"
srcdir = os.path.abspath( "../src" ) + "/"
libdir = os.path.abspath( "../lib" ) + "/"
themedir = os.path.abspath( "../themes" ) + "/"
apidir = os.path.abspath( "../doc/API" ) + "/"
apigeneratordir = os.path.abspath( "../../jsdoc-toolkit" ) + "/"
minifierdir = os.path.abspath( "../../closure/closure-compiler" ) + "/"
exampledir = os.path.abspath( "../stories/undum" ) + "/"
destination = os.path.abspath( "release" ) + "/"
srcfiles = glob( srcdir+"vorple.*.js" )

corelib = srcdir+"vorple.core.js"
srcfiles.remove( corelib )

if os.path.exists( destination ):
    shutil.rmtree( destination )

os.mkdir( destination )



# update Closure
print "Updating Closure Compiler..."


if 0: # tmp disable
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
#                  "--compilation_level=WHITESPACE_ONLY", # debug 
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

print "Copying files for the I7 interpreter..."

i7templatepath = os.path.abspath( os.path.join( builddir, "templates/inform7/" ) )
i7releasepath = os.path.join( i7templatepath, "release/" )

if os.path.exists( i7releasepath ):
    shutil.rmtree( i7releasepath )
os.mkdir( i7releasepath )

# the paths must be flattened because the template doesn't read subdirectories

for root, dirs, files in os.walk( libdir ):
    for file in files:
        if file != '.DS_Store':
            shutil.copy( os.path.join( root, file ), i7releasepath )

for file in os.listdir( i7templatepath ):
    filename = os.path.join( i7templatepath, file )
    if not os.path.isdir( filename ) and file != '.DS_Store':
        shutil.copy( filename, i7releasepath )

# write the names of the files to the manifest

manifest = open( os.path.join( i7releasepath, '(manifest).txt' ), 'a' )

for file in os.listdir( i7releasepath ):
    if not os.path.isdir( os.path.join( i7releasepath, file ) ) and file != '(manifest).txt' and file != '.DS_Store':
        manifest.write( file +"\n" )
                
manifest.close()

print "Done.\n"

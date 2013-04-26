# build.py
# 
# A script that creates a release version of Vorple.
from datetime import datetime
startTime = datetime.now()

import os
import shutil
import argparse
import sys
import re
import subprocess
from glob import glob

# handle command line arguments

available_tasks = [
    'api',
    'i7_examples',
    'i7_templates',
    'minify',
    'themes',
    'undum_examples',
    'unittests'
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
tmpdir = os.path.abspath ( "tmp" ) + "/"
srcdir = os.path.abspath( "../src" ) + "/"
libdir = os.path.abspath( "../lib" ) + "/"
vendordir = os.path.abspath( "../vendor" ) + "/"
themedir = os.path.abspath( "../themes" ) + "/"
apidir = os.path.abspath( "../doc/API" ) + "/"
apigeneratordir = os.path.abspath( "../../jsdoc-toolkit" ) + "/"
minifierdir = os.path.abspath( "compiler/closure-compiler" ) + "/"
exampledir = os.path.abspath( "../stories/undum" ) + "/"
unittestdir = os.path.abspath( "../tests" ) + "/"
i7dir = "/Applications/InformDEV.app/Contents/Resources/"
i7extensiondir = os.path.abspath( "../src/inform7/extensions" ) + "/"
i7mediadir = os.path.abspath( "../src/inform7/media" ) + "/"
i7templatedir = os.path.abspath( "../src/inform7/templates/Vorple" ) + "/" # TODO: handle multiple templates

destination = os.path.abspath( "release" ) + "/"
i7extensiondestination = os.path.abspath( "../doc/inform7/examples" ) + "/"

srcfiles = glob( srcdir+"vorple.*.js" )
corelib = srcdir+"vorple.core.js"
srcfiles.remove( corelib )

templatefiles = [ 
                 libdir+"vorple.parchment.min.js",
                 i7templatedir+"vorple.css",
                 libdir+"parchment/parchment.min.css",
                 libdir+"qtip/jquery.qtip.css",
                 libdir+"soundmanager/soundmanager2.swf"
                ]

if os.path.exists( destination ):
    shutil.rmtree( destination )

os.mkdir( destination )

if os.path.exists( tmpdir ):
    shutil.rmtree( tmpdir )

os.mkdir( tmpdir )

if arguments.update:
    print "Updating Closure Compiler..."
    subprocess.call([ "curl", 
        "-L", "http://closure-compiler.googlecode.com/files/compiler-latest.zip",
        "-o", minifierdir+"compiler-latest.zip"
    ])    
    subprocess.call([ "unzip",
        "-oq", minifierdir+"compiler-latest.zip",
        "-d", minifierdir
    ])


# run the minifier
if "minify" in arguments.tasks:
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
        
    subprocess.call( minifiercommand )

    print "Minifying complete library packages:"

    libraryArguments = [
                      "--js", vendordir+"jquery-1.8.3.min.js",
                      "--js", vendordir+"jquery.noty.js",
                      "--js", vendordir+"noty/default.js",
                      "--js", vendordir+"noty/layouts.js",
                      "--js", vendordir+"jquery.qtip.min.js",
                      "--js", vendordir+"soundmanager2.min.js"
                      ]

    print " - for Undum..."
    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar", 
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--warning_level", "QUIET",
                      "--js_output_file", libdir+"vorple.undum.min.js" ]
    minifiercommand.extend( libraryArguments )
    minifiercommand.extend( [
                      "--js", vendordir+"undum.js",
                      "--js", libdir+"vorple.min.js"
                      ] )
    subprocess.call( minifiercommand )
    
    print " - for Parchment..."
    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar",
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--warning_level", "QUIET",
                      "--js_output_file", libdir+"vorple.parchment.min.js" ]
    minifiercommand.extend( libraryArguments )
    minifiercommand.extend( [
                    "--js", vendordir+"parchment.min.js",
                    "--js", libdir+"vorple.min.js"
                    ] )
    subprocess.call( minifiercommand )

    print " - without engine..."
    minifiercommand = [
                      "/usr/bin/java", 
                      "-jar", minifierdir+"compiler.jar", 
                      "--compilation_level=SIMPLE_OPTIMIZATIONS",
                      "--warning_level", "QUIET",
                      "--js_output_file", libdir+"vorple.vanilla.min.js" ]
    minifiercommand.extend( libraryArguments )
    minifiercommand.extend( [
                      "--js", libdir+"vorple.min.js"
                      ] )
    subprocess.call( minifiercommand )

    print " - 3rd party libraries only..."
    minifiercommand = [
                    "/usr/bin/java",
                    "-jar", minifierdir+"compiler.jar",
                    "--compilation_level=SIMPLE_OPTIMIZATIONS",
                    "--warning_level", "QUIET",
                    "--js_output_file", libdir+"3rdparty-bundle.min.js",
                    ]
    minifiercommand.extend( libraryArguments )

    subprocess.call( minifiercommand )

# create API

if "api" in arguments.tasks:
    print "Generating the API..."
    
    subprocess.call([ "/usr/bin/java",
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
            subprocess.call([
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
    subprocess.call([
          "zip",
          "-rq",
          destination+"example-stories.zip",
          "stories/undum/",
          "-x", '*.DS_Store*'
        ])
    
    os.chdir( libdir )
    os.chdir( "../" )
    subprocess.call([
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

    shutil.copy( i7templatedir+'(manifest).txt', i7releasedir )
    manifest = open( os.path.join( i7releasedir, '(manifest).txt' ), 'a' )

    for file in templatefiles:
        shutil.copy( file, i7releasedir )
        manifest.write( os.path.basename( file ) + "\n" )
    
    for file in os.listdir( i7releasedir ):
        if not os.path.isdir( os.path.join( i7releasedir, file ) ) and file != '(manifest).txt' and file != '.DS_Store':
            manifest.write( file +"\n" )
                    
    manifest.close()
    
    print "Packaging the I7 interpreter..."
    os.chdir( i7releasedir )
    os.chdir( "../" )
    subprocess.call([
          "zip",
          "-rq",
          destination+"i7-template.zip",
          "Vorple",
          "-x", '*.DS_Store*'
        ])
  
    
# Extracting and compiling examples from the extensions
    
if "i7_examples" in arguments.tasks:
    print "Compiling I7 examples from the extensions..."
    extensionroot = glob( i7extensiondir+"Vorple*" )  #take only stuff that begins with Vorple so that my other extensions aren't included
    extensions = []
    
    extensionstorydir = i7extensiondestination+"stories/"
    
    if os.path.exists( extensionstorydir ):
        shutil.rmtree( extensionstorydir )
    os.makedirs( extensionstorydir )
    
    os.chdir( tmpdir )
    os.mkdir( 'Build' )
    os.mkdir( 'Source' )
    os.mkdir( 'Index' )
    
    shutil.copy( i7extensiondestination+"head.html", i7extensiondestination+"list.html" )
    exampleindex = open( i7extensiondestination+"list.html", 'a' )
    
    for extensionsource in extensionroot:
        nifiles = []
        extensionname = os.path.splitext( os.path.basename( extensionsource ) )[0]
        print " - "+os.path.splitext( extensionname )[0] + ": ",
        targetdir = extensionstorydir+extensionname + '/'
        if not os.path.exists( targetdir ):
            os.mkdir( targetdir )
        extension = open( i7extensiondir+extensionname+'.i7x', 'r' )
        examplename = ''
        examplefile = 0
        exampleindex.write( '<h3>'+extensionname+'</h3>\n' )
        for line in extension:
            if re.match( 'Example: \*', line ):
                if examplename is not '':
                    print '-',
                exampleregex = re.match( 'Example: (\**) (.*?)( -(.*))?$', line )
                examplestars = exampleregex.group( 1 )
                examplename = exampleregex.group( 2 )
                exampledesc = exampleregex.group( 4 )
                print examplename,
                nifiles.append( targetdir + examplename )
                examplefile = open( targetdir + examplename + '.ni', 'w' )
                exampleindex.write( "<h4>"+examplename+"</h4>\n" )
                exampleindex.write( '<div class="blurb">'+exampledesc+'</div>\n' )
                exampleindex.write( '<div class="dl_links"><a href="../vorple/doc/inform7/examples/interpreter.html?story=stories/'+extensionname+'/'+examplename+'.z8">play</a> &mdash; <a href="../vorple/doc/inform7/examples/stories/'+extensionname+'/'+examplename+'.ni">view source</a></div>\n' )
            elif examplename and ( re.match( '\t', line ) or line.strip() == '' ):
                examplefile.write( re.sub( '\t(\*: ?)?', '', line, 1 ) )
                if re.match( '\tTest me with ', line ):
                    exampleindex.write( '<div class="testme">Try: <span class="testcommands">'+re.match( '\tTest me with \"(.*)\"', line ).group( 1 )+'</span></div>' )
        print
        if examplefile:
            examplefile.close()
        extension.close()
        
        for ni in nifiles:
            shutil.copy( ni+'.ni', 'Source/story.ni' )
            try:
                p = subprocess.check_output([
                      'ni',
                      "-package",
                      ".",
                      "-rules",
                      i7dir + "Inform7/Extensions",
                      "-extension=z8"
                  ], stderr=subprocess.STDOUT)
            except subprocess.CalledProcessError, e:
                print os.path.basename( ni ) + ': ni compile error'
                print e.output
            else:
                try:
                    p = subprocess.check_output([
                      'inform-6.32-biplatform',
                      'Build/auto.inf',
                      '+"'+i7dir+'Library/6.11/"',
                      '-kE2SDwv8',
                      '-o',
                      ni+'.z8'
                    ], stderr=subprocess.PIPE)
                except subprocess.CalledProcessError, e:
                    print os.path.basename( ni ) + ': Inform 6 compile error'
                    print e.output
                
    shutil.copyfileobj( open( i7extensiondestination+"foot.html",'r'), exampleindex )
    exampleindex.close()
           
            
# Library files modified for the unit test coverage

if "coverage" in arguments.tasks:
    print "Creating library coverage tests..."
    subprocess.call([
          'jscoverage',
          libdir,
          unittestdir+'coverage/'
      ])


# I7 unit test story

if "unittests" in arguments.tasks:
    print "Compiling the I7 unit test story file..."
    os.chdir( tmpdir )
    os.mkdir( 'Build' )
    os.mkdir( 'Source' )
    os.mkdir( 'Index' )
    shutil.copy( unittestdir+'lib/story.ni', 'Source/story.ni' )
    try:
        p = subprocess.check_output([
            'ni',
            "-package",
            ".",
            "-rules",
            i7dir + "Inform7/Extensions",
            "-extension=z8"
        ], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError, e:
        print 'Unit test ni compile error'
        print e.output
    else:
        try:
            p = subprocess.check_output([
                'inform-6.32-biplatform',
                'Build/auto.inf',
                '+"'+i7dir+'Library/6.11/"',
                '-kE2SDwv8',
                '-o',
                unittestdir+'lib/unittest.z8'
            ], stderr=subprocess.PIPE)
        except subprocess.CalledProcessError, e:
            print 'Unit test Inform 6 compile error'
            print e.output
    
# cleanup

#if os.path.exists( tmpdir ):
#    shutil.rmtree( tmpdir )
    
print "Completed in", datetime.now()-startTime

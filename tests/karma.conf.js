// Karma configuration


// base path, that will be used to resolve files and exclude
basePath = '..';


// list of files / patterns to load in the browser
files = [
    QUNIT,
    QUNIT_ADAPTER,
    'lib/3rdparty-bundle.min.js',
    'vendor/parchment.min.js',
    'vendor/undum.js',
    'tests/lib/dummy-undum.js',
    'src/vorple.core.js',
    'src/vorple.*.js',
    'tests/test-setup.js',
    'tests/*.test.js',
    { pattern: 'vendor/parchment/*', watched: false, included: false, served: true },
    { pattern: 'vendor/soundmanager/soundmanager2.swf', watched: false, included: false, served: true },
    { pattern: 'stories/undum/everything/media/**', watched: false, included: false, served: true },
    { pattern: 'tests/lib/qunit-git.css', watched: false, included: false, served: true },
    { pattern: 'tests/lib/unittest.z8', watched: false, included: false, served: true }
];


// list of files to exclude
exclude = [
   '**/.git'
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress', 'coverage'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome', 'Firefox', 'Safari'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;


// Code coverage
preprocessors = {
    'src/vorple.*.js': 'coverage'
};

coverageReporter = {
    type : 'html',
    dir : 'tests/coverage/'
};
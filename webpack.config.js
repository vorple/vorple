const CopyWebpackPlugin = require( "copy-webpack-plugin" );
const webpack = require( "webpack" );
const path = require( "path" );

module.exports = {
    devServer: {
        contentBase: [
            path.join( __dirname, "dist" ),
            path.join( __dirname, "tests" ),
            path.join( __dirname, "library" ),
            path.join( __dirname, "../inform7/tests" )
        ],
        compress: true,
        port: process.env.PORT || 9000
    },
    devtool: "source-map",
    mode: process.env.ENV || "production",
    output: {
        filename: "interpreter/vorple.min.js"
    },
    performance: {
        hints: false    // Interpreter files are big – don't warn about them
    },
    resolve: {
        fallback: { 
            path: require.resolve("path-browserify")
        }
    },
    externals: {
      jquery: "jQuery"  // Webpack tends to include jQuery multiple times, we'll handle it separately
    },
    entry: [
      "jquery/src/jquery",
      "./src/index.js"
    ],
    plugins: [
        new CopyWebpackPlugin(
            {
                patterns: [
                    { from: process.env.NODE_ENV === "unittest" ? "assets/index.test.html" : "assets/index.html", to: "index.html" },
                    { from: "assets/vorple.css", to: "interpreter/" },
                    { from: "src/haven/haven.css", to: "interpreter/" },
                    { from: "node_modules/jquery-powertip/dist/css/jquery.powertip.css", to: "interpreter/" },
                    { from: "node_modules/toastr/build/toastr.css", to: "interpreter/" },
                    { from: "node_modules/vex-js/dist/css/vex.css", to: "interpreter/" },
                    { from: "node_modules/vex-js/dist/css/vex-theme-plain.css", to: "interpreter/" },
                    { from: "vendor/fonts/**/*", to: "interpreter/", globOptions: { ignore: [ "LICENSE.txt" ] } }
                ],
            }
        )
    ]
};
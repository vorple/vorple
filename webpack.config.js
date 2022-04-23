const CopyWebpackPlugin = require( "copy-webpack-plugin" );
const webpack = require( "webpack" );
const path = require( "path" );

module.exports = {
    devServer: {
        static: [
            { directory: path.join( __dirname, "dist" ) },
            { directory: path.join( __dirname, "tests" ) },
            { directory: path.join( __dirname, "library" ) },
            { directory: path.join( __dirname, "../inform7/tests" ) }
        ],
        compress: true,
        port: process.env.PORT || 9000
    },
    devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    output: {
        filename: "interpreter/vorple.min.js"
    },
    performance: {
        hints: false    // Interpreter files are big – don't warn about them
    },
    resolve: {
        extensions: [ ".ts", ".js" ],
        fallback: {
            path: require.resolve( "path-browserify" )
        }
    },
    externals: {
        jquery: "jQuery"  // Webpack tends to include jQuery multiple times, we'll handle it separately
    },
    entry: [
        "jquery/src/jquery",
        "./src/index.ts"
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        // Client-side Buffer shim
        new webpack.ProvidePlugin({
            Buffer: [ "buffer", "Buffer" ]
        }),
        new CopyWebpackPlugin(
            {
                patterns: [
                    { from: process.env.NODE_ENV === "unittest" ? "assets/index.test.html" : "assets/index.html", to: "index.html" },
                    { from: "assets/haven.css", to: "interpreter/" },
                    { from: "assets/vorple.css", to: "interpreter/" },
                    { from: "node_modules/jquery-powertip/dist/css/jquery.powertip.css", to: "interpreter/" },
                    { from: "node_modules/toastr/build/toastr.css", to: "interpreter/" },
                    { from: "node_modules/vex-js/dist/css/vex.css", to: "interpreter/" },
                    { from: "node_modules/vex-js/dist/css/vex-theme-plain.css", to: "interpreter/" },
                    { from: "roboto*", to: "interpreter/", context: "vendor/fonts/roboto" }
                ]
            }
        )
    ]
};

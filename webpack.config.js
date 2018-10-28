const CopyWebpackPlugin = require( "copy-webpack-plugin" );
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
        hints: false    // Git files are big – don't warn about them
    },
    plugins: [
        new CopyWebpackPlugin(
            [
                { from: "assets/index.html", flatten: true },
                { from: "assets/vorple.css", to: "interpreter/", flatten: true },
                { from: "haven/haven.css", to: "interpreter/", flatten: true },
                { from: "Git/build/engine.*", to: "interpreter/", flatten: true },
                { from: "node_modules/jquery-powertip/dist/css/jquery.powertip.css", to: "interpreter/", flatten: true },
                { from: "node_modules/toastr/build/toastr.css", to: "interpreter/", flatten: true },
                { from: "node_modules/vex-js/dist/css/vex.css", to: "interpreter/", flatten: true },
                { from: "node_modules/vex-js/dist/css/vex-theme-plain.css", to: "interpreter/", flatten: true },
                { from: "vendor/fonts/**/*", to: "interpreter/", ignore: "LICENSE.txt", flatten: true }
            ],
        )
    ]
};
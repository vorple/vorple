const CopyWebpackPlugin = require( "copy-webpack-plugin" );
const path = require( "path" );

module.exports = {
    devServer: {
        contentBase: [ path.join( __dirname, "dist" ), path.join( __dirname, "tests" ), path.join( __dirname, "library" ) ],
        compress: true,
        port: process.env.PORT || 9000
    },
    devtool: "source-map",
    mode: process.env.ENV || "production",
    output: {
        filename: "vorple.min.js"
    },
    performance: {
        hints: false    // Git files are big – don't warn about them
    },
    plugins: [
        new CopyWebpackPlugin(
            [
                { from: "assets/**/*", flatten: true },
                { from: "haven/*.css", flatten: true },
                { from: "Git/build/engine.*", flatten: true },
                "vendor/fonts"
            ],
        )
    ]
};
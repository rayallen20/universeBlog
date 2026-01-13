const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = (env, argv) => {
    const isProd = argv.mode === "production"

    return {
        mode: isProd ? "production" : "development",
        entry: { index: "./src/index.js" },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: isProd ? "[name].[contenthash].js" : "[name].bundle.js",
            clean: true,
        },
        devtool: isProd ? false : "source-map",
        devServer: {
            port: 4061,
            compress: true,
            hot: true,
            historyApiFallback: true,
            static: [
                { directory: path.join(__dirname, "assets"), publicPath: "/assets" },
                { directory: path.join(__dirname, "dist") },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "public/index.html"),
                filename: "index.html",
                chunks: ["index"],
            }),
            ...(isProd
                ? [new MiniCssExtractPlugin({ filename: "[name].[contenthash].css" })]
                : []),
        ],
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: { presets: ["@babel/preset-env"] },
                    },
                },
                {
                    test: /\.css$/i,
                    use: [
                        isProd ? MiniCssExtractPlugin.loader : "style-loader",
                        "css-loader",
                    ],
                },
                {
                    test: /\.(otf|ttf|woff2?|eot)$/i,
                    type: "asset/resource",
                    generator: { filename: "fonts/[name][ext]" },
                },
            ],
        },
    }
}

const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    mode: 'development',
    entry: {
        index: "./src/index.js"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].bundle.js",
        // 打包前清理dist目录
        clean: true,
    },
    devtool: 'source-map',
    devServer: {
        port: 4060,
        compress: true,
        hot: true,
        historyApiFallback: true,
        static: [
            {
                directory: path.join(__dirname, 'assets'),
                publicPath: '/assets'
            },
            {
                directory: path.join(__dirname, 'dist')
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "public/index.html"),
            filename: "index.html",
            chunks: ["index"],
        })
    ],
    module: {
        rules: [
            // babel编译器
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
            // css加载器
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ]
    },
}
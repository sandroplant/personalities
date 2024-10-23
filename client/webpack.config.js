"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin")); // For JS minification
const css_minimizer_webpack_plugin_1 = __importDefault(require("css-minimizer-webpack-plugin")); // For CSS minification
require("webpack-dev-server"); // Ensures webpack-dev-server is available
const dotenv_flow_1 = __importDefault(require("dotenv-flow")); // Use dotenv-flow for multiple .env files
// Load environment variables using dotenv-flow
dotenv_flow_1.default.config({ path: path_1.default.resolve(__dirname, '../') }); // Adjust path if necessary
const config = {
    entry: './src/index.tsx',
    output: {
        path: path_1.default.resolve(__dirname, 'dist'),
        filename: 'bundle.[contenthash].js',
        publicPath: '/',
        clean: true,
    },
    mode: process.env.NODE_ENV || 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/i,
                type: 'asset/resource',
            },
        ],
    },
    devServer: {
        static: path_1.default.resolve(__dirname, 'build'),
        compress: true,
        port: 3001,
        historyApiFallback: true,
        hot: true,
        open: true,
        proxy: {
            '/api': 'http://localhost:80',
        },
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
        new html_webpack_plugin_1.default({
            template: './src/index.html',
        }),
        new webpack_1.default.DefinePlugin({
            'process.env': JSON.stringify(process.env), // Pass loaded environment variables to client-side code
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new terser_webpack_plugin_1.default({
                terserOptions: {
                    compress: true,
                    mangle: true, // To reduce JS file size
                },
            }),
            new css_minimizer_webpack_plugin_1.default(), // Minimize CSS
        ],
    },
    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000, // Set entry point size limit (500 KB)
    },
};
exports.default = config;

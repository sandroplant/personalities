import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import dotenv from 'dotenv-webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/index.js', // Entry point for the frontend
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/', // Necessary for webpack-dev-server
    clean: true, // Cleans the output directory before emit
  },
  mode: process.env.NODE_ENV || 'development', // Switch to 'production' for optimized builds
  devtool: 'source-map', // Enable source maps
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i, // Handling CSS
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Handling images
        type: 'asset/resource',
      },
      // Add more loaders as needed
    ],
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000, // Frontend served on 9000
    historyApiFallback: true, // For single-page applications
    open: true, // Automatically open the browser
    proxy: {
      '/auth': 'http://localhost:5001',
      '/profile': 'http://localhost:5001',
      '/messaging': 'http://localhost:5001',
      '/ai': 'http://localhost:5001',
      '/user': 'http://localhost:5001',
      '/upload': 'http://localhost:5001',
      '/test-db': 'http://localhost:5001',
      // Add more API routes as needed
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Resolve these extensions
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Template HTML file
      favicon: false, // Add favicon if available
    }),
    new dotenv(), // Inject environment variables
  ],
};
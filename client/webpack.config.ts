import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin'; // For JS minification
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'; // For CSS minification
import 'webpack-dev-server'; // Ensures webpack-dev-server is available
import dotenvFlow from 'dotenv-flow'; // Use dotenv-flow for multiple .env files

// Load environment variables using dotenv-flow
dotenvFlow.config({ path: path.resolve(__dirname, '../') }); // Adjust path if necessary

const config: webpack.Configuration = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  mode: (process.env.NODE_ENV as 'development' | 'production' | 'none') || 'development',
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
    static: path.resolve(__dirname, 'build'),
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
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env), // Pass loaded environment variables to client-side code
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          mangle: true, // To reduce JS file size
        },
      }),
      new CssMinimizerPlugin(), // Minimize CSS
    ],
  },
  performance: {
    maxAssetSize: 500000, // Set asset size limit (500 KB)
    maxEntrypointSize: 500000, // Set entry point size limit (500 KB)
  },
};

export default config;

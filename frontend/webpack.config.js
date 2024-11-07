// frontend/webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.tsx', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/', // Ensure publicPath is set to '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // Resolve these extensions
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@hooks': path.resolve(__dirname, 'src/hooks/'),
      '@typeDefs': path.resolve(__dirname, 'src/types/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@config': path.resolve(__dirname, 'src/config/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // Handle .ts and .tsx files
        exclude: /node_modules/,
        use: 'ts-loader', // Use ts-loader for TypeScript files
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/, // Handle image files
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'assets/images',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans the dist folder before each build
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'), // Use your index.html as a template
    }),
    // Hot Module Replacement is enabled via devServer.hot: true
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve static files from the public directory
    },
    historyApiFallback: true, // For client-side routing
    port: 3000, // Development server port
    open: true, // Open the browser after the server starts
    hot: true, // Enable Hot Module Replacement
    // Removed 'stats' property
  },
  devtool: 'inline-source-map', // Enable source maps for easier debugging
  mode: 'development', // Set the mode to development
  stats: 'errors-warnings', // ✅ Moved to top level
};

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.tsx'),
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff2?)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
    }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
    static: { directory: path.join(__dirname, 'public') },
    proxy: [
      {
        context: [
          '/auth',
          '/custom_auth',
          '/evaluations',
          '/userprofiles',
          '/questions',
          '/uploads',
          '/spotify_auth',
          '/posts',
          '/messaging',
          '/ai',
          '/api',
          // Add profile endpoints used by the SPA
          '/profile',
        ],
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    ],
  },
};

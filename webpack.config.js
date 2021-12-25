const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
/** @type import('webpack').Configuration */


module.exports = {
  target: 'electron-renderer',
  entry: {
    tour: ['react-hot-loader/patch', './tour/index.jsx'],
    main: [
      'react-hot-loader/patch',
      './app/renderers/startup.js',
      './app/renderers/dialog.js',
      './app/renderers/menu.js',
      './app/index.jsx',
    ],
    preview: ['react-hot-loader/patch', './preview/index.jsx'],
    modal: ['react-hot-loader/patch', './modal/index.jsx'],
    login: ['react-hot-loader/patch', './login/index.jsx'],
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'entrypoint'),
    filename: '[name].prod.js',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@styles': path.resolve(__dirname, 'static', 'css'),
      '@images': [
        path.resolve(__dirname, 'static', 'imgs'),
        path.resolve(__dirname, 'tour', 'imgs')
      ]
    }
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      },
      {
        test: /\.png|\.svg$/,
        type: 'asset/resource'
      },
      {
        test: /\.(css|sass|sacss|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'app', 'app.html'),
      filename: './main.html',
      chunks: ['main']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'tour', 'tour.html'),
      filename: './tour.html',
      chunks: ['tour']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'preview', 'preview.html'),
      filename: './preview.html',
      chunks: ['preview']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'modal', 'modal.html'),
      filename: './modal.html',
      chunks: ['modal']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'login', 'login.html'),
      filename: './login.html',
      chunks: ['login']
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new CleanWebpackPlugin(),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin(),
    ]
  }
}

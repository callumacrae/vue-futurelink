var path = require('path');
var webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
  entry: './src/Futurelink.vue',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'futurelink.min.js',
    library: 'futurelink',
    libraryTarget: 'umd',
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: '#source-map',
  optimization: {
    minimize: 'production'.includes(process.env.NODE_ENV)
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};
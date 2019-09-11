const nodeExternals = require('webpack-node-externals');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const isDev = process.env.NODE_ENV !== 'production';
const isDebugging = isDev && /inspect|debug/.test(process.execArgv.join());

// By default, just output a separate source map.
let devtool = 'hidden-source-map';

// To get debugging (mostly) working, devtool must inline the source map.
if (isDebugging) {
  devtool = 'inline-cheap-module-source-map';
}
// To get coverage working, any tests ran (while not debugging) should be set
// to "eval" so the proper mappings happen with the original source.
else if (isDev) {
  devtool = 'eval';
}

module.exports = {
  devtool,
  entry: './src/Futurelink.vue',
  externals: [nodeExternals()],
  mode: isDev ? 'development': 'production',
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
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        extractComments: false,
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'futurelink.min.js',
    library: 'futurelink',
    libraryTarget: 'umd',
  },
  plugins: [
    new VueLoaderPlugin()
  ],
};

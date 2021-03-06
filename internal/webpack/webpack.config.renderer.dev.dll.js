const { DllPlugin, EnvironmentPlugin, LoaderOptionsPlugin } = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');

const baseConfig = require('./webpack.config.base');
const { dependencies } = require('../../package.json');
const { dllPath, srcPath } = require('../utils/paths');
const isNodeEnv = require('../utils/isNodeEnv');
const rendererDevModule = require('../utils/rendererDevModule');

isNodeEnv('development');

module.exports = merge(baseConfig, {
  devtool: 'eval',

  mode: 'development',

  target: 'electron-renderer',

  externals: ['fsevents', 'crypto-browserify'],

  module: rendererDevModule,

  entry: {
    renderer: Object.keys(dependencies),
  },

  output: {
    path: dllPath,
    filename: '[name].dll.js',
    library: {
      name: 'renderer',
      type: 'var',
    },
  },

  plugins: [
    new DllPlugin({
      path: path.join(dllPath, '[name].json'),
      name: '[name]',
    }),

    new EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new LoaderOptionsPlugin({
      debug: true,
      options: {
        context: srcPath,
        output: {
          path: dllPath,
        },
      },
    }),
  ],
});

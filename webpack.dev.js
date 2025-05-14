const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const fs = require('fs');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    // HTTPS dinonaktifkan secara default, tapi bisa diaktifkan dengan --https flag
    // https: true,
    host: '0.0.0.0', // Mengizinkan akses dari perangkat lain di jaringan yang sama
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Feature-Policy': "camera 'self'",
      'Permissions-Policy': "camera=(self), microphone=(self)",
    },
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
  },
});

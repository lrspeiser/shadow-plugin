const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [
          /node_modules/,
          /__mocks__/,
          /\.test\.ts$/,
          /\.spec\.ts$/,
          /UnitTests/,
          /src\/test\//
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true // Faster compilation, skip type checking
            }
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log"
  }
};


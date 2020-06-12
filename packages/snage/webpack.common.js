const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
    entry: './src/index.ts',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'build/npm'),
        filename: 'snage.js',
    },
    node: {
        __dirname: false,
    },
    plugins: [
        new CopyWebpackPlugin([{from: '../ui/build', to: 'ui'}]),
        new webpack.BannerPlugin({banner: '#!/usr/bin/env node', raw: true}),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                noEmit: false,
                            },
                        },
                    },
                ],
            },
        ],
    },
};

module.exports = config;

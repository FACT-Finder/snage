const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = {
    ...common,
    plugins: [...common.plugins, new webpack.DefinePlugin({'process.env.BUILD_VERSION': `'${process.env.BUILD_VERSION || 'unknown'}'`})],
    mode: 'production',
};

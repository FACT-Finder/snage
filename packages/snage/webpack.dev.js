const common = require('./webpack.common.js');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    ...common,
    plugins: [...common.plugins, new WebpackShellPlugin({onBuildEnd: ['nodemon build/npm/snage.js serve --watch build/npm']})],
    mode: 'development',
};

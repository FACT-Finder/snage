const common = require('./webpack.common.js');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    ...common,
    plugins: [...common.plugins, new WebpackShellPlugin({onBuildEnd: ['nodemon build/snage.js serve --watch build']})],
    mode: 'development',
};

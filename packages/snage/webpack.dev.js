const common = require('./webpack.common.js');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    ...common,
    plugins: [...common.plugins, new WebpackShellPlugin({onBuildEnd: ['nodemon build/server.js --watch build']})],
    mode: 'development',
};

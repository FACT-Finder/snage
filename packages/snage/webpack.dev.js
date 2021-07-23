const common = require('./webpack.common.js');
const WebpackShellPlugin = require('webpack-shell-plugin-next');

module.exports = {
    ...common,
    plugins: [
        ...common.plugins,
        new WebpackShellPlugin({
            onBuildEnd: {scripts: ['nodemon build/npm/snage.js serve --watch build/npm'], blocking: true},
        }),
    ],
    mode: 'development',
};

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');

module.exports = (env) => {
    const plugins = [];
    env = env || {};
    if (env.report) {
        plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
            generateStatsFile: true,
            reportFilename: path.join(__dirname, 'report', 'report.html'),
            statsFilename: path.join(__dirname, 'report', 'stats.json'),
        }));
    }
    return merge(common, {
        watch: false,
        mode: 'production',
        devtool: 'hidden-source-map',
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    cache: true,
                    terserOptions: {
                        mangle: true,
                        output: {
                            comments: false
                        }
                    },
                    sourceMap: true
                })
            ]
        },
        plugins: plugins,
        output: {
            sourceMapFilename: path.relative(path.join(__dirname, 'dist'), "sourceMap/[file].map")
        }
    });
}
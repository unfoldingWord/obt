const webpack = require('webpack');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  babel: {
    plugins: [
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
    ],
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...(webpackConfig.resolve?.fallback || {}),
          buffer: require.resolve('buffer/'),
          path: require.resolve('path-browserify'),
          process: require.resolve('process/browser.js'),
        },
      };

      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          process: require.resolve('process/browser.js'),
          Buffer: ['buffer', 'Buffer'],
        }),
      ];

      // Keep existing optimization config
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          cacheGroups: {
            'vendor-mui': {
              name: 'vendor-mui',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              chunks: 'initial',
              priority: 2,
            },
            'vendor-react': {
              name: 'vendor-sr-rcl',
              test: /[\\/]node_modules[\\/]@texttree\/scripture-resources-rcl[\\/]/,
              chunks: 'initial',
              priority: 3,
            },
            'vendor-all': {
              name: 'vendor-all',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'initial',
              priority: 1,
            },
          },
          // Keep initial chunks under CRA's Workbox precache warning threshold (5 MB).
          maxSize: 4900000,
        },
        runtimeChunk: {
          name: 'manifest',
        },
      };

      webpackConfig.plugins = webpackConfig.plugins.map((plugin) => {
        if (plugin instanceof WorkboxWebpackPlugin.InjectManifest) {
          return new WorkboxWebpackPlugin.InjectManifest({
            ...plugin.config,
            maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          });
        }

        if (plugin instanceof WorkboxWebpackPlugin.GenerateSW) {
          return new WorkboxWebpackPlugin.GenerateSW({
            ...plugin.config,
            maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          });
        }

        return plugin;
      });

      return webpackConfig;
    },
  },
};

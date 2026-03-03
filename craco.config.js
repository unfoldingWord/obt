const path = require('path');
const cracoBabelLoader = require('craco-babel-loader');

module.exports = {
  babel: {
    plugins: [
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
    ],
  },
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: [
          path.resolve(__dirname, 'node_modules/@mui'),
        ],
      },
    },
  ],
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...(webpackConfig.resolve?.fallback || {}),
          buffer: require.resolve('buffer/'),
          path: require.resolve('path-browserify'),
        },
      };

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

      return webpackConfig;
    },
  },
};

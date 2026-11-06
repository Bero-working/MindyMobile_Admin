const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      // Yjs only needs getRandomValues, already installed at src/index.tsx.
      // lib0's native entry otherwise requires an additional crypto implementation.
      if (moduleName === 'lib0/webcrypto') {
        return {
          type: 'sourceFile',
          filePath: path.join(
            path.dirname(require.resolve('lib0/package.json')),
            'dist/webcrypto.cjs'
          ),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
    assetExts: assetExts.filter((extension) => extension !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
    babelTransformerPath:
      require.resolve('react-native-svg-transformer/react-native'),
    unstable_allowRequireContext: true,
  },
};

module.exports = withNativeWind(mergeConfig(defaultConfig, config), {
  input: './src/global.css',
});

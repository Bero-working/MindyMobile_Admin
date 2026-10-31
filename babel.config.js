module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
          '@components': './src/components',
          '@modules': './src/modules',
          '@services': './src/services',
          '@utils': './src/utils',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        root: ['./src'],
      },
    ],
    // Jest executes CommonJS in a VM; Metro handles import() on native builds.
    ...(process.env.NODE_ENV === 'test'
      ? ['@babel/plugin-transform-dynamic-import']
      : []),
    'react-native-reanimated/plugin', // needs to be last
  ],
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
};

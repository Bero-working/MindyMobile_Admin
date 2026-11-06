module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/__mocks__'],
  watchman: false,
  moduleNameMapper: {
    '^lib0/webcrypto$': require('node:path').join(
      require('node:path').dirname(require.resolve('lib0/package.json')),
      'dist/webcrypto.cjs'
    ),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./jest.ui-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-calendars|react-native-swipe-gestures|react-native-safe-area-context|react-native-keyboard-controller|react-native-reanimated|@rn-primitives|@react-native|@react-navigation|@sohantalukder/rn-kit|react-native-css-interop|nativewind)/)',
  ],
};

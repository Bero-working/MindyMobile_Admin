module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/__mocks__'],
  watchman: false,
  moduleNameMapper: {
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
    'node_modules/(?!(react-native|react-native-safe-area-context|react-native-keyboard-controller|react-native-reanimated|@rn-primitives|@react-native|@react-navigation|@sohantalukder/rn-kit|react-native-css-interop|nativewind)/)',
  ],
};

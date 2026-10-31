/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');

  Reanimated.default.call = () => {};

  return { ...Reanimated, useReducedMotion: () => false };
});

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-mmkv', () => {
  class MMKV {
    store = new Map();

    set(key, value) {
      this.store.set(key, String(value));
    }

    getString(key) {
      return this.store.get(key);
    }

    delete(key) {
      this.store.delete(key);
    }

    clearAll() {
      this.store.clear();
    }
  }

  return { MMKV };
});

jest.mock('react-native-device-info', () => ({
  getApplicationName: jest.fn(() => 'MindyMobile_Admin'),
  getBuildNumber: jest.fn(() => '1'),
  getBundleId: jest.fn(() => 'com.mindymobile_admin'),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '17.0'),
  getVersion: jest.fn(() => '1.0.0'),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
}));

jest.mock('react-native-config', () => ({
  APP_ENV: 'development',
  API_URL: '',
  DEBUG_MODE: 'true',
}));

jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest')
);

jest.mock('@react-native-community/blur', () => {
  const { View } = jest.requireActual('react-native');

  return { BlurView: View };
});

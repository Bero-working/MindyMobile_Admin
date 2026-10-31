import * as Keychain from 'react-native-keychain';
import { secureStorage } from '@/services/storage/secureStorage';

jest.mock('react-native-keychain', () => ({
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'deviceOnly' },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const set = jest.mocked(Keychain.setGenericPassword);
const get = jest.mocked(Keychain.getGenericPassword);
const remove = jest.mocked(Keychain.resetGenericPassword);

beforeEach(() => jest.resetAllMocks());

test('isolates keys, uses device-only accessibility and returns native values', async () => {
  set.mockResolvedValue({
    service: 'test',
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });
  get.mockResolvedValue({
    username: 'mindy',
    password: 'secret',
    service: 'test',
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });
  await secureStorage.setItem('session', 'secret');
  await secureStorage.setItem('other', 'other-secret');
  expect(set.mock.calls.map((call) => call[2])).toEqual([
    {
      service: 'com.mindymobile_admin.secure.session',
      accessible: 'deviceOnly',
    },
    { service: 'com.mindymobile_admin.secure.other', accessible: 'deviceOnly' },
  ]);
  expect(await secureStorage.getItem('session')).toBe('secret');
  expect(get).toHaveBeenCalledWith({
    service: 'com.mindymobile_admin.secure.session',
  });
  remove.mockResolvedValue(true);
  await secureStorage.removeItem('session');
  expect(remove).toHaveBeenCalledWith({
    service: 'com.mindymobile_admin.secure.session',
  });
  get.mockResolvedValue(false);
  expect(await secureStorage.getItem('session')).toBeNull();
});

test('rejects empty keys, false writes and native failures without hiding errors', async () => {
  await expect(secureStorage.setItem(' ', 'secret')).rejects.toThrow('key');
  expect(set).not.toHaveBeenCalled();
  set.mockResolvedValue(false);
  await expect(secureStorage.setItem('session', 'secret')).rejects.toThrow(
    'write failed'
  );
  const error = new Error('native unavailable');
  set.mockRejectedValue(error);
  get.mockRejectedValue(error);
  remove.mockRejectedValue(error);
  await expect(secureStorage.setItem('session', 'secret')).rejects.toBe(error);
  await expect(secureStorage.getItem('session')).rejects.toBe(error);
  await expect(secureStorage.removeItem('session')).rejects.toBe(error);
});

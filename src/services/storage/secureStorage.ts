import * as Keychain from 'react-native-keychain';

const serviceFor = (key: string) => {
  if (!key.trim()) throw new Error('Secure storage key must not be empty.');
  return `com.mindymobile_admin.secure.${key}`;
};

// Native errors propagate to the caller. Never fall back to plaintext storage.
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const result = await Keychain.setGenericPassword('mindy', value, {
      service: serviceFor(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!result) throw new Error('Secure storage write failed.');
  },

  async getItem(key: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({
      service: serviceFor(key),
    });
    return result ? result.password : null;
  },

  async removeItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: serviceFor(key) });
  },
};

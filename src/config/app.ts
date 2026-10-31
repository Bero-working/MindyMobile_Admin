export const appConfig = {
  name: 'Mindy Mobile',
  version: '1.0.0',
  bundleId: 'com.mindymobile_admin',
  features: {
    biometricAuth: false,
    pushNotifications: false,
  },
  api: {
    timeout: 10000,
    retries: 0,
  },
} as const;

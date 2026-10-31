import { createMockAuthService } from '@/modules/auth/services/mockAuthService';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  AuthApp,
  type AuthService,
  type SessionResult,
  type AuthUser,
} from '@/modules/auth';
import { MindyThemeProvider } from '@/components/ui/theme';
import i18n from '@/translations';
import localStore from '@/services/storage/localStore.service';
import { Appearance, Modal, StyleSheet } from 'react-native';

// RN's preset replaces this hook with a constant; exercise its real subscription.
jest.unmock('react-native/Libraries/Utilities/useColorScheme');

const user: AuthUser = {
  email: 'linh@mindy.vn',
  displayName: 'Trần Thị Linh',
  role: 'MENTOR',
};
const service = (
  session: SessionResult = { kind: 'signedOut' }
): jest.Mocked<AuthService> => ({
  restore: jest.fn().mockResolvedValue(session),
  login: jest.fn().mockResolvedValue({ kind: 'user', user }),
  logout: jest.fn().mockResolvedValue({ kind: 'ok' }),
});
const open = (auth: AuthService) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 892 },
        insets: { top: 24, left: 0, right: 0, bottom: 24 },
      }}
    >
      <MindyThemeProvider>
        <AuthApp
          service={auth}
          cache={cache}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
  return cache;
};
const submit = async () => {
  await screen.findByTestId('login-screen');
  fireEvent.changeText(
    screen.getByTestId('login-email-input'),
    '  linh@mindy.vn  '
  );
  fireEvent.changeText(screen.getByTestId('login-password-input'), ' p@ss ');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-submit-button'));
  });
};
beforeEach(async () => {
  jest.restoreAllMocks();
  localStore.clearAll();
  await i18n.changeLanguage('vi');
});

test('TC-P0-S4-10 locks sheet cancel, scrim and back while logging out exactly once', async () => {
  const auth = service({ kind: 'user', user });
  let finish: (result: { kind: 'ok' }) => void = () => {};
  auth.logout.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  open(auth);
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-cancel'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-scrim'));
  });
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(auth.logout).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('logout-sheet')).toBeTruthy();
  await act(async () => {
    finish({ kind: 'ok' });
  });
  await screen.findByTestId('login-screen');
});

test.each([
  { all: false, language: 'vi', title: 'Đăng xuất?' },
  { all: true, language: 'en', title: 'Sign out everywhere?' },
])(
  'logout dialog identifies the account and scope before confirming ($language, all=$all)',
  async ({ all, language, title }) => {
    await i18n.changeLanguage(language);
    const auth = service({ kind: 'user', user });
    open(auth);
    await screen.findByTestId('workspace-account-button');
    fireEvent.press(screen.getByTestId('workspace-account-button'));
    await screen.findByTestId('profile-screen');
    fireEvent.press(
      screen.getByTestId(all ? 'profile-logout-all-row' : 'profile-logout-row')
    );
    const dialog = within(screen.getByTestId('logout-sheet'));
    expect(dialog.getByText(title)).toBeTruthy();
    expect(dialog.getByText(new RegExp(user.email))).toBeTruthy();
    expect(screen.queryByTestId('logout-sheet-handle')).toBeNull();
    expect(auth.logout).not.toHaveBeenCalled();
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    await waitFor(() =>
      expect(screen.queryByTestId('logout-sheet')).toBeNull()
    );
    expect(screen.getByTestId('profile-screen')).toBeTruthy();
    expect(auth.logout).not.toHaveBeenCalled();
  }
);

test.each(['MENTOR', 'MANAGER', 'INVALID_ROLE', '', 'mentor'])(
  'TC-P0-S2-12–15 routes login role %s and clears the previous root',
  async (role) => {
    const auth = service();
    auth.login.mockResolvedValue({ kind: 'user', user: { ...user, role } });
    open(auth);
    await submit();
    const allowed = role === 'MENTOR' || role === 'MANAGER';
    await screen.findByTestId(
      allowed ? `workspace-${role.toLowerCase()}-root` : 'denied-screen'
    );
    expect(screen.queryByTestId('login-screen')).toBeNull();
    expect(screen.queryByTestId('toast') !== null).toBe(allowed);
  }
);

test.each([false, true])(
  'TC-P0-S4-11/12 expired logout clears private cache (all=%s)',
  async (all) => {
    const auth = service({ kind: 'user', user });
    auth.logout.mockResolvedValue({ kind: 'expired' });
    const cache = open(auth);
    cache.setQueryData(['private'], user);
    await screen.findByTestId('workspace-account-button');
    await act(async () => {
      fireEvent.press(screen.getByTestId('workspace-account-button'));
    });
    await screen.findByTestId('profile-screen');
    await act(async () => {
      fireEvent.press(
        screen.getByTestId(
          all ? 'profile-logout-all-row' : 'profile-logout-row'
        )
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
    });
    await screen.findByTestId('login-screen');
    expect(cache.getQueryCache().getAll()).toHaveLength(0);
    expect(auth.logout).toHaveBeenCalledWith(all);
    expect(screen.queryByText(user.email)).toBeNull();
  }
);

test('TC-P0-S4-14 server logout error hides support code and leaves the account in place', async () => {
  const auth = service({ kind: 'user', user });
  auth.logout.mockResolvedValue({
    kind: 'error',
    error: { code: 'server', requestId: 'req-5' },
  });
  open(auth);
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await screen.findByTestId('logout-sheet-error');
  expect(screen.queryByText('Mã hỗ trợ: req-5')).toBeNull();
  expect(screen.getByTestId('profile-screen')).toBeTruthy();
});

test('TC-P0-S4-16 user B never sees A after logout and login', async () => {
  const auth = service({ kind: 'user', user });
  const second = {
    email: 'manager@mindy.vn',
    displayName: 'Nguyễn Minh An',
    role: 'MANAGER',
  };
  auth.login.mockResolvedValue({ kind: 'user', user: second });
  open(auth);
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await submit();
  await screen.findByTestId('workspace-manager-root');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  expect(screen.getByTestId('profile-email').props.children).toBe(second.email);
  expect(screen.queryByText(user.email)).toBeNull();
  expect(screen.queryByText(user.displayName)).toBeNull();
});

test('TC-P0-S4-17 back returns to the same workspace without rechecking session', async () => {
  const auth = service({ kind: 'user', user });
  open(auth);
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-back-button'));
  });
  await screen.findByTestId('workspace-mentor-root');
  expect(screen.queryByTestId('profile-screen')).toBeNull();
  expect(auth.restore).toHaveBeenCalledTimes(1);
});

test('TC-P0-S4-05/08 keeps preferences across a new app mount without keeping user data', async () => {
  open(service({ kind: 'user', user }));
  await screen.findByTestId('workspace-settings-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-settings-button'));
  });
  await screen.findByTestId('settings-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-language-en'));
  });
  await screen.findByText('APPEARANCE');
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-theme-dark'));
  });
  screen.unmount();
  open(service());
  await screen.findByTestId('login-screen');
  expect(screen.getAllByText('Sign in')).toHaveLength(2);
  expect(screen.getByTestId('login-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
  expect(screen.getByTestId('login-email-input').props.value).toBe('');
});

test('preferences still apply if persistence throws', async () => {
  jest.spyOn(localStore, 'setSystemLanguage').mockImplementation(() => {
    throw new Error('storage unavailable');
  });
  jest.spyOn(localStore, 'setTheme').mockImplementation(() => {
    throw new Error('storage unavailable');
  });
  open(service({ kind: 'user', user }));
  await screen.findByTestId('workspace-settings-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-settings-button'));
  });
  await screen.findByTestId('settings-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-language-en'));
  });
  await screen.findByText('APPEARANCE');
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-theme-dark'));
  });
  expect(
    screen.getByTestId('settings-theme-dark').props.accessibilityState.checked
  ).toBe(true);
  expect(screen.getByTestId('settings-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
});

test('TC-P0-S2-23 validation is translated with the dark palette', async () => {
  await i18n.changeLanguage('en');
  localStore.setTheme('dark');
  const auth = service();
  open(auth);
  await screen.findByTestId('login-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-submit-button'));
  });
  expect(screen.getByText('Enter your email')).toBeTruthy();
  expect(screen.getByText('Enter your password')).toBeTruthy();
  expect(screen.getByTestId('login-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
  expect(auth.login).not.toHaveBeenCalled();
});

test('TC-P0-S1-17 retry locks duplicates and TC-P0-S1-18 unlocks after another failure', async () => {
  const auth = service({ kind: 'error', error: { code: 'offline' } });
  open(auth);
  await screen.findByTestId('bootstrap-retry-button');
  let finish: (value: SessionResult) => void = () => {};
  auth.restore.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('bootstrap-retry-button'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('bootstrap-retry-button'));
  });
  expect(auth.restore).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Đang thử lại…')).toBeTruthy();
  await act(async () => {
    finish({ kind: 'error', error: { code: 'offline' } });
  });
  expect(screen.getByText('Thử lại')).toBeTruthy();
});

test('TC-P0-S3-05 denied logout is single-flight', async () => {
  const auth = service({
    kind: 'user',
    user: { ...user, role: 'INVALID_ROLE' },
  });
  let finish: (value: { kind: 'ok' }) => void = () => {};
  auth.logout.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  open(auth);
  await screen.findByTestId('denied-logout-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('denied-logout-button'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('denied-logout-button'));
  });
  expect(auth.logout).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Đang đăng xuất…')).toBeTruthy();
  await act(async () => {
    finish({ kind: 'ok' });
  });
  await screen.findByTestId('login-screen');
  expect(screen.queryByTestId('toast')).toBeNull();
});

test('gradient primitives render without SVG warnings', async () => {
  const warn = jest.spyOn(console, 'warn');
  open(service());
  await screen.findByTestId('login-screen');
  expect(warn).not.toHaveBeenCalled();
});

test('TC-P0-S4-18 dark manager settings use translated role and danger confirmation', async () => {
  await i18n.changeLanguage('en');
  localStore.setTheme('dark');
  open(service({ kind: 'user', user: { ...user, role: 'MANAGER' } }));
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  expect(screen.getByText('Manager')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-all-row'));
  });
  const button = screen.getByTestId('logout-sheet-confirm');
  const stateStyle =
    typeof button.props.style === 'function'
      ? button.props.style({ pressed: false })
      : button.props.style;
  expect(StyleSheet.flatten(stateStyle).backgroundColor).toBe('#b0472e');
});

test.each(['vi', 'en'])(
  'TC-P0-S1-01/02 checking starts at 600ms in %s',
  async (language) => {
    await i18n.changeLanguage(language);
    jest.useFakeTimers();
    try {
      const auth = service();
      auth.restore.mockImplementation(() => new Promise(() => {}));
      open(auth);
      act(() => {
        jest.advanceTimersByTime(599);
      });
      expect(screen.queryByTestId('bootstrap-checking')).toBeNull();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(
        screen.getByText(
          language === 'vi'
            ? 'Đang kiểm tra phiên đăng nhập…'
            : 'Checking your session…'
        )
      ).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  }
);

test('TC-P0-S1-03 and TC-P0-S2-01 signed-out session opens a blank login without unsupported actions', async () => {
  const auth = service();
  open(auth);
  await screen.findByTestId('login-screen');
  expect(screen.queryByTestId('login-alert')).toBeNull();
  expect(screen.getByTestId('login-email-input').props.value).toBe('');
  expect(screen.getByTestId('login-password-input').props.value).toBe('');
  expect(
    screen.getByTestId('login-submit-button').props.accessibilityState.disabled
  ).toBe(false);
  expect(screen.queryByText(/Google|Ghi nhớ đăng nhập|Remember me/)).toBeNull();
  expect(auth.login).not.toHaveBeenCalled();
});

test.each(['MANAGER', 'offline'])(
  'TC-P0-S1-06/07 ignores a cached Mentor when current verification returns %s',
  async (outcome) => {
    const auth = service(
      outcome === 'offline'
        ? { kind: 'error', error: { code: 'offline' } }
        : { kind: 'user', user: { ...user, role: 'MANAGER' } }
    );
    const cache = open(auth);
    cache.setQueryData(['old-user'], user);
    await screen.findByTestId(
      outcome === 'offline' ? 'bootstrap-error-card' : 'workspace-manager-root'
    );
    expect(screen.queryByTestId('workspace-mentor-root')).toBeNull();
  }
);

test('TC-P0-S1-12 inactive clears private memory and shows the correct notice', async () => {
  const cache = open(service({ kind: 'signedOut', notice: 'accountInactive' }));
  cache.setQueryData(['old-user'], user);
  await screen.findByText(
    'Tài khoản không còn hoạt động. Liên hệ trung tâm nếu cần hỗ trợ.'
  );
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
  expect(screen.getByTestId('login-email-input').props.value).toBe('');
});

test('TC-P0-S1-19 dark English offline error stays outside all workspaces', async () => {
  await i18n.changeLanguage('en');
  localStore.setTheme('dark');
  open(service({ kind: 'error', error: { code: 'offline' } }));
  await screen.findByText("You're offline");
  expect(screen.getByTestId('bootstrap-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
  expect(screen.queryByTestId('workspace-manager-root')).toBeNull();
  expect(screen.queryByTestId('workspace-mentor-root')).toBeNull();
});

test('TC-P0-S2-16 toggle changes accessibility label twice without editing password', async () => {
  open(service());
  await screen.findByTestId('login-screen');
  fireEvent.changeText(screen.getByTestId('login-password-input'), 'secret');
  expect(
    screen.getByTestId('login-password-toggle').props.accessibilityLabel
  ).toBe('Hiện mật khẩu');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-password-toggle'));
  });
  expect(
    screen.getByTestId('login-password-toggle').props.accessibilityLabel
  ).toBe('Ẩn mật khẩu');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-password-toggle'));
  });
  expect(screen.getByTestId('login-password-input').props.secureTextEntry).toBe(
    true
  );
  expect(screen.getByTestId('login-password-input').props.value).toBe('secret');
});

test('TC-P0-S2-18 submitting dismisses expired notice even when validation fails', async () => {
  open(service({ kind: 'signedOut', notice: 'sessionExpired' }));
  await screen.findByTestId('login-alert');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-submit-button'));
  });
  expect(screen.queryByTestId('login-alert')).toBeNull();
  expect(screen.getByTestId('login-email-error')).toBeTruthy();
});

test('TC-P0-S2-21 keyboard password submit uses the same validation and login boundary', async () => {
  const auth = service();
  open(auth);
  await screen.findByTestId('login-screen');
  fireEvent.changeText(
    screen.getByTestId('login-email-input'),
    'mentor@mindy.vn'
  );
  fireEvent.changeText(screen.getByTestId('login-password-input'), 'x');
  await act(async () => {
    fireEvent(screen.getByTestId('login-password-input'), 'submitEditing');
  });
  expect(auth.login).toHaveBeenCalledWith({
    email: 'mentor@mindy.vn',
    password: 'x',
  });
  await screen.findByTestId('workspace-mentor-root');
});

test('TC-P0-S3-04 and 11 hide profile information and translate denied dark mode', async () => {
  await i18n.changeLanguage('en');
  localStore.setTheme('dark');
  const restrictedUser = { ...user, role: 'INVALID_ROLE', phone: '0900123456' };
  open(service({ kind: 'user', user: restrictedUser }));
  await screen.findByTestId('denied-title');
  expect(screen.queryByTestId('denied-role-chip')).toBeNull();
  expect(screen.queryByText(restrictedUser.phone)).toBeNull();
  expect(screen.queryByText(restrictedUser.displayName)).toBeNull();
  expect(screen.getByTestId('denied-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
});

test('TC-P0-S4-03 default settings use Vietnamese/system and omit app version', async () => {
  open(service({ kind: 'user', user }));
  await screen.findByTestId('workspace-settings-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-settings-button'));
  });
  await screen.findByTestId('settings-screen');
  expect(screen.getByText('Tiếng Việt')).toBeTruthy();
  expect(screen.getByTestId('settings-language-vi')).toHaveStyle({
    flexDirection: 'row',
    minHeight: 56,
  });
  expect(
    screen.getByTestId('settings-language-vi').props.accessibilityState.checked
  ).toBe(true);
  expect(
    screen.getByTestId('settings-theme-system').props.accessibilityState.checked
  ).toBe(true);
  expect(screen.queryByTestId('settings-version')).toBeNull();
});

test('TC-P0-S4-07 system color changes apply without navigating away', async () => {
  const listeners = new Set<
    (event: { colorScheme: 'light' | 'dark' }) => void
  >();
  const current = jest
    .spyOn(Appearance, 'getColorScheme')
    .mockReturnValue('light');
  jest.spyOn(Appearance, 'addChangeListener').mockImplementation((listener) => {
    listeners.add(listener);
    return {
      remove: () => {
        listeners.delete(listener);
      },
    };
  });
  open(service({ kind: 'user', user }));
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  expect(screen.getByTestId('profile-screen')).toHaveStyle({
    backgroundColor: '#f6f5f2',
  });
  act(() => {
    current.mockReturnValue('dark');
    listeners.forEach((listener) => listener({ colorScheme: 'dark' }));
  });
  expect(screen.getByTestId('profile-screen')).toHaveStyle({
    backgroundColor: '#101615',
  });
});

test('S1 delays checking indicator and never opens a cached workspace offline', async () => {
  jest.useFakeTimers();
  const auth = service();
  let finish: (value: SessionResult) => void = () => {};
  auth.restore.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  open(auth);
  expect(screen.queryByTestId('bootstrap-checking')).toBeNull();
  act(() => {
    jest.advanceTimersByTime(600);
  });
  expect(screen.getByTestId('bootstrap-checking')).toBeTruthy();
  await act(async () => {
    finish({ kind: 'error', error: { code: 'offline' } });
  });
  expect(screen.getByTestId('bootstrap-error-card')).toBeTruthy();
  expect(screen.queryByTestId('workspace-mentor-root')).toBeNull();
  jest.useRealTimers();
});

test.each(['MENTOR', 'MANAGER', 'INVALID_ROLE', '', 'mentor'])(
  'S1 routes verified %s safely',
  async (role) => {
    open(service({ kind: 'user', user: { ...user, role } }));
    const target =
      role === 'MENTOR'
        ? 'workspace-mentor-root'
        : role === 'MANAGER'
          ? 'workspace-manager-root'
          : 'denied-screen';
    await screen.findByTestId(target);
    expect(screen.queryByTestId('bootstrap-screen')).toBeNull();
    expect(screen.queryByTestId('login-screen')).toBeNull();
    if (role === 'mentor')
      expect(screen.queryByTestId('denied-role-chip')).toBeNull();
  }
);

test.each(['sessionExpired', 'accountInactive'] as const)(
  'S1 shows %s on login',
  async (notice) => {
    open(service({ kind: 'signedOut', notice }));
    expect(await screen.findByTestId('login-alert')).toBeTruthy();
  }
);

test('S1 config has no retry; offline retries once and clears the root stack', async () => {
  const auth = service({ kind: 'error', error: { code: 'offline' } });
  open(auth);
  await screen.findByTestId('bootstrap-retry-button');
  auth.restore.mockResolvedValueOnce({ kind: 'user', user });
  await act(async () => {
    fireEvent.press(screen.getByTestId('bootstrap-retry-button'));
  });
  await screen.findByTestId('workspace-mentor-root');
  expect(auth.restore).toHaveBeenCalledTimes(2);
});

test.each(['config', 'server', 'timeout', 'invalidResponse'] as const)(
  'S1 handles %s errors',
  async (code) => {
    open(service({ kind: 'error', error: { code, requestId: 'req-123' } }));
    await screen.findByTestId('bootstrap-error-card');
    expect(screen.queryByTestId('bootstrap-retry-button') !== null).toBe(
      code !== 'config'
    );
    expect(
      screen.getByTestId('bootstrap-support-code').props.children
    ).toContain('req-123');
  }
);

test('S2 validates on submit and revalidates on typing without sending', async () => {
  const auth = service();
  open(auth);
  await screen.findByTestId('login-screen');
  expect(screen.queryByTestId('login-email-error')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-submit-button'));
  });
  expect(screen.getByText('Nhập email')).toBeTruthy();
  expect(screen.getByText('Nhập mật khẩu')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('login-email-input'), 'invalid');
  expect(screen.getByText('Email không hợp lệ')).toBeTruthy();
  fireEvent.changeText(
    screen.getByTestId('login-email-input'),
    'linh@mindy.vn'
  );
  expect(screen.queryByTestId('login-email-error')).toBeNull();
  expect(auth.login).not.toHaveBeenCalled();
});

test('S2 trims email only, locks duplicate submission and routes success', async () => {
  const auth = service();
  let finish: (value: SessionResult) => void = () => {};
  auth.login.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  open(auth);
  await submit();
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-submit-button'));
  });
  expect(auth.login).toHaveBeenCalledTimes(1);
  expect(auth.login).toHaveBeenCalledWith({
    email: 'linh@mindy.vn',
    password: ' p@ss ',
  });
  expect(screen.getByTestId('login-password-input').props.editable).toBe(false);
  await act(async () => {
    finish({ kind: 'user', user });
  });
  await screen.findByTestId('workspace-mentor-root');
  expect(screen.getByText('Đăng nhập thành công')).toBeTruthy();
});

test.each([
  'invalidCredentials',
  'offline',
  'timeout',
  'server',
  'invalidResponse',
  'config',
] as const)('S2 handles %s and retains the right fields', async (code) => {
  const auth = service();
  auth.login.mockResolvedValue({
    kind: 'error',
    error: { code, requestId: 'req-9' },
  });
  open(auth);
  await submit();
  await screen.findByTestId('login-alert');
  expect(screen.queryByText(/req-9/)).toBeNull();
  expect(screen.getByTestId('login-password-input').props.value).toBe(
    code === 'invalidCredentials' ? '' : ' p@ss '
  );
  expect(screen.getByTestId('login-email-input').props.value).toBe(
    '  linh@mindy.vn  '
  );
  fireEvent.changeText(screen.getByTestId('login-password-input'), 'new');
  expect(screen.queryByTestId('login-alert')).toBeNull();
  expect(screen.getByTestId('login-password-input').props.value).toBe('new');
});

test('S2 toggles password and shows contact-only forgot sheet', async () => {
  const auth = service();
  open(auth);
  await screen.findByTestId('login-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-password-toggle'));
  });
  expect(screen.getByTestId('login-password-input').props.secureTextEntry).toBe(
    false
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('login-forgot-button'));
  });
  expect(screen.getByTestId('forgot-sheet')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('forgot-sheet-ok'));
  });
  expect(screen.queryByTestId('forgot-sheet')).toBeNull();
  expect(auth.login).not.toHaveBeenCalled();
});

test('S3 hides personal details, retains user after failed logout, retries expired session', async () => {
  const auth = service({
    kind: 'user',
    user: { ...user, role: 'INVALID_ROLE' },
  });
  auth.logout.mockResolvedValueOnce({
    kind: 'error',
    error: { code: 'server', requestId: 'req-7' },
  });
  open(auth);
  await screen.findByTestId('denied-screen');
  expect(screen.queryByText(user.displayName)).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('denied-logout-button'));
  });
  await screen.findByTestId('denied-error');
  auth.logout.mockResolvedValueOnce({ kind: 'expired' });
  await act(async () => {
    fireEvent.press(screen.getByTestId('denied-logout-button'));
  });
  await screen.findByTestId('login-screen');
  expect(screen.queryByText(user.email)).toBeNull();
});

test('S4 changes language/theme in place; cancel does not logout; logout-all clears cache', async () => {
  const auth = service({ kind: 'user', user });
  const cache = open(auth);
  cache.setQueryData(['private'], user);
  await screen.findByTestId('workspace-settings-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-settings-button'));
  });
  await screen.findByTestId('settings-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-language-en'));
  });
  await screen.findByText('APPEARANCE');
  expect(screen.getByText('Language set to English')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-theme-dark'));
  });
  expect(localStore.getTheme()).toBe('dark');
  expect(screen.getByTestId('settings-screen')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('settings-back-button'));
  });
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-cancel'));
  });
  expect(auth.logout).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-all-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await screen.findByTestId('login-screen');
  expect(auth.logout).toHaveBeenCalledWith(true);
  expect(cache.getQueryData(['private'])).toBeUndefined();
  expect(screen.getByTestId('login-email-input').props.value).toBe('');
  expect(screen.queryByTestId('profile-screen')).toBeNull();
  expect(localStore.getTheme()).toBe('dark');
  expect(localStore.getSystemLanguage()).toBe('en');
});

test('S4 failed logout stays open and unlocks cancel', async () => {
  const auth = service({ kind: 'user', user });
  auth.logout.mockResolvedValue({ kind: 'error', error: { code: 'offline' } });
  open(auth);
  await screen.findByTestId('workspace-account-button');
  await act(async () => {
    fireEvent.press(screen.getByTestId('workspace-account-button'));
  });
  await screen.findByTestId('profile-screen');
  await act(async () => {
    fireEvent.press(screen.getByTestId('profile-logout-row'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-confirm'));
  });
  await screen.findByTestId('logout-sheet-error');
  await act(async () => {
    fireEvent.press(screen.getByTestId('logout-sheet-cancel'));
  });
  await waitFor(() => expect(screen.queryByTestId('logout-sheet')).toBeNull());
  expect(screen.getByTestId('profile-email')).toBeTruthy();
});

test.each([null, '0912 345 678'])(
  'updated profile shows verified phone or empty copy without fetching again (%s)',
  async (phone) => {
    const auth = service({ kind: 'user', user: { ...user, phone } });
    open(auth);
    await screen.findByTestId('workspace-account-button');
    fireEvent.press(screen.getByTestId('workspace-account-button'));
    await screen.findByTestId('profile-screen');
    expect(screen.getByTestId('profile-info-phone').props.children).toBe(
      phone ?? 'Chưa cập nhật'
    );
    expect(screen.getByTestId('profile-info-email').props.selectable).toBe(
      true
    );
    expect(screen.queryByTestId('settings-language-vi')).toBeNull();
    expect(screen.queryByText('Cơ sở')).toBeNull();
    expect(screen.queryByText('Mã nhân viên')).toBeNull();
    expect(auth.restore).toHaveBeenCalledTimes(1);
    expect(auth.login).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  }
);

test('updated settings stay separate from profile and unchanged preferences do not toast', async () => {
  const auth = service({ kind: 'user', user });
  open(auth);
  await screen.findByTestId('workspace-settings-button');
  fireEvent.press(screen.getByTestId('workspace-settings-button'));
  await screen.findByTestId('settings-screen');
  fireEvent.press(screen.getByTestId('settings-language-vi'));
  fireEvent.press(screen.getByTestId('settings-theme-system'));
  expect(screen.queryByTestId('toast')).toBeNull();
  expect(screen.queryByTestId('profile-email')).toBeNull();
  expect(screen.queryByTestId('profile-logout-row')).toBeNull();
  expect(screen.getByTestId('settings-theme-note').props.children).toBe(
    'Giao diện tự đổi theo cài đặt sáng/tối của thiết bị.'
  );
  fireEvent.press(screen.getByTestId('settings-theme-light'));
  expect(screen.getByText('Đã đổi giao diện: Sáng')).toBeTruthy();
  expect(screen.getByTestId('settings-theme-note').props.children).toBe(
    'Áp dụng cho tất cả màn hình trên thiết bị này.'
  );
  fireEvent.press(screen.getByTestId('settings-back-button'));
  await screen.findByTestId('workspace-account-button');
  fireEvent.press(screen.getByTestId('workspace-account-button'));
  await screen.findByTestId('profile-screen');
  fireEvent.press(screen.getByTestId('profile-back-button'));
  await screen.findByTestId('workspace-mentor-root');
  expect(auth.restore).toHaveBeenCalledTimes(1);
});

test.each(['mentor', 'manager', 'admin', 'student', 'guest'])(
  'mock login only issues Mentor/Manager identities (%s)',
  async (name) => {
    jest.useFakeTimers();
    try {
      const { service: mock } = createMockAuthService();
      const resultPromise = mock.login({
        email: `${name}@mindy.vn`,
        password: 'demo',
      });
      await jest.advanceTimersByTimeAsync(900);
      const result = await resultPromise;
      if (name === 'mentor' || name === 'manager')
        expect(result).toMatchObject({
          kind: 'user',
          user: { role: name.toUpperCase() },
        });
      else
        expect(result).toMatchObject({
          kind: 'error',
          error: { code: 'invalidCredentials' },
        });
    } finally {
      jest.useRealTimers();
    }
  }
);

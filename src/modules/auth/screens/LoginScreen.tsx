import { loginSchema, validateEmail } from '../schemas/login.schema';
import { cn } from '@/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  BrandHeader,
  Button,
  Card,
  CircleIcon,
  Icon,
  Screen,
  Sheet,
  Text,
  ui,
} from '@/components/ui/primitives';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '../hooks/useAuth';
import type { AuthError } from '../types';

export function LoginScreen() {
  const { t } = useTranslation('foundation');
  const { state, busy, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [passwordReset, setPasswordReset] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState(state.notice);
  useEffect(() => setNotice(state.notice), [state]);
  const [error, setError] = useState<AuthError>();
  const forgotRef = useRef<View>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const emailError = submitted ? validateEmail(email) : undefined;
  const passwordResult = loginSchema.shape.password.safeParse(password);
  const passwordError =
    submitted && !passwordResult.success
      ? passwordResult.error.issues[0]?.message
      : undefined;
  const invalid = error?.code === 'invalidCredentials';
  const submit = async () => {
    if (busy) return;
    setSubmitted(true);
    setNotice(undefined);
    setError(undefined);
    const parsed = loginSchema.safeParse({ email, password });
    if (!loginSchema.shape.email.safeParse(email).success) {
      emailRef.current?.focus();
      return;
    }
    if (!parsed.success) {
      passwordRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    const result = await login(parsed.data.email, parsed.data.password);
    if (result) {
      setError(result);
      if (result.code === 'invalidCredentials') {
        setPassword('');
        setSubmitted(false);
        // Mount a fresh enabled native input: Android can retain stale focus after disabling it.
        setPasswordReset((current) => current + 1);
      }
    }
  };
  return (
    <Screen
      testID="login-screen"
      keyboardAware
    >
      <BrandHeader tagline={t('tagline')} />
      <Card
        overlap
        animate
      >
        <View>
          <Text
            accessibilityRole="header"
            className={cn(ui.heading)}
          >
            {t('loginTitle')}
          </Text>
          <Text className={cn(local.subtitle, 'text-mdy-secondary')}>
            {t('loginSubtitle')}
          </Text>
        </View>
        {(error || notice) && (
          <Alert
            testID="login-alert"
            warning={!error}
          >
            {t(error?.code ?? notice ?? 'server')}
          </Alert>
        )}
        <TextField
          fieldId="login-email"
          label={t('email')}
          error={emailError ? t(emailError) : undefined}
          invalid={invalid}
          icon="mail"
          inputRef={emailRef}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(undefined);
          }}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="username"
          maxLength={320}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          key={passwordReset}
          autoFocus={passwordReset > 0}
          fieldId="login-password"
          label={t('password')}
          error={passwordError ? t(passwordError) : undefined}
          invalid={invalid}
          icon="lock"
          inputRef={passwordRef}
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(undefined);
          }}
          editable={!busy}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="current-password"
          maxLength={128}
          returnKeyType="go"
          onSubmitEditing={submit}
          trailing={
            <Pressable
              testID="login-password-toggle"
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t(visible ? 'hidePassword' : 'showPassword')}
              onPress={() => setVisible((value) => !value)}
              className={cn(local.eye)}
            >
              <Icon
                size={20}
                name={visible ? 'visibility_off' : 'visibility'}
              />
            </Pressable>
          }
        />
        <Pressable
          ref={forgotRef}
          testID="login-forgot-button"
          disabled={busy}
          accessibilityRole="button"
          onPress={() => setForgot(true)}
          className={cn(local.forgot)}
        >
          <Text className={cn(local.forgotText, 'text-mdy-link')}>
            {t('forgot')}
          </Text>
        </Pressable>
        <Button
          testID="login-submit-button"
          busy={busy}
          onPress={submit}
        >
          {t(busy ? 'submitting' : 'submit')}
        </Button>
      </Card>
      <View className={cn(local.footer)}>
        <Text className={cn(ui.caption, local.center, 'text-mdy-secondary')}>
          {t('footer')}
        </Text>
      </View>
      {forgot && (
        <Sheet
          testID="forgot-sheet"
          title={t('forgot')}
          returnFocusRef={forgotRef}
          onClose={() => setForgot(false)}
        >
          <CircleIcon name="help" />
          <Text className={cn('text-mdy-secondary')}>{t('forgotBody')}</Text>
          <Button
            testID="forgot-sheet-ok"
            onPress={() => setForgot(false)}
          >
            {t('gotIt')}
          </Button>
        </Sheet>
      )}
    </Screen>
  );
}
const local = {
  center: 'text-center',
  eye: 'items-center h-space-44 justify-center w-space-44',
  footer: 'mt-auto pb-space-8 px-space-32 pt-space-32',
  forgot: 'self-end justify-center -mt-space-8 min-h-space-44',
  forgotText: 'font-bvp-medium text-size-13',
  subtitle: 'text-size-13 mt-space-4',
};

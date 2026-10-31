import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Icon,
  Row,
  Text,
  ui,
  type IconName,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/utils/cn';
import { AccountPage, accountStyles } from '../components/AccountPage';
import { useAuth } from '../hooks/useAuth';
import type { AuthStackParams } from '../AuthApp';
import type { AuthError } from '../types';

function InformationRow({
  icon,
  label,
  value,
  empty = false,
  testID,
}: {
  icon: IconName;
  label: string;
  value: string;
  empty?: boolean;
  testID: string;
}) {
  const { colors } = useMindyTheme();
  return (
    <View className="flex-row items-center gap-space-12 rounded-radius-14 p-space-10">
      <View className={cn(ui.actionIcon, 'bg-mdy-tint2')}>
        <Icon
          name={icon}
          size={20}
          color={colors.link}
        />
      </View>
      <View className="flex-1">
        <Text
          accessible={false}
          className="text-size-12 text-mdy-secondary"
        >
          {label}
        </Text>
        <Text
          testID={testID}
          selectable
          accessibilityLabel={`${label}, ${value}`}
          className={cn(
            'text-size-14',
            empty ? 'text-mdy-secondary' : 'font-bvp-medium text-mdy-ink'
          )}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Profile'>) {
  const { t } = useTranslation('foundation');
  const { state, busy, logout } = useAuth();
  const [confirm, setConfirm] = useState<'one' | 'all'>();
  const [error, setError] = useState<AuthError>();
  const logoutRef = useRef<View>(null);
  const logoutAllRef = useRef<View>(null);
  const user = state.user;
  if (!user) return null;
  const close = () => {
    if (!busy) {
      setConfirm(undefined);
      setError(undefined);
    }
  };
  return (
    <AccountPage
      page="profile"
      title={t('profileTitle')}
      subtitle={t('profileSubtitle')}
      onBack={() => navigation.goBack()}
    >
      <Card
        center
        className="mx-space-0 gap-space-10"
      >
        <Avatar
          name={user.displayName}
          profile
          testID="profile-avatar"
        />
        <Text
          testID="profile-name"
          numberOfLines={2}
          className="text-size-18 font-bvp-semibold text-center"
        >
          {user.displayName}
        </Text>
        <Text
          testID="profile-email"
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={user.email}
          className="max-w-full text-size-13 text-mdy-secondary"
        >
          {user.email}
        </Text>
        <View
          testID="profile-role-chip"
          className="rounded-radius-99 min-h-space-24 px-space-10 justify-center bg-mdy-tint2"
        >
          <Text className="text-size-12 font-bvp-semibold text-mdy-primary">
            {t(user.role === 'MENTOR' ? 'MENTOR' : 'MANAGER')}
          </Text>
        </View>
      </Card>
      <View className={accountStyles.group}>
        <Text className={accountStyles.groupLabel}>{t('profileInfo')}</Text>
        <Card className={accountStyles.list}>
          <InformationRow
            icon="mail"
            label={t('email')}
            value={user.email}
            testID="profile-info-email"
          />
          <InformationRow
            icon="call"
            label={t('phone')}
            value={user.phone || t('phoneEmpty')}
            empty={!user.phone}
            testID="profile-info-phone"
          />
        </Card>
      </View>
      <View className={accountStyles.group}>
        <Text className={accountStyles.groupLabel}>{t('sessions')}</Text>
        <Card className={accountStyles.list}>
          <Row
            compact
            chevron={false}
            triggerRef={logoutRef}
            testID="profile-logout-row"
            icon="logout"
            label={t('logout')}
            subtitle={t('logoutSub')}
            onPress={() => setConfirm('one')}
          />
          <Row
            compact
            chevron={false}
            triggerRef={logoutAllRef}
            testID="profile-logout-all-row"
            icon="devices"
            label={t('logoutAll')}
            subtitle={t('logoutAllSub')}
            danger
            onPress={() => setConfirm('all')}
          />
        </Card>
      </View>
      {confirm && (
        <ConfirmationDialog
          testID="logout-sheet"
          title={t(confirm === 'all' ? 'logoutAllTitle' : 'logoutTitle')}
          icon={confirm === 'all' ? 'devices' : 'logout'}
          onClose={close}
          busy={busy}
          returnFocusRef={confirm === 'all' ? logoutAllRef : logoutRef}
        >
          <Text className="-mt-space-8 text-center text-mdy-secondary">
            {t(confirm === 'all' ? 'logoutAllBody' : 'logoutBody', {
              email: user.email,
            })}
          </Text>
          {error && (
            <Alert testID="logout-sheet-error">{t('logoutError')}</Alert>
          )}
          <View className="gap-space-8">
            <Button
              testID="logout-sheet-confirm"
              variant="danger"
              className="bg-mdy-dangerButton"
              busy={busy}
              onPress={async () => {
                setError(undefined);
                setError(await logout(confirm === 'all'));
              }}
            >
              {t(
                busy ? 'loggingOut' : confirm === 'all' ? 'logoutAll' : 'logout'
              )}
            </Button>
            <Button
              testID="logout-sheet-cancel"
              variant="secondary"
              className="border-mdy-disabled"
              disabled={busy}
              onPress={close}
            >
              <Text className="text-mdy-primary">{t('cancel')}</Text>
            </Button>
          </View>
        </ConfirmationDialog>
      )}
    </AccountPage>
  );
}

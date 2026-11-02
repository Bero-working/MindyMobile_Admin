import type { ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Chip,
  Icon,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import {
  Filters as TeachingFilters,
  SkeletonList,
} from '@/modules/teaching/components/shared';
import { MaterialError } from './service';
import type { Material } from './schema';
import { stateLabel } from './model';
import './messages';
export function Problem({
  error,
  retry,
  prefix = 'materials',
}: {
  error?: MaterialError | undefined;
  retry?: (() => void) | undefined;
  prefix?: string;
}) {
  const { t } = useTranslation('materials');
  if (!error) return null;
  const message = t(error.code, {
    defaultValue: t(error.kind === 'error' ? 'error' : error.kind),
  });
  return (
    <View className="gap-space-8">
      <Alert
        testID={`${prefix}-${error.kind}`}
        warning
      >
        {message +
          (error.requestId ? ` · ${t('support')}: ${error.requestId}` : '')}
      </Alert>
      {retry &&
        !['offline', 'denied', 'notFound', 'conflict', 'uncertain'].includes(
          error.kind
        ) && (
          <Button
            variant="text"
            testID={`${prefix}-retry`}
            onPress={retry}
          >
            {t('retry')}
          </Button>
        )}
    </View>
  );
}
export function ReadBlock({
  data,
  busy,
  error,
  retry,
  children,
}: {
  data?: object | undefined;
  busy: boolean;
  error?: MaterialError | undefined;
  retry: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {data ? children : busy ? <SkeletonList /> : null}
      <Problem
        error={error}
        retry={retry}
      />
    </>
  );
}
export function Filters({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation('materials');
  return (
    <TeachingFilters
      prefix="materials"
      values={values}
      value={value}
      onChange={onChange}
      labelFor={(v) => t(v || 'all')}
    />
  );
}
export const fileSize = (bytes: number, language: string) =>
  `${(bytes / 1024 / 1024).toLocaleString(language, { maximumFractionDigits: 1 })} MB`;
export const instantLabel = (value: string, language: string) =>
  new Date(value).toLocaleString(language, {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export function Notice({
  testID,
  children,
}: {
  testID: string;
  children: string;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      className="w-full flex-row gap-space-8 rounded-radius-12 bg-mdy-infoBg px-space-12 py-space-10"
    >
      <Icon
        name="info"
        size={18}
        color={colors.info}
      />
      <Text className="flex-1 text-size-13 leading-line-20 text-mdy-info">
        {children}
      </Text>
    </View>
  );
}
export function EmptyBlock({
  testID,
  children,
}: {
  testID: string;
  children: ReactNode;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      className="items-center gap-space-12 py-space-32"
    >
      <View className="h-space-56 w-space-56 items-center justify-center rounded-radius-28 bg-mdy-tint2">
        <Icon
          name="menu_book"
          size={26}
          color={colors.primary}
        />
      </View>
      {children}
    </View>
  );
}
export function MaterialTile({ item }: { item: Material }) {
  const { colors } = useMindyTheme();
  return (
    <View className="h-space-44 w-space-44 items-center justify-center rounded-radius-12 bg-mdy-tint2">
      {item.contentType === 'ARTICLE' ? (
        <Icon
          name="article"
          size={22}
          color={colors.primary}
        />
      ) : (
        <Text className="text-size-11 font-bvp-semibold text-mdy-link">
          {item.file?.originalFilename
            .split('.')
            .pop()
            ?.toUpperCase()
            .slice(0, 4) ?? 'FILE'}
        </Text>
      )}
    </View>
  );
}
export function MaterialStatus({
  item,
  testID,
}: {
  item: Material;
  testID: string;
}) {
  const { t } = useTranslation('materials');
  return (
    <Chip
      testID={testID}
      variant={
        item.reviewStatus === 'REJECTED'
          ? 'danger'
          : item.reviewStatus === 'PENDING_REVIEW'
            ? 'warning'
            : item.publishedAt
              ? 'success'
              : 'neutral'
      }
    >
      {t(stateLabel(item))}
    </Chip>
  );
}
export function MaterialRow({
  item,
  onPress,
  prefix,
  classTitle,
  author,
}: {
  item: Material;
  onPress: () => void;
  prefix: string;
  classTitle?: string | undefined;
  author?: string | undefined;
}) {
  const { t, i18n } = useTranslation('materials');
  const { colors } = useMindyTheme();
  const content = [
    t(item.contentType),
    ...(item.file
      ? [fileSize(item.file.sizeBytes, i18n.language)]
      : item.contentType !== 'ARTICLE'
        ? [t('fileMissing')]
        : []),
  ].join(' · ');
  const reason =
    item.reviewStatus === 'REJECTED' ? item.rejectionReason : undefined;
  const updated = `${t('updated')} ${instantLabel(item.updatedAt, i18n.language)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        item.title,
        classTitle,
        author,
        content,
        t(stateLabel(item)),
        reason,
        updated,
      ]
        .filter(Boolean)
        .join(', ')}
      testID={`${prefix}-row-${item.id}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="mx-space-0 px-space-16 py-space-16">
        <View className="flex-row gap-space-12">
          <MaterialTile item={item} />
          <View className="flex-1 gap-space-6">
            <Text
              className="text-size-15 font-bvp-semibold text-mdy-ink"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {classTitle && (
              <Text className="text-size-13 text-mdy-secondary">
                {classTitle}
              </Text>
            )}
            {author && (
              <Text className="text-size-13 text-mdy-secondary">{author}</Text>
            )}
            <Text className="text-size-13 text-mdy-secondary">{content}</Text>
            <MaterialStatus
              item={item}
              testID={`${prefix}-row-status-${item.id}`}
            />
            {reason && (
              <View
                testID={`${prefix}-row-reason-${item.id}`}
                className="flex-row gap-space-6"
              >
                <Icon
                  name="info"
                  size={16}
                  color={colors.danger}
                />
                <Text
                  numberOfLines={2}
                  className="flex-1 text-size-13 text-mdy-danger"
                >
                  {reason}
                </Text>
              </View>
            )}
            <Text className="text-size-12 text-mdy-tertiary">{updated}</Text>
          </View>
          <View className="self-center">
            <Icon
              name="chevron_right"
              size={20}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

import { useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Button, Icon, Text } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import {
  TeachingPage,
  Filters,
  Footer,
  QueryBlock,
  SkeletonList,
} from '../components/shared';
import { ClassCard, MentorClassCard } from '../components/rows';
import { PageHeadingContext } from '../TeachingProvider';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
const managerFilters = [
  'IN_PROGRESS',
  'OPEN',
  'COMPLETED',
  'CANCELLED',
  'DRAFT',
];
const mentorFilters = ['IN_PROGRESS', 'OPEN', 'COMPLETED', 'CANCELLED'];
function MentorClasses({
  navigation,
}: {
  navigation: NativeStackScreenProps<
    AuthStackParams,
    'MentorClasses'
  >['navigation'];
}) {
  const { t } = useTranslation('teaching');
  const [status, setStatus] = useState('IN_PROGRESS');
  const query = useTeachingQuery({
    kind: 'classes',
    role: 'MENTOR',
    status,
  });
  const summary = useTeachingQuery(
    { kind: 'classes', role: 'MENTOR', status, pageSize: 1 },
    true,
    false
  );
  const [countByStatus, setCounts] = useState<
    Record<string, number | undefined>
  >({});
  const countOf = (value: string) => countByStatus[value];
  const heading = useContext(PageHeadingContext);
  const headingTitle = t('myClasses');
  useEffect(() => {
    heading({
      title: headingTitle,
      loading: !summary.data && !summary.result,
      ...(summary.data
        ? { subtitle: t('count', { count: summary.data.total }) }
        : {}),
    });
  }, [summary.data, summary.result, heading, headingTitle, t]);
  useEffect(() => {
    if (query.result?.kind === 'success' && query.data)
      setCounts((previous) => ({ ...previous, [status]: query.data!.total }));
  }, [query.data, query.result, status]);
  useEffect(() => {
    if (query.data)
      AccessibilityInfo.announceForAccessibility(
        t('count', { count: query.data.total })
      );
  }, [query.data]);
  return (
    <>
      <Filters
        prefix="classes"
        group="mentorClassStatus"
        values={mentorFilters}
        value={status}
        onChange={setStatus}
        labelFor={(value, label) =>
          countOf(value) === undefined ? label : `${label} (${countOf(value)})`
        }
      />
      <QueryBlock
        query={query}
        prefix="classes"
        loading={<SkeletonList variant="class" />}
      >
        {query.data?.classes.map((item) => (
          <MentorClassCard
            key={item.id}
            item={item}
            onPress={() =>
              navigation.navigate('MentorClassDetail', { classId: item.id })
            }
          />
        ))}
        {(!query.data || query.data.total === 0) && (
          <View
            testID={`classes-empty-filter`}
            className="py-space-32 gap-space-12"
          >
            <Text>{t('emptyFilter')}</Text>
          </View>
        )}
        <Footer
          query={query}
          prefix="classes"
          count={query.data?.classes.length ?? 0}
        />
      </QueryBlock>
    </>
  );
}
function ManagerClasses({
  navigation,
}: {
  navigation: NativeStackScreenProps<
    AuthStackParams,
    'ManagerClasses'
  >['navigation'];
}) {
  const { t } = useTranslation('teaching');
  const { colors } = useMindyTheme();
  const [status, setStatus] = useState('IN_PROGRESS');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const prefix = 'manager-classes';
  const query = useTeachingQuery({
    kind: 'classes',
    role: 'MANAGER',
    status,
    q,
  });
  const [countByStatus, setCounts] = useState<
    Record<string, number | undefined>
  >({});
  const summary = useTeachingQuery(
    { kind: 'classes', role: 'MANAGER', status, pageSize: 1 },
    true,
    false
  );
  const heading = useContext(PageHeadingContext);
  useEffect(() => {
    heading({
      title: t('managerListTitle'),
      loading: !summary.data && !summary.result,
      ...(summary.data
        ? { subtitle: t('count', { count: summary.data.total }) }
        : {}),
    });
  }, [summary.data, summary.result, heading, t]);
  useEffect(() => {
    // Search results must not replace the unfiltered status total.
    if (!q && query.result?.kind === 'success' && query.data)
      setCounts((previous) => ({ ...previous, [status]: query.data!.total }));
  }, [query.data, query.result, status, q]);
  useEffect(() => {
    if (query.data)
      AccessibilityInfo.announceForAccessibility(
        t('count', { count: query.data.total })
      );
  }, [query.data]);
  const reset = () => {
    setSearch('');
    setQ('');
  };
  return (
    <>
      <View className="flex-row items-center rounded-radius-99 border border-mdy-glassBorder bg-mdy-glass px-space-12">
        <Icon
          name="search"
          size={18}
        />
        <TextInput
          testID="manager-classes-search"
          accessibilityLabel={t('searchLabel')}
          placeholder={t('search')}
          placeholderTextColor={colors.secondary}
          maxLength={100}
          value={search}
          onChangeText={setSearch}
          className="flex-1 min-h-space-52 text-size-14 text-mdy-ink"
        />
        {!!search && (
          <Pressable
            testID="manager-classes-search-clear"
            accessibilityRole="button"
            accessibilityLabel={t('clearSearch')}
            onPress={() => {
              setSearch('');
              setQ('');
            }}
            className="h-space-44 w-space-44 justify-center items-center"
          >
            <Icon name="close" />
          </Pressable>
        )}
      </View>
      <Filters
        prefix={prefix}
        values={managerFilters}
        labelFor={(value, label) =>
          countByStatus[value] === undefined
            ? label
            : `${label} (${countByStatus[value]})`
        }
        value={status}
        onChange={setStatus}
      />
      <QueryBlock
        query={query}
        prefix={prefix}
        loading={<SkeletonList variant="class" />}
      >
        {query.data?.classes.map((item) => (
          <ClassCard
            key={item.id}
            item={item}
            prefix={prefix}
            onPress={() =>
              navigation.navigate('ManagerClassDetail', {
                classId: item.id,
              })
            }
          />
        ))}
        {(!query.data || query.data.total === 0) && (
          <View
            testID={`${prefix}-${q ? 'no-results' : 'empty'}`}
            className="py-space-32 gap-space-12"
          >
            <Text>{t(q ? 'noResults' : 'emptyManager')}</Text>
            {!!q && (
              <Button
                variant="text"
                testID="manager-classes-clear-all"
                onPress={reset}
              >
                {t('clearAll')}
              </Button>
            )}
          </View>
        )}
        <Footer
          query={query}
          prefix={prefix}
          count={query.data?.classes.length ?? 0}
        />
      </QueryBlock>
    </>
  );
}
export function MentorClassesScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorClasses'>) {
  const { t } = useTranslation('teaching');
  return (
    <TeachingPage
      prefix="classes"
      reserveSubtitle
      title={t('myClasses')}
      onBack={navigation.goBack}
    >
      <MentorClasses navigation={navigation} />
    </TeachingPage>
  );
}
export function ManagerClassesScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ManagerClasses'>) {
  const { t } = useTranslation('teaching');
  return (
    <TeachingPage
      prefix="manager-classes"
      reserveSubtitle
      title={t('managerListTitle')}
      onBack={navigation.goBack}
    >
      <ManagerClasses navigation={navigation} />
    </TeachingPage>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Icon, Sheet, Text } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { Page } from '@/modules/attendance/components/shared';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useTeaching } from '@/modules/teaching/TeachingProvider';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import {
  Footer,
  QueryBlock,
  SkeletonList,
} from '@/modules/teaching/components/shared';
import { MentorClassCard } from '@/modules/teaching/components/rows';
import { useMaterials } from './MaterialProvider';
import { useRead } from './hooks';
import {
  EmptyBlock,
  Filters,
  MaterialRow,
  Notice,
  ReadBlock,
} from './components';
import { MaterialError, type Scope } from './service';
import type { TeachingUnit } from '@/modules/teaching/types';
function MaterialList({
  scope,
  unitId,
  onOpen,
  showFilters = true,
}: {
  scope: Scope;
  unitId?: string | undefined;
  onOpen: (id: string) => void;
  showFilters?: boolean;
}) {
  const service = useMaterials();
  const { state } = useAuth();
  const { t, i18n } = useTranslation('materials');
  const names = useRead(
    `material-names:${scope.role}`,
    () => service.names(),
    scope.role === 'MANAGER'
  );
  const [filter, setFilter] = useState(
    scope.role === 'MANAGER' ? 'PENDING_REVIEW' : ''
  );
  const query = useInfiniteQuery({
    queryKey: [
      'materials',
      state.user?.id,
      state.user?.email,
      scope.role,
      scope.classId,
      unitId,
      filter,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => service.list(scope, unitId, filter, pageParam),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    retry: false,
    gcTime: 0,
    enabled: scope.role === 'MANAGER' || !!unitId,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  const error =
    query.error instanceof MaterialError
      ? query.error
      : query.error
        ? new MaterialError('error')
        : undefined;
  const fatal = error && ['denied', 'notFound'].includes(error.kind);
  const pages = fatal ? undefined : query.data?.pages;
  const items = [
    ...new Map(pages?.flatMap((p) => p.items).map((m) => [m.id, m])).values(),
  ];
  return (
    <View className="gap-space-12">
      {showFilters && (
        <Filters
          values={
            scope.role === 'MANAGER'
              ? ['PENDING_REVIEW', 'APPROVED', 'REJECTED']
              : ['', 'DRAFT', 'PENDING_REVIEW', 'REJECTED', 'APPROVED']
          }
          value={filter}
          onChange={setFilter}
        />
      )}
      <ReadBlock
        data={pages}
        busy={query.isPending}
        error={error}
        retry={() => {
          query.refetch();
        }}
      >
        {pages && (
          <Text
            testID="materials-total"
            className="text-size-13 text-mdy-secondary"
          >
            {pages[pages.length - 1]?.total}{' '}
            {t('title').toLocaleLowerCase(i18n.language)}
          </Text>
        )}
        {items.length === 0 ? (
          scope.role === 'MENTOR' && filter ? (
            <EmptyBlock testID="materials-empty-filter">
              <Text className="text-center text-size-14 text-mdy-secondary">
                {t('empty')}
              </Text>
              <Button
                testID="materials-clear-filter"
                variant="text"
                size="sm"
                onPress={() => setFilter('')}
              >
                {t('clear')}
              </Button>
            </EmptyBlock>
          ) : (
            <EmptyBlock testID="materials-empty">
              <Text className="text-center text-size-14 text-mdy-secondary">
                {t(filter ? 'empty' : 'emptyUnit')}
              </Text>
            </EmptyBlock>
          )
        ) : (
          items.map((item) => (
            <MaterialRow
              key={item.id}
              item={item}
              classTitle={
                item.createdInClassId
                  ? names.data?.classes[item.createdInClassId]
                  : undefined
              }
              author={names.data?.mentors[item.createdBy]}
              prefix={scope.role === 'MANAGER' ? 'review-queue' : 'materials'}
              onPress={() => onOpen(item.id)}
            />
          ))
        )}
        {query.hasNextPage && (
          <Button
            testID="materials-more"
            disabled={query.isFetching || error?.kind === 'offline'}
            busy={query.isFetchingNextPage}
            onPress={() => {
              query.fetchNextPage();
            }}
          >
            {t('more')}
          </Button>
        )}
        <Button
          variant="text"
          size="sm"
          disabled={query.isFetching || error?.kind === 'offline'}
          onPress={() => {
            query.refetch();
          }}
        >
          {t('check')}
        </Button>
      </ReadBlock>
    </View>
  );
}
export function MaterialReviewQueueScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MaterialReviewQueue'>) {
  const { t } = useTranslation('materials');
  return (
    <Page
      prefix="review-queue"
      title={t('review')}
      onBack={() => navigation.goBack()}
      showMockControls={false}
    >
      <MaterialList
        scope={{ role: 'MANAGER' }}
        onOpen={(materialId) =>
          navigation.navigate('MaterialReviewDetail', { materialId })
        }
      />
    </Page>
  );
}
export function MentorMaterialsScreen({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParams, 'MentorMaterials'>) {
  const { t } = useTranslation('materials');
  const { colors } = useMindyTheme();
  const classId = route.params?.classId;
  const { source } = useTeaching();
  const [status, setStatus] = useState('IN_PROGRESS');
  const [unitSheet, setUnitSheet] = useState(false);
  const classes = useTeachingQuery(
    { kind: 'classes', role: 'MENTOR', status, pageSize: 20 },
    !classId,
    false
  );
  const context = useRead(
    `material-context:${classId}`,
    async () => {
      const result = await source.read({
        kind: 'class',
        classId: classId!,
        role: 'MENTOR',
      });
      if (result.kind !== 'success')
        throw new MaterialError(
          result.kind === 'unavailable' ? 'error' : result.kind
        );
      const units: TeachingUnit[] = [];
      for (let page = 1; ; page++) {
        const r = await source.read({
          kind: 'units',
          classId: classId!,
          role: 'MENTOR',
          page,
          pageSize: 100,
        });
        if (r.kind !== 'success')
          throw new MaterialError(r.kind === 'unavailable' ? 'error' : r.kind);
        units.push(...r.data.units);
        if (units.length >= r.data.total) break;
        if (!r.data.units.length)
          throw new MaterialError('error', 'INVALID_PAGE');
      }
      return { item: result.data.classInfo, units };
    },
    !!classId
  );
  const [unitId, setUnit] = useState(route.params?.unitId ?? '');
  useEffect(() => {
    if (context.data && !context.data.units.some((u) => u.id === unitId))
      setUnit(context.data.units[0]?.id ?? '');
  }, [context.data, unitId]);
  const unit = context.data?.units.find((u) => u.id === unitId);
  const sessionScope = context.data?.item?.scope === 'SESSION';
  const unitLabel = (value: TeachingUnit) =>
    t('unit', { position: value.position, title: value.title });
  return (
    <Page
      prefix="materials"
      title={t('title')}
      subtitle={route.params?.classTitle ?? t('chooseClass')}
      onBack={() => navigation.goBack()}
      showMockControls={false}
    >
      {!classId ? (
        <>
          <Filters
            values={['IN_PROGRESS', 'OPEN', 'COMPLETED']}
            value={status}
            onChange={setStatus}
          />
          <QueryBlock
            query={classes}
            prefix="materials"
            loading={<SkeletonList variant="class" />}
          >
            {classes.data?.classes.map((c) => (
              <MentorClassCard
                key={c.id}
                testID={`materials-class-${c.id}`}
                item={c}
                onPress={() =>
                  navigation.push('MentorMaterials', {
                    classId: c.id,
                    classTitle: c.name,
                  })
                }
              />
            ))}
            {classes.data?.total === 0 && (
              <EmptyBlock testID="materials-no-classes">
                <Text className="text-center text-size-14 text-mdy-secondary">
                  {t('noClasses')}
                </Text>
              </EmptyBlock>
            )}
            <Footer
              query={classes}
              prefix="materials"
              count={classes.data?.classes.length ?? 0}
            />
          </QueryBlock>
        </>
      ) : (
        <ReadBlock
          data={context.data}
          busy={context.busy}
          error={context.error}
          retry={() => {
            context.refresh();
          }}
        >
          {sessionScope && (
            <Notice testID="materials-scope-alert">{t('sessionScope')}</Notice>
          )}
          {context.data?.item?.status === 'COMPLETED' && (
            <Notice testID="materials-ended-alert">{t('classEnded')}</Notice>
          )}
          {unit && (
            <Pressable
              testID="materials-unit-picker"
              accessibilityRole="button"
              accessibilityLabel={unitLabel(unit)}
              accessibilityHint={t('unitHint')}
              onPress={() => setUnitSheet(true)}
              className="active:opacity-80"
            >
              <Card className="mx-space-0 px-space-16 py-space-12">
                <View className="min-h-space-24 flex-row items-center gap-space-12">
                  <Icon
                    name="menu_book"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    numberOfLines={2}
                    className="flex-1 text-size-14 font-bvp-semibold text-mdy-ink"
                  >
                    {unitLabel(unit)}
                  </Text>
                  <Icon
                    name="expand_more"
                    size={20}
                  />
                </View>
              </Card>
            </Pressable>
          )}
          {unitSheet && (
            <Sheet
              testID="materials-unit-sheet"
              title={t('chooseUnit')}
              onClose={() => setUnitSheet(false)}
            >
              <ScrollView className="max-h-[400px]">
                {context.data?.units.map((u) => (
                  <Pressable
                    key={u.id}
                    testID={`materials-unit-${u.id}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: u.id === unitId }}
                    onPress={() => {
                      setUnit(u.id);
                      setUnitSheet(false);
                    }}
                    className={
                      u.id === unitId
                        ? 'min-h-space-48 flex-row items-center gap-space-12 rounded-radius-14 bg-mdy-tint2 px-space-12 py-space-10'
                        : 'min-h-space-48 flex-row items-center gap-space-12 rounded-radius-14 px-space-12 py-space-10 active:bg-mdy-muted'
                    }
                  >
                    <Text
                      className={
                        u.id === unitId
                          ? 'flex-1 text-size-14 font-bvp-semibold text-mdy-link'
                          : 'flex-1 text-size-14 text-mdy-ink'
                      }
                    >
                      {unitLabel(u)}
                    </Text>
                    {u.id === unitId && (
                      <Icon
                        name="check"
                        size={20}
                        color={colors.link}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </Sheet>
          )}
          {unit && context.data?.item?.authorMaterials && unit.courseUnitId && (
            <Button
              testID="materials-upload"
              icon="upload_file"
              disabled={!context.online}
              onPress={() =>
                navigation.navigate('MaterialEditor', {
                  classId,
                  classUnitId: unit.id,
                  courseUnitId: unit.courseUnitId!,
                  unitTitle: unit.title,
                })
              }
            >
              {t('upload')}
            </Button>
          )}
          {unit ? (
            <MaterialList
              key={unitId}
              scope={{ role: 'MENTOR', classId }}
              unitId={unitId}
              showFilters={!sessionScope}
              onOpen={(materialId) =>
                navigation.navigate('MentorMaterialDetail', {
                  classId,
                  materialId,
                })
              }
            />
          ) : (
            <EmptyBlock testID="materials-no-units">
              <Text className="text-center text-size-14 text-mdy-secondary">
                {t('noUnits')}
              </Text>
            </EmptyBlock>
          )}
        </ReadBlock>
      )}
    </Page>
  );
}

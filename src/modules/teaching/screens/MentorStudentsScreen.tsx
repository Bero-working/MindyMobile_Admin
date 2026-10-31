import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Button, Text } from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TeachingPage,
  QueryBlock,
  Filters,
  Footer,
} from '../components/shared';
import { StudentRow } from '../components/rows';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
import type { TeachingRole } from '../types';
export const orderFilters = ['', 'PAID', 'PENDING', 'EXPIRED', 'CANCELLED'];
export function MentorStudentsScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorStudents'>) {
  const { t } = useTranslation('teaching');
  return (
    <TeachingPage
      prefix="students"
      title={t('students')}
      onBack={navigation.goBack}
      deniedTitle={t('studentsDenied')}
      deniedBody={t('studentsDeniedBody')}
    >
      <Roster
        classId={route.params.classId}
        role="MENTOR"
      />
    </TeachingPage>
  );
}
export function Roster({
  classId,
  role,
  className = '',
}: {
  classId: string;
  role: TeachingRole;
  className?: string;
}) {
  const { t } = useTranslation('teaching');
  const [status, setStatus] = useState('');
  const query = useTeachingQuery({ kind: 'students', classId, role, status });
  const prefix = role === 'MANAGER' ? 'manager-detail' : 'students';
  return (
    <>
      <View className="min-h-[21px]">
        {!query.data && !query.result ? (
          <Skeleton label={t('loading')}>
            <Text numberOfLines={1}>{t('students')}</Text>
          </Skeleton>
        ) : (
          <Text
            numberOfLines={1}
            testID={
              role === 'MENTOR'
                ? 'students-subtitle'
                : 'manager-detail-students-count'
            }
          >
            {query.data
              ? `${query.data.classInfo?.name ?? className} · ${query.data.total}`
              : ''}
          </Text>
        )}
      </View>
      <Filters
        prefix={prefix}
        values={orderFilters}
        value={status}
        onChange={setStatus}
        group="order"
      />
      <QueryBlock
        query={query}
        prefix={role === 'MANAGER' ? 'manager-detail-students' : 'students'}
      >
        {query.data?.students.map((item) => (
          <StudentRow
            key={item.id}
            item={item}
            prefix={prefix}
            manager={role === 'MANAGER'}
          />
        ))}
        {(!query.data || query.data.total === 0) && (
          <View testID={`${prefix}-${status ? 'empty-filter' : 'empty'}`}>
            <Text>{t(status ? 'emptyStudentsFilter' : 'emptyStudents')}</Text>
            {!!status && (
              <Button
                testID={`${prefix}-show-all`}
                variant="text"
                onPress={() => setStatus('')}
              >
                {t('showAll')}
              </Button>
            )}
          </View>
        )}
        <Footer
          query={query}
          prefix={prefix}
          count={query.data?.students.length ?? 0}
        />
      </QueryBlock>
    </>
  );
}

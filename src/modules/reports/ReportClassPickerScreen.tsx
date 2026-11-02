import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Text } from '@/components/ui/primitives';
import {
  Filters,
  Footer,
  QueryBlock,
  SkeletonList,
  TeachingPage,
} from '@/modules/teaching/components/shared';
import { MentorClassCard } from '@/modules/teaching/components/rows';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import './messages';

type Navigation = NativeStackScreenProps<
  AuthStackParams,
  'MentorReportClasses'
>['navigation'];

const statuses = ['IN_PROGRESS', 'OPEN', 'COMPLETED', 'CANCELLED'];

export function MentorReportClassesScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorReportClasses'>) {
  const { t } = useTranslation('reports');
  return (
    <TeachingPage
      prefix="report-classes"
      title={t('mentor.title')}
      subtitle={t('chooseClass')}
      onBack={navigation.goBack}
    >
      <ClassPicker navigation={navigation} />
    </TeachingPage>
  );
}

function ClassPicker({ navigation }: { navigation: Navigation }) {
  const { t } = useTranslation('reports');
  const [status, setStatus] = useState('IN_PROGRESS');
  const query = useTeachingQuery({ kind: 'classes', role: 'MENTOR', status });
  const loaded = query.data?.classes ?? [];
  // Class reports need class-wide access; session-scoped substitutes have none.
  const classes = loaded.filter((item) => item.scope === 'CLASS');
  return (
    <>
      <Filters
        prefix="report-classes"
        group="mentorClassStatus"
        values={statuses}
        value={status}
        onChange={setStatus}
      />
      <QueryBlock
        query={query}
        prefix="report-classes"
        loading={<SkeletonList variant="class" />}
      >
        {classes.map((item) => (
          <MentorClassCard
            key={item.id}
            testID={`report-class-${item.id}`}
            item={item}
            onPress={() =>
              navigation.navigate('MentorAttendanceReport', {
                classId: item.id,
                classTitle: item.name,
              })
            }
          />
        ))}
        {!classes.length && loaded.length >= (query.data?.total ?? 0) && (
          <Text testID="report-classes-empty">{t('noClasses')}</Text>
        )}
        <Footer
          query={query}
          prefix="report-classes"
          count={loaded.length}
        />
      </QueryBlock>
    </>
  );
}

import { useState } from 'react';
import { Button, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeachingProvider } from '@/modules/teaching/TeachingProvider';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import { createTeachingMock } from '@/modules/teaching/services/mockTeaching';
import type {
  TeachingRequest,
  TeachingResult,
  TeachingSource,
} from '@/modules/teaching/types';
const Stack = createNativeStackNavigator<{ Probe: undefined }>();
function Probe({ schedule = false }: { schedule?: boolean }) {
  const [status, setStatus] = useState('');
  const query = useTeachingQuery({
    kind: schedule ? 'schedule' : 'classes',
    role: 'MENTOR',
    status,
    pageSize: schedule ? 100 : 1,
  });
  return (
    <>
      <Text testID="result">
        {query.data ? JSON.stringify(query.data) : 'loading'}
      </Text>
      <Button
        testID="filter"
        title="filter"
        onPress={() => setStatus('OPEN')}
      />
      <Button
        testID="more"
        title="more"
        onPress={query.more}
      />
      <Button
        testID="refresh"
        title="refresh"
        onPress={query.refresh}
      />
      <Button
        testID="retry"
        title="retry"
        onPress={query.retry}
      />
    </>
  );
}
function open(source: TeachingSource, schedule = false) {
  render(
    <TeachingProvider source={source}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Probe">
            {() => <Probe schedule={schedule} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </TeachingProvider>
  );
}
test('TC-P1-S2-13: response from old filter cannot replace the latest list', async () => {
  const base = createTeachingMock();
  let finish: (value: TeachingResult) => void = () => {};
  const source: TeachingSource = {
    read: (request) =>
      request.status === 'OPEN'
        ? base.read(request)
        : new Promise((resolve) => {
            finish = resolve;
          }),
  };
  open(source);
  fireEvent.press(screen.getByTestId('filter'));
  await screen.findByText(/ENG-1/);
  await act(async () =>
    finish(await base.read({ kind: 'classes', role: 'MENTOR' }))
  );
  expect(screen.getByTestId('result')).toHaveTextContent(/ENG-1/);
  expect(screen.getByTestId('result')).not.toHaveTextContent(/IF-K12/);
});
test('TC-P1-S1-10: schedule loads every page within its requested date range', async () => {
  const response = await createTeachingMock().read({
    kind: 'schedule',
    role: 'MENTOR',
  });
  if (response.kind !== 'success' || !response.data.sessions[0])
    throw new Error('Missing fixture');
  const item = response.data.sessions[0];
  const all = Array.from({ length: 130 }, (_, i) => ({
    ...item,
    id: `session-${i}`,
  }));
  const read = jest.fn(
    async (request: TeachingRequest): Promise<TeachingResult> => ({
      kind: 'success',
      data: {
        ...response.data,
        total: 130,
        sessions: all.slice(
          ((request.page ?? 1) - 1) * 100,
          (request.page ?? 1) * 100
        ),
      },
    })
  );
  open({ read }, true);
  await screen.findByText(/session-129/);
  expect(read).toHaveBeenCalledTimes(2);
  expect(read.mock.calls[1]?.[0].page).toBe(2);
});
test('TC-P1-S2-10: appends pages with stable totals, no duplicate rows', async () => {
  open(createTeachingMock());
  await screen.findByText(/IF-K12/);
  fireEvent.press(screen.getByTestId('more'));
  await screen.findByText(/GTB1-07/);
  const data = JSON.parse(screen.getByTestId('result').props.children) as {
    classes: { id: string }[];
    total: number;
  };
  expect(data.classes).toHaveLength(2);
  expect(new Set(data.classes.map((item) => item.id)).size).toBe(2);
  expect(data.total).toBe(5);
});

test('failed footer retry requests the missing page and keeps previous rows', async () => {
  const mock = createTeachingMock();
  let failed = false;
  const read = jest.fn(
    async (request: TeachingRequest): Promise<TeachingResult> => {
      if (request.page === 2 && !failed) {
        failed = true;
        return { kind: 'error' };
      }
      return mock.read(request);
    }
  );
  open({ read });
  await screen.findByText(/IF-K12/);
  await act(async () => {
    fireEvent.press(screen.getByTestId('more'));
  });
  expect(screen.getByTestId('result')).toHaveTextContent(/IF-K12/);
  await act(async () => {
    fireEvent.press(screen.getByTestId('retry'));
  });
  await screen.findByText(/GTB1-07/);
  expect(read.mock.calls.map(([request]) => request.page)).toEqual([1, 2, 2]);
});

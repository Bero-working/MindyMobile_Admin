import { render, screen } from '@testing-library/react-native';
import { Stop } from 'react-native-svg';
import { Card, Gradient, Text } from '@/components/ui/primitives';
import { MindyThemeProvider } from '@/components/ui/theme';
import tokens from '@/components/ui/tokens.json';

test.each([
  [{ frosted: true }, 1],
  [{ overlap: true }, 1],
  [{}, 0],
])('Card %j renders %i blur layer', (props, count) => {
  render(
    <MindyThemeProvider>
      <Card
        testID="card"
        {...props}
      >
        <Text>Content</Text>
      </Card>
    </MindyThemeProvider>
  );
  expect(
    screen.queryAllByTestId('card-blur', { includeHiddenElements: true })
  ).toHaveLength(count);
  expect(screen.getByText('Content')).toBeTruthy();
});

test('glass gradient passes token alpha through stopOpacity', () => {
  render(
    <MindyThemeProvider>
      <Gradient
        id="glass"
        variant="glass"
      />
    </MindyThemeProvider>
  );
  const stops = screen.UNSAFE_getAllByType(Stop).map(({ props }) => props);
  expect(stops[0]).toMatchObject({
    stopColor: 'rgb(255,255,255)',
    stopOpacity: 0.9,
  });
  expect(stops[2]).toMatchObject({
    stopColor: 'rgb(255,255,255)',
    stopOpacity: Number(/[\d.]+(?=\)$)/.exec(tokens.light.glassEnd)?.[0]),
  });
});

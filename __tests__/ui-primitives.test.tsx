import { createRef, type PropsWithChildren } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { MindyThemeProvider, useMindyTheme } from '@/components/ui/theme';
import localStore from '@/services/storage/localStore.service';

function Variables({ children }: PropsWithChildren) {
  const { variables } = useMindyTheme();
  return <View style={variables}>{children}</View>;
}
function Wrapper({ children }: PropsWithChildren) {
  return (
    <MindyThemeProvider>
      <Variables>{children}</Variables>
    </MindyThemeProvider>
  );
}
beforeEach(() => localStore.clearAll());

test('Text class overrides preserve independent font size, family and semantic color', () => {
  render(
    <Text
      testID="copy"
      className="font-bvp-semibold text-size-17 text-mdy-danger leading-line-25"
    >
      Message
    </Text>,
    { wrapper: Wrapper }
  );
  expect(screen.getByTestId('copy')).toHaveStyle({
    fontFamily: 'BeVietnamPro-SemiBold',
    fontSize: 17,
    color: '#9a2f12',
    lineHeight: 25,
  });
});

test('Button asChild forwards ref, interaction, layout and text context to a native child', () => {
  const ref = createRef<View>();
  const onPress = jest.fn();
  render(
    <Button
      ref={ref}
      asChild
      variant="danger"
      onPress={onPress}
    >
      <Pressable testID="action">
        <Text testID="action-label">Remove</Text>
      </Pressable>
    </Button>,
    { wrapper: Wrapper }
  );
  expect(ref.current).toBeTruthy();
  expect(screen.getByTestId('action')).toHaveStyle({
    minHeight: 52,
    backgroundColor: '#9a2f12',
  });
  expect(screen.getByTestId('action-label')).toHaveStyle({
    fontFamily: 'BeVietnamPro-SemiBold',
    color: '#ffffff',
  });
  fireEvent.press(screen.getByTestId('action'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('Text asChild keeps caller color and size when composing native text', () => {
  render(
    <Text
      asChild
      className="text-size-12 text-mdy-secondary"
    >
      <RNText testID="caption">Caption</RNText>
    </Text>,
    { wrapper: Wrapper }
  );
  expect(screen.getByTestId('caption')).toHaveStyle({
    fontSize: 12,
    color: '#6b6862',
  });
});

test('small Button overrides the large control dimensions from shared recipes', () => {
  render(
    <Button
      testID="small-action"
      size="sm"
    >
      {String('Retry')}
    </Button>,
    { wrapper: Wrapper }
  );
  expect(screen.getByTestId('small-action')).toHaveStyle({
    minHeight: 44,
    borderRadius: 22,
    paddingTop: 8,
    paddingBottom: 8,
  });
});

test('caption line height overrides the default text line height', () => {
  render(
    <Text
      testID="compact-copy"
      className="text-size-12 leading-line-18"
    >
      Caption
    </Text>,
    { wrapper: Wrapper }
  );
  expect(screen.getByTestId('compact-copy')).toHaveStyle({
    fontSize: 12,
    lineHeight: 18,
  });
});

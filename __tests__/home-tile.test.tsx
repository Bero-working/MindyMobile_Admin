import { fireEvent, render, screen } from '@testing-library/react-native';
import * as motion from 'react-native-reanimated';
import { HomeTile } from '@/modules/auth/components/HomeTile';
import { MindyThemeProvider } from '@/components/ui/theme';

test.each([false, true])(
  'H-H/I: tile responds to presses with reduced motion %s',
  (reduced) => {
    const preference = jest
      .spyOn(motion, 'useReducedMotion')
      .mockReturnValue(reduced);
    const onPress = jest.fn();
    render(
      <MindyThemeProvider>
        <HomeTile
          label="Teaching schedule"
          icon="calendar_month"
          testID="tile"
          onPress={onPress}
        />
      </MindyThemeProvider>
    );
    const tile = screen.getByRole('button', { name: 'Teaching schedule' });
    expect(
      screen.getByText('Teaching schedule').props.numberOfLines
    ).toBeUndefined();
    fireEvent(tile, 'pressIn');
    expect(tile).toHaveStyle(
      reduced ? { opacity: 0.8 } : { transform: [{ scale: 0.94 }] }
    );
    fireEvent(tile, 'pressOut');
    expect(tile).toHaveStyle({ width: '25%' });
    fireEvent.press(tile);
    expect(onPress).toHaveBeenCalledTimes(1);
    preference.mockRestore();
  }
);

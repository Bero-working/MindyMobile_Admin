import { render, screen } from '@testing-library/react-native';
import { MindyThemeProvider } from '@/components/ui/theme';
import { Footer, type QueryState } from '@/modules/teaching/components/shared';

function open(busy: boolean, count: number) {
  const query: QueryState = {
    data: { classes: [], sessions: [], students: [], units: [], total: 2 },
    result: undefined,
    busy,
    footerError: false,
    footerOffline: false,
    refresh: jest.fn().mockResolvedValue(undefined),
    retry: jest.fn().mockResolvedValue(undefined),
    more: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue(undefined),
  };
  render(
    <MindyThemeProvider>
      <Footer
        query={query}
        prefix="roster"
        count={count}
      />
    </MindyThemeProvider>
  );
}

test('loading more shows a skeleton with the load-more button footprint', () => {
  open(true, 1);
  expect(screen.getByTestId('roster-footer-skeleton')).toBeTruthy();
  expect(screen.getByRole('progressbar').props.accessibilityState.busy).toBe(
    true
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(
    screen.getByRole('button', { includeHiddenElements: true })
  ).toHaveStyle({ minHeight: 52 });
});

test('idle pagination uses the same button footprint', () => {
  open(false, 1);
  expect(screen.getByTestId('roster-more')).toHaveStyle({ minHeight: 52 });
  expect(screen.queryByRole('progressbar')).toBeNull();
});

test('refreshing a complete list does not add a footer loading placeholder', () => {
  open(true, 2);
  expect(screen.queryByTestId('roster-footer-skeleton')).toBeNull();
  expect(screen.queryByRole('progressbar')).toBeNull();
});

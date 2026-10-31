/**
 * @format
 */

import { render, screen } from '@testing-library/react-native';
import App from '../src/';

describe('App', () => {
  test('renders correctly', async () => {
    render(<App />);
    await screen.findByTestId('bootstrap-error-card');
    expect(screen.queryByTestId('mock-review-button')).toBeNull();
  });
});

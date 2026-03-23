import { render, screen } from '@testing-library/react';
import App from './App';

test('renders thumbnail wizard shell', () => {
  render(<App />);
  expect(screen.getByText(/thumbnail wizard/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^tools$/i })).toBeInTheDocument();
});

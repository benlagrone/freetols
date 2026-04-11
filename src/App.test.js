import { render, screen } from '@testing-library/react';
import App from './App';
import Tips from './Tips';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ to, children, className, end, ...props }) => (
    <a
      href={to}
      className={typeof className === 'function' ? className({ isActive: false }) : className}
      {...props}
    >
      {children}
    </a>
  )
}), { virtual: true });

test('renders thumbnail wizard shell', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /make a thumbnail that looks deliberate/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^tools$/i })).toBeInTheDocument();
});

test('renders the tips route content', () => {
  render(<Tips />);
  expect(screen.getByRole('heading', { name: /tips for thumbnails that survive the scroll/i })).toBeInTheDocument();
  expect(screen.getByText(/sacred ratios that survive the crop/i)).toBeInTheDocument();
});

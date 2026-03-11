import { render, screen } from '@testing-library/react';
import App from './App';

test('renders decks heading', () => {
  render(<App />);
  const linkElement = screen.getByText(/decks/i);
  expect(linkElement).toBeInTheDocument();
});

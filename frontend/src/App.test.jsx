import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import App from './App';
import { api } from './lib/api';

beforeEach(() => {
  vi.clearAllMocks();
  api.post.mockResolvedValue({ session_id: 'test-session' });
  api.get.mockResolvedValue({ user: { name: 'Test', email: 'test@test.com', role: 'user' } });
});

describe('App smoke test', () => {
  it('renders FoodBot heading', async () => {
    render(<App />);
    expect(await screen.findByText('FoodBot')).toBeInTheDocument();
  });
});

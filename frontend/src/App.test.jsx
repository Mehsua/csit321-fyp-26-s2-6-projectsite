import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import App from './App';
import { api } from './lib/api';

const mockRecipe = {
  recipe_id: '1',
  name: 'Chicken Tomato Pasta',
  category: 'Italian',
  cooking_time: 30,
  score: 0.85,
  matching_ingredients: ['chicken', 'garlic'],
  missing_ingredients: ['pasta', 'olive oil'],
  dietary_tags: [],
  allergens: [],
  allergen_warning: false,
  nutrition: null,
  instructions: null,
};

function setupMocks(overrides = {}) {
  api.post.mockImplementation((url) => {
    if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
    if (url === '/api/chat/extract-ingredients') return Promise.resolve({ ingredients: ['chicken', 'garlic'] });
    if (url === '/api/recipes/recommend') return Promise.resolve({ recipes: [mockRecipe] });
    if (url === '/api/chat') return Promise.resolve({ reply: 'Sure, I can help!' });
    return Promise.resolve({});
  });
  Object.entries(overrides).forEach(([url, val]) => {
    api.post.mockImplementation((u) => u === url ? Promise.resolve(val) : api.post.getMockImplementation()(u));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ user: { name: 'Test', email: 'test@test.com', role: 'user' } });
  setupMocks();
});

describe('App smoke test', () => {
  it('renders FoodBot heading', async () => {
    render(<App />);
    expect(await screen.findByText('FoodBot')).toBeInTheDocument();
  });
});

describe('Ingredient confirmation flow', () => {
  it('shows confirmation message after ingredient query instead of immediately recommending', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');

    expect(await screen.findByText(/Got it! I identified/i)).toBeInTheDocument();
    expect(screen.getByText('chicken')).toBeInTheDocument();
    expect(screen.getByText('garlic')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes, find recipes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit list/i })).toBeInTheDocument();

    // Recommend should NOT have been called yet
    expect(api.post).not.toHaveBeenCalledWith('/api/recipes/recommend', expect.anything());
  });

  it('runs recommendation and shows recipes when user confirms', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');

    await screen.findByRole('button', { name: /Yes, find recipes/i });
    await user.click(screen.getByRole('button', { name: /Yes, find recipes/i }));

    expect(await screen.findByText(/I found 1 recipe/i)).toBeInTheDocument();
    expect(screen.getByText('Chicken Tomato Pasta')).toBeInTheDocument();
  });

  it('shows edit input when user clicks Edit list', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');

    await screen.findByRole('button', { name: /Edit list/i });
    await user.click(screen.getByRole('button', { name: /Edit list/i }));

    const editInput = screen.getByDisplayValue('chicken, garlic');
    expect(editInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Find recipes/i })).toBeInTheDocument();
  });

  it('runs recommendation with edited ingredients on submit', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');

    await screen.findByRole('button', { name: /Edit list/i });
    await user.click(screen.getByRole('button', { name: /Edit list/i }));

    const editInput = screen.getByDisplayValue('chicken, garlic');
    await user.clear(editInput);
    await user.type(editInput, 'chicken, garlic, onion');

    await user.click(screen.getByRole('button', { name: /Find recipes/i }));

    expect(api.post).toHaveBeenCalledWith('/api/recipes/recommend', expect.objectContaining({
      ingredients: ['chicken', 'garlic', 'onion'],
    }));
  });

  it('falls through to general chat if no ingredients extracted', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      if (url === '/api/chat/extract-ingredients') return Promise.resolve({ ingredients: [] });
      if (url === '/api/chat') return Promise.resolve({ reply: 'I can help with that!' });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('I can help with that!')).toBeInTheDocument();
    expect(screen.queryByText(/Got it! I identified/i)).not.toBeInTheDocument();
  });
});

describe('Guest mode banner', () => {
  it('shows guest mode banner when not logged in', async () => {
    render(<App />);
    expect(await screen.findByText(/Guest Mode/i)).toBeInTheDocument();
  });

  it('does not show guest banner when logged in', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });
    api.get.mockResolvedValueOnce({
      user: { name: 'Alice', email: 'alice@test.com', role: 'registered' },
    });
    // getToken returns a value so initApp tries /api/auth/me
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/Guest Mode/i)).not.toBeInTheDocument();
    });
  });
});

describe('Login page: Continue as Guest', () => {
  it('shows Continue as Guest link on login page', async () => {
    const user = userEvent.setup();
    render(<App />);
    const signInBtn = await screen.findByRole('button', { name: /Sign in/i });
    await user.click(signInBtn);
    expect(screen.getByText(/Continue as Guest/i)).toBeInTheDocument();
  });

  it('navigates back to chat when Continue as Guest is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    const signInBtn = await screen.findByRole('button', { name: /Sign in/i });
    await user.click(signInBtn);
    await user.click(screen.getByText(/Continue as Guest/i));
    expect(await screen.findByPlaceholderText(/Type ingredients or ask a question/i)).toBeInTheDocument();
  });
});

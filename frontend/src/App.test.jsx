import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import App from './App';
import { api } from './lib/api';
import MealPlanPage from './components/MealPlanPage';
import SupportAnswerMsg from './components/SupportAnswerMsg';
import AdminPage from './components/AdminPage';

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

function setupMocks() {
  api.post.mockImplementation((url) => {
    if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
    if (url === '/api/chat/extract-ingredients') return Promise.resolve({ ingredients: ['chicken', 'garlic'] });
    if (url === '/api/recipes/recommend') return Promise.resolve({ recipes: [mockRecipe] });
    if (url === '/api/chat') return Promise.resolve({ reply: 'Sure, I can help!' });
    if (url === '/api/shopping-list/generate') return Promise.resolve({ items: [] });
    return Promise.resolve({});
  });
  api.put.mockResolvedValue({ message: 'Preferences saved' });
  api.delete.mockResolvedValue({});
}

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (url === '/api/shopping-list') return Promise.resolve({ list_id: null, items: [] });
    return Promise.resolve({});
  });
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

    // After Find recipes is clicked, the confirmed bubble should show the edited ingredient list
    await waitFor(() => {
      expect(screen.getByText('onion')).toBeInTheDocument();
    });
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
    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
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

describe('Nutrition card in RecipeModal', () => {
  it('shows nutrition values when recipe has nutrition data', async () => {
    const recipeWithNutrition = {
      ...mockRecipe,
      nutrition: { calories: 285, protein_g: 35, carbs_g: 5, fats_g: 14, fibre_g: 0.5 },
    };
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      if (url === '/api/chat/extract-ingredients') return Promise.resolve({ ingredients: ['chicken', 'garlic'] });
      if (url === '/api/recipes/recommend') return Promise.resolve({ recipes: [recipeWithNutrition] });
      if (url === '/api/chat') return Promise.resolve({ reply: 'Sure!' });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: /Yes, find recipes/i }));
    await screen.findByText('Chicken Tomato Pasta');
    await user.click(screen.getByRole('button', { name: /View instructions/i }));

    // nutrition card should show kcal value
    expect(await screen.findByText('285')).toBeInTheDocument();
    // protein/carbs/fats labels should be present
    expect(screen.getByText('protein')).toBeInTheDocument();
    expect(screen.getByText('carbs')).toBeInTheDocument();
    expect(screen.getByText('fats')).toBeInTheDocument();
  });
});

describe('Load preferences from API on auth restore', () => {
  it('calls GET /api/users/me/preferences when token present on mount', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: ['Halal'], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });

    render(<App />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/users/me/preferences');
    });
  });
});

describe('Favourites: API-backed save when logged in', () => {
  it('calls POST /api/users/me/favourites when logged-in user saves a recipe', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      if (url === '/api/chat/extract-ingredients') return Promise.resolve({ ingredients: ['chicken'] });
      if (url === '/api/recipes/recommend') return Promise.resolve({ recipes: [mockRecipe] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ message: 'Saved to favourites' });
      if (url === '/api/chat') return Promise.resolve({ reply: 'OK' });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<App />);

    // Wait for auth restore
    await waitFor(() => screen.queryByText(/Guest Mode/i) === null);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: /Yes, find recipes/i }));
    await screen.findByText('Chicken Tomato Pasta');

    // Click the Save (♡ Save) button on the recipe card
    await user.click(screen.getByRole('button', { name: /♡ Save/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/users/me/favourites', expect.objectContaining({
        recipeId: '1',
      }));
    });
  });
});

describe('Profile page: Save Preferences button', () => {
  it('shows Save Preferences button on profile page when logged in', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => screen.queryByText(/Guest Mode/i) === null);
    const profileBtn = await screen.findByTitle('👤 Profile');
    await user.click(profileBtn);

    expect(screen.getByRole('button', { name: /Save Preferences/i })).toBeInTheDocument();
  });

  it('calls PUT /api/users/me/preferences when Save Preferences is clicked', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });
    api.put.mockResolvedValue({ message: 'Preferences saved' });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => screen.queryByText(/Guest Mode/i) === null);
    const profileBtn = await screen.findByTitle('👤 Profile');
    await user.click(profileBtn);

    await user.click(screen.getByRole('button', { name: /Save Preferences/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/users/me/preferences', expect.objectContaining({
        dietaryTags: expect.any(Array),
        allergenNames: expect.any(Array),
      }));
    });
  });
});

describe('Favourites page', () => {
  it('shows Favourites topbar button when logged in', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({ count: 0, remaining: 50, favourites: [] });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });

    render(<App />);

    await waitFor(() => screen.queryByText(/Guest Mode/i) === null);
    expect(screen.getByTitle('My Favourites')).toBeInTheDocument();
  });

  it('navigates to favourites page and shows saved recipe', async () => {
    const { getToken } = await import('./lib/api');
    getToken.mockReturnValue('fake-token');

    api.get.mockImplementation((url) => {
      if (url === '/api/auth/me') return Promise.resolve({ user: { name: 'Alice', email: 'alice@test.com', role: 'registered' } });
      if (url === '/api/users/me/preferences') return Promise.resolve({ dietaryTags: [], allergenNames: [] });
      if (url === '/api/users/me/favourites') return Promise.resolve({
        count: 1, remaining: 49,
        favourites: [{
          recipe_id: 'r-01', name: 'Chicken Rendang', cooking_time: 45,
          score: 0.92, saved_at: '2026-06-11T10:00:00Z',
          dietary_tags: ['Halal'], allergens: [], nutrition: null,
        }],
      });
      return Promise.resolve({});
    });
    api.post.mockImplementation((url) => {
      if (url === '/api/sessions') return Promise.resolve({ session_id: 'test-session' });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => screen.queryByText(/Guest Mode/i) === null);
    await user.click(screen.getByTitle('My Favourites'));

    expect(await screen.findByText('My Favourites')).toBeInTheDocument();
    expect(screen.getByText('Chicken Rendang')).toBeInTheDocument();
    expect(screen.getByText('1 / 50')).toBeInTheDocument();
  });
});

describe('RecipeModal Save Favourite button', () => {
  it('shows save favourite button in recipe detail modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = await screen.findByPlaceholderText(/Type ingredients or ask a question/i);
    await user.type(textarea, 'I have chicken and garlic');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: /Yes, find recipes/i }));
    await screen.findByText('Chicken Tomato Pasta');
    await user.click(screen.getByRole('button', { name: /View instructions/i }));

    const saveBtns = await screen.findAllByRole('button', { name: /♡ Save|✓ Saved/i });
    expect(saveBtns.length).toBeGreaterThanOrEqual(2); // one in card, one in modal
  });
});

describe('Shopping list navigation', () => {
  it('renders empty shopping list page when 🛒 topbar button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cartBtn = await screen.findByTitle('Shopping List');
    await user.click(cartBtn);
    expect(await screen.findByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText(/No items yet/i)).toBeInTheDocument();
  });

  it('navigates back to chat when Back button is clicked on shopping list page', async () => {
    const user = userEvent.setup();
    render(<App />);
    const cartBtn = await screen.findByTitle('Shopping List');
    await user.click(cartBtn);
    await screen.findByText(/No items yet/i);
    const backBtn = screen.getByText('← Back');
    await user.click(backBtn);
    expect(await screen.findByPlaceholderText(/Type ingredients or ask a question/i)).toBeInTheDocument();
  });
});

describe('Session timeout', () => {
  it('shows expired notification and resets chat after 30 minutes inactivity', async () => {
    // Install fake timers before render so the useEffect setInterval is registered
    // with the fake timer system. Start Date.now at an offset so the 30-min
    // inactivity check passes on the very first 60s tick.
    const fakeStart = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(fakeStart);

    try {
      render(<App />);

      // Flush initial effects (session creation, auth check, etc.)
      await act(async () => {
        await Promise.resolve();
      });

      // Move the clock forward 31 min so Date.now() - lastActivityRef > THIRTY_MIN
      // then trigger the 60s interval tick
      await act(async () => {
        vi.advanceTimersByTime(31 * 60 * 1000);
      });

      expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  }, 15000);
});

describe('MealPlanPage', () => {
  it('shows empty state when plan is null', () => {
    render(
      <MealPlanPage
        plan={null}
        loading={false}
        onBack={vi.fn()}
        onRemoveItem={vi.fn()}
        onGeneratePlan={vi.fn()}
        onAddToShoppingList={vi.fn()}
      />
    );
    expect(screen.getByText(/No meal plan yet/i)).toBeInTheDocument();
    cleanup();
  });

  it('renders recipe name when plan has items', () => {
    const plan = {
      plan_id: 'p1',
      number_of_days: 2,
      days: [
        {
          day_number: 1,
          items: [
            {
              item_id: 'i1',
              recipe_id: 'r1',
              name: 'Lemon Garlic Chicken',
              cooking_time: 35,
              nutrition: { calories: 420, protein_g: 30, carbs_g: 15, fats_g: 18 },
              perishable_warnings: ['chicken'],
            },
          ],
          nutrition_summary: { calories: 420, protein_g: 30, carbs_g: 15, fats_g: 18 },
        },
        { day_number: 2, items: [], nutrition_summary: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 } },
      ],
    };
    render(
      <MealPlanPage
        plan={plan}
        loading={false}
        onBack={vi.fn()}
        onRemoveItem={vi.fn()}
        onGeneratePlan={vi.fn()}
        onAddToShoppingList={vi.fn()}
      />
    );
    expect(screen.getByText('Lemon Garlic Chicken')).toBeInTheDocument();
    cleanup();
  });
});

describe('SupportAnswerMsg', () => {
  test('shows question and answer when matched is true', () => {
    render(
      <SupportAnswerMsg
        matched={true}
        question="How do I add ingredients?"
        answer="Type your ingredients in the chat."
        category="Usage"
        escalated={false}
        onEscalate={() => {}}
      />
    );
    expect(screen.getByText('How do I add ingredients?')).toBeInTheDocument();
    expect(screen.getByText('Type your ingredients in the chat.')).toBeInTheDocument();
    expect(screen.getByText(/contact support/i)).toBeInTheDocument();
  });

  test('shows escalation prompt when matched is false', () => {
    render(
      <SupportAnswerMsg
        matched={false}
        escalated={false}
        onEscalate={() => {}}
      />
    );
    expect(screen.getByText(/couldn't find/i)).toBeInTheDocument();
    expect(screen.getByText(/contact support/i)).toBeInTheDocument();
  });
});

// ── AdminPage ──────────────────────────────────────────────────────────────────

describe('AdminPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalRecipes: 0, registeredUsers: 0, activeSessions: 0, unresolvedErrors: 0, recentRecipes: [], recentErrors: [] }),
    });
  });

  test('renders Admin Panel label in sidebar', () => {
    render(<AdminPage user={{ name: 'Admin', role: 'admin', isAdmin: true }} onLogout={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });

  test('renders Dashboard, Recipes, Users, Error Logs nav items in sidebar', () => {
    render(<AdminPage user={{ name: 'Admin', role: 'admin', isAdmin: true }} onLogout={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/📊 Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/📖 Recipes/i)).toBeInTheDocument();
    expect(screen.getByText(/👥 Users/i)).toBeInTheDocument();
    expect(screen.getByText(/⚠ Error Logs/i)).toBeInTheDocument();
  });
});

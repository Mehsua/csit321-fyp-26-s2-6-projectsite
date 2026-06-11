jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const UserService = require('../src/services/UserService');

beforeEach(() => jest.clearAllMocks());

// ── Helper: build a Supabase chain mock ──────────────────────────────────────
function chain(resolvedValue) {
  const c = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  };
  // Terminal calls return the resolved value
  c.eq.mockImplementation((..._args) => {
    const terminal = Object.assign({}, c);
    terminal.eq = jest.fn().mockResolvedValue(resolvedValue);
    Object.assign(c, { _terminalResolve: resolvedValue });
    return terminal;
  });
  // Make chain itself awaitable for patterns like .delete().eq().eq()
  c._resolveWith = resolvedValue;
  return c;
}

// ── getPreferences ────────────────────────────────────────────────────────────
describe('UserService.getPreferences', () => {
  test('returns empty arrays when user has no prefs', async () => {
    const dietaryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const allergenChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(dietaryChain)
      .mockReturnValueOnce(allergenChain);

    const service = new UserService();
    const result = await service.getPreferences('user-uuid');
    expect(result).toEqual({ dietaryTags: [], allergenNames: [] });
  });

  test('returns correct tag and allergen names', async () => {
    const dietaryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ dietary_tags: { name: 'Halal' } }, { dietary_tags: { name: 'Vegan' } }],
        error: null,
      }),
    };
    const allergenChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ allergens: { name: 'Peanuts' } }],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(dietaryChain)
      .mockReturnValueOnce(allergenChain);

    const service = new UserService();
    const result = await service.getPreferences('user-uuid');
    expect(result.dietaryTags).toEqual(['Halal', 'Vegan']);
    expect(result.allergenNames).toEqual(['Peanuts']);
  });
});

// ── setPreferences ────────────────────────────────────────────────────────────
describe('UserService.setPreferences', () => {
  function mockSetPrefs({ tagRows = [], allergenRows = [] } = {}) {
    const selectTagChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: tagRows, error: null }),
    };
    const selectAllergenChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: allergenRows, error: null }),
    };
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(selectTagChain)
      .mockReturnValueOnce(selectAllergenChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);
  }

  test('inserts dietary tag IDs and allergen IDs after lookup', async () => {
    mockSetPrefs({
      tagRows: [{ tag_id: 'tid-1', name: 'Halal' }],
      allergenRows: [{ allergen_id: 'aid-1', name: 'Peanuts' }],
    });

    const service = new UserService();
    await expect(service.setPreferences('user-uuid', {
      dietaryTags: ['Halal'],
      allergenNames: ['Peanuts'],
    })).resolves.toBeUndefined();

    expect(supabaseAdmin.from).toHaveBeenCalledTimes(6);
  });

  test('handles empty dietaryTags and allergenNames (no inserts needed)', async () => {
    const selectTagChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const selectAllergenChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(selectTagChain)
      .mockReturnValueOnce(selectAllergenChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(deleteChain);

    const service = new UserService();
    await expect(service.setPreferences('user-uuid', {
      dietaryTags: [],
      allergenNames: [],
    })).resolves.toBeUndefined();

    expect(supabaseAdmin.from).toHaveBeenCalledTimes(4);
  });
});

// ── getFavourites ─────────────────────────────────────────────────────────────
describe('UserService.getFavourites', () => {
  test('returns empty favourites for user with none', async () => {
    const favChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(favChain);

    const service = new UserService();
    const result = await service.getFavourites('user-uuid');
    expect(result).toEqual({ count: 0, remaining: 50, favourites: [] });
  });

  test('returns mapped favourites with recipe data', async () => {
    const mockData = [{
      saved_at: '2026-06-11T10:00:00Z',
      score: 0.92,
      recipes: {
        recipe_id: 'r-01',
        name: 'Chicken Rendang',
        cooking_time: 45,
        category: 'Asian',
        recipe_dietary_tags: [{ dietary_tags: { name: 'Halal' } }],
        recipe_allergens: [],
        nutrition_info: { calories: 420, protein_g: 35, carbs_g: 10, fats_g: 20 },
      },
    }];
    const favChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(favChain);

    const service = new UserService();
    const result = await service.getFavourites('user-uuid');
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(49);
    expect(result.favourites[0].name).toBe('Chicken Rendang');
    expect(result.favourites[0].score).toBe(0.92);
    expect(result.favourites[0].dietary_tags).toEqual(['Halal']);
  });
});

// ── addFavourite ──────────────────────────────────────────────────────────────
describe('UserService.addFavourite', () => {
  test('inserts favourite when under limit', async () => {
    const countChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    const service = new UserService();
    await expect(service.addFavourite('user-uuid', 'r-01', 0.92)).resolves.toBeUndefined();
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-uuid', recipe_id: 'r-01', score: 0.92 })
    );
  });

  test('throws 409 when limit of 50 reached', async () => {
    const countChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 50, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(countChain);

    const service = new UserService();
    await expect(service.addFavourite('user-uuid', 'r-01')).rejects.toMatchObject({
      status: 409,
    });
  });

  test('throws 409 on duplicate (unique constraint error code 23505)', async () => {
    const countChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    const service = new UserService();
    await expect(service.addFavourite('user-uuid', 'r-01')).rejects.toMatchObject({
      status: 409,
    });
  });
});

// ── removeFavourite ───────────────────────────────────────────────────────────
describe('UserService.removeFavourite', () => {
  test('deletes the correct row', async () => {
    const delChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    delChain.eq
      .mockReturnValueOnce(delChain)
      .mockResolvedValueOnce({ error: null });
    supabaseAdmin.from = jest.fn().mockReturnValue(delChain);

    const service = new UserService();
    await expect(service.removeFavourite('user-uuid', 'r-01')).resolves.toBeUndefined();
    expect(supabaseAdmin.from).toHaveBeenCalledWith('user_favourites');
  });
});

jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const ShoppingListService = require('../src/services/ShoppingListService');

beforeEach(() => jest.clearAllMocks());

// ── generateMissingItems ──────────────────────────────────────────────────────

describe('ShoppingListService.generateMissingItems', () => {
  test('returns empty array when recipe not found', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    });
    const service = new ShoppingListService();
    const result = await service.generateMissingItems('bad-id', []);
    expect(result).toEqual([]);
  });

  test('returns all recipe ingredients when sessionIngredients is empty', async () => {
    const recipesChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: 'Tomato Pasta' }, error: null }),
    };
    const riChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { quantity: 200, unit: 'g', ingredients: { ingredient_id: 'uuid-1', name: 'pasta', category: 'Pantry' } },
          { quantity: 2, unit: 'tbsp', ingredients: { ingredient_id: 'uuid-2', name: 'olive oil', category: 'Pantry' } },
        ],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(recipesChain)
      .mockReturnValueOnce(riChain);

    const service = new ShoppingListService();
    const result = await service.generateMissingItems('recipe-uuid', []);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'pasta', category: 'Pantry', recipe_name: 'Tomato Pasta' });
  });

  test('excludes ingredients already in sessionIngredients (case-insensitive)', async () => {
    const recipesChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: 'Tomato Pasta' }, error: null }),
    };
    const riChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { quantity: 200, unit: 'g', ingredients: { ingredient_id: 'uuid-1', name: 'pasta', category: 'Pantry' } },
          { quantity: 2, unit: 'cloves', ingredients: { ingredient_id: 'uuid-2', name: 'garlic', category: 'Produce' } },
        ],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(recipesChain)
      .mockReturnValueOnce(riChain);

    const service = new ShoppingListService();
    const result = await service.generateMissingItems('recipe-uuid', ['Garlic', 'Onion']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('pasta');
  });

  test('returns empty array when user already has all ingredients', async () => {
    const recipesChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: 'Tomato Pasta' }, error: null }),
    };
    const riChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { quantity: 200, unit: 'g', ingredients: { ingredient_id: 'uuid-1', name: 'pasta', category: 'Pantry' } },
        ],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(recipesChain)
      .mockReturnValueOnce(riChain);

    const service = new ShoppingListService();
    const result = await service.generateMissingItems('recipe-uuid', ['pasta']);
    expect(result).toEqual([]);
  });
});

// ── saveList ──────────────────────────────────────────────────────────────────

describe('ShoppingListService.saveList', () => {
  test('creates new list when user has none', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { list_id: 'new-list-uuid' }, error: null }),
    };
    const upsertChain = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(upsertChain);

    const service = new ShoppingListService();
    const listId = await service.saveList('user-uuid', [
      { ingredient_id: 'uuid-1', quantity: 200, unit: 'g' },
    ]);
    expect(listId).toBe('new-list-uuid');
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ list_id: 'new-list-uuid', ingredient_id: 'uuid-1' })]),
      expect.objectContaining({ onConflict: 'list_id,ingredient_id' })
    );
  });

  test('reuses existing list when user already has one', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ list_id: 'existing-uuid' }], error: null }),
    };
    const upsertChain = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(upsertChain);

    const service = new ShoppingListService();
    const listId = await service.saveList('user-uuid', [
      { ingredient_id: 'uuid-1', quantity: 1, unit: 'cup' },
    ]);
    expect(listId).toBe('existing-uuid');
  });

  test('skips upsert when items array is empty', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ list_id: 'existing-uuid' }], error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValueOnce(selectChain);

    const service = new ShoppingListService();
    await service.saveList('user-uuid', []);
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
  });
});

// ── getList ───────────────────────────────────────────────────────────────────

describe('ShoppingListService.getList', () => {
  test('returns empty list when user has no shopping list', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValueOnce(selectChain);

    const service = new ShoppingListService();
    const result = await service.getList('user-uuid');
    expect(result).toEqual({ list_id: null, items: [] });
  });

  test('returns mapped items with ingredient details', async () => {
    const listsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ list_id: 'list-uuid' }], error: null }),
    };
    const itemsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          {
            item_id: 'item-1',
            quantity: 3,
            unit: 'stalks',
            is_checked: false,
            ingredients: { ingredient_id: 'uuid-1', name: 'lemongrass', category: 'Produce' },
          },
        ],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(listsChain)
      .mockReturnValueOnce(itemsChain);

    const service = new ShoppingListService();
    const result = await service.getList('user-uuid');
    expect(result.list_id).toBe('list-uuid');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      item_id: 'item-1',
      name: 'lemongrass',
      category: 'Produce',
      quantity: 3,
      unit: 'stalks',
      is_checked: false,
    });
  });
});

// ── clearList ─────────────────────────────────────────────────────────────────

describe('ShoppingListService.clearList', () => {
  test('calls delete on shopping_lists for the given userId', async () => {
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValueOnce(deleteChain);

    const service = new ShoppingListService();
    await service.clearList('user-uuid');
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'user-uuid');
  });
});

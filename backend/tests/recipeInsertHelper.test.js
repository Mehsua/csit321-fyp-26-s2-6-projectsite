jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const { insertRecipe } = require('../src/services/recipeInsertHelper');

beforeEach(() => jest.clearAllMocks());

function recipesChain(data) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };
}

describe('insertRecipe', () => {
  test('inserts recipe row with given source and returns it', async () => {
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') return recipesChain({ recipe_id: 'r-new', name: 'Test Recipe', source: 'db' });
      return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const result = await insertRecipe({ name: 'Test Recipe', source: 'db' });

    expect(result.recipe_id).toBe('r-new');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('recipes');
  });

  test('creates a new ingredient with category when it does not already exist', async () => {
    const insertedIngredients = [];
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') return recipesChain({ recipe_id: 'r-new', name: 'Beetroot Bowl', source: 'ai' });
      if (table === 'ingredients') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: jest.fn((rows) => {
            insertedIngredients.push(...rows);
            return { select: jest.fn().mockResolvedValue({ data: rows.map((r, i) => ({ ingredient_id: `ing-${i}`, name: r.name })), error: null }) };
          }),
        };
      }
      return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }), insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    await insertRecipe({ name: 'Beetroot Bowl', source: 'ai', ingredients: [{ name: 'beetroot', category: 'Produce' }] });

    expect(insertedIngredients).toEqual([{ name: 'beetroot', category: 'Produce' }]);
  });

  test('links an existing ingredient without re-creating it', async () => {
    const linkedIngredientIds = [];
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') return recipesChain({ recipe_id: 'r-new', name: 'Chicken Bowl' });
      if (table === 'ingredients') return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [{ ingredient_id: 'ing-1', name: 'chicken' }], error: null }) };
      if (table === 'recipe_ingredients') {
        return { insert: jest.fn((rows) => { linkedIngredientIds.push(...rows.map(r => r.ingredient_id)); return Promise.resolve({ error: null }); }) };
      }
      return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    await insertRecipe({ name: 'Chicken Bowl', ingredients: [{ name: 'chicken' }] });

    expect(linkedIngredientIds).toEqual(['ing-1']);
  });

  test('inserts nutrition_info when nutrition is provided', async () => {
    let nutritionPayload = null;
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') return recipesChain({ recipe_id: 'r-new', name: 'Test Recipe' });
      if (table === 'nutrition_info') return { insert: jest.fn((payload) => { nutritionPayload = payload; return Promise.resolve({ error: null }); }) };
      return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    await insertRecipe({ name: 'Test Recipe', nutrition: { calories: 210, protein_g: 4, carbs_g: 32, fats_g: 8, fibre_g: 6 } });

    expect(nutritionPayload).toEqual({ recipe_id: 'r-new', calories: 210, protein_g: 4, carbs_g: 32, fats_g: 8, fibre_g: 6 });
  });

  test('deduplicates ingredients by case-insensitive name, keeping only one', async () => {
    const insertedIngredients = [];
    const linkedIngredientIds = [];
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') return recipesChain({ recipe_id: 'r-new', name: 'Vinaigrette Chicken', source: 'ai' });
      if (table === 'ingredients') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: jest.fn((rows) => {
            insertedIngredients.push(...rows);
            return { select: jest.fn().mockResolvedValue({ data: rows.map((r, i) => ({ ingredient_id: `ing-${i}`, name: r.name })), error: null }) };
          }),
        };
      }
      if (table === 'recipe_ingredients') {
        return { insert: jest.fn((rows) => { linkedIngredientIds.push(...rows.map(r => r.ingredient_id)); return Promise.resolve({ error: null }); }) };
      }
      return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    await insertRecipe({
      name: 'Vinaigrette Chicken',
      source: 'ai',
      ingredients: [
        { name: 'olive oil', category: 'Pantry' },
        { name: 'Olive Oil', category: 'Pantry' },
      ],
    });

    expect(insertedIngredients).toEqual([{ name: 'olive oil', category: 'Pantry' }]);
    expect(linkedIngredientIds).toEqual(['ing-0']);
  });

  test('throws when the recipe insert itself fails', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
    });

    await expect(insertRecipe({ name: 'Broken' })).rejects.toThrow('insert failed');
  });
});

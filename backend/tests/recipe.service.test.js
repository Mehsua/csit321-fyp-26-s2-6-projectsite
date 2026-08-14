jest.mock('../src/db/supabase');
jest.mock('../src/services/OpenAIService');
jest.mock('../src/services/recipeInsertHelper');

const { supabaseAdmin } = require('../src/db/supabase');
const RecipeService = require('../src/services/RecipeService');
const OpenAIService = require('../src/services/OpenAIService');
const { insertRecipe } = require('../src/services/recipeInsertHelper');

// Two mock recipes used across all tests
const MOCK_CHICKEN = {
  recipe_id: 'r-uuid-1',
  name: 'Lemon Garlic Chicken',
  description: 'A simple chicken dish.',
  instructions: '1. Season chicken. 2. Cook.',
  cooking_time: 35,
  servings: 2,
  category: 'Western',
  source: 'db',
  is_active: true,
  recipe_ingredients: [
    { is_optional: false, ingredients: { name: 'chicken' } },
    { is_optional: false, ingredients: { name: 'garlic' } },
    { is_optional: false, ingredients: { name: 'lemon' } },
    { is_optional: false, ingredients: { name: 'olive oil' } }
  ],
  recipe_dietary_tags: [{ dietary_tags: { name: 'Halal' } }, { dietary_tags: { name: 'GlutenFree' } }],
  recipe_allergens: [],
  nutrition_info: { calories: 320, protein_g: 28, carbs_g: 5, fats_g: 12, fibre_g: 1 }
};

const MOCK_PASTA = {
  recipe_id: 'r-uuid-2',
  name: 'Tomato Pasta',
  description: 'Italian pasta.',
  instructions: '1. Boil pasta. 2. Make sauce.',
  cooking_time: 25,
  servings: 2,
  category: 'Italian',
  source: 'db',
  is_active: true,
  recipe_ingredients: [
    { is_optional: false, ingredients: { name: 'pasta' } },
    { is_optional: false, ingredients: { name: 'tomato' } },
    { is_optional: false, ingredients: { name: 'garlic' } },
    { is_optional: false, ingredients: { name: 'basil' } }
  ],
  recipe_dietary_tags: [{ dietary_tags: { name: 'Vegetarian' } }],
  recipe_allergens: [{ allergens: { name: 'Gluten' } }],
  nutrition_info: null
};

function mockRecommendQuery(data, error = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data, error })
  };
  supabaseAdmin.from = jest.fn().mockReturnValue(chain);
}

function mockGetByIdQuery(data, error = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error })
  };
  supabaseAdmin.from = jest.fn().mockReturnValue(chain);
}

describe('RecipeService.recommend', () => {
  let svc;
  beforeEach(() => { svc = new RecipeService(); });
  afterEach(() => jest.clearAllMocks());

  it('returns scored recipes sorted by score descending', async () => {
    mockRecommendQuery([MOCK_CHICKEN, MOCK_PASTA]);

    // chicken + garlic match CHICKEN (2/4 = 0.5 − 2*0.05 = 0.4)
    // garlic matches PASTA (1/4 = 0.25 − 3*0.05 = 0.1)
    const results = await svc.recommend({ ingredients: ['chicken', 'garlic'] });

    expect(results.length).toBe(2);
    expect(results[0].recipe_id).toBe('r-uuid-1');
    expect(results[0].score).toBeCloseTo(0.4);
    expect(results[1].recipe_id).toBe('r-uuid-2');
    expect(results[1].score).toBeCloseTo(0.1);
  });

  it('returns empty array when no ingredients match any recipe', async () => {
    mockRecommendQuery([MOCK_CHICKEN, MOCK_PASTA]);

    const results = await svc.recommend({ ingredients: ['tofu', 'tempeh'] });
    expect(results).toEqual([]);
  });

  it('populates matching_ingredients and missing_ingredients correctly', async () => {
    mockRecommendQuery([MOCK_CHICKEN]);

    const results = await svc.recommend({ ingredients: ['chicken', 'garlic'] });

    expect(results[0].matching_ingredients).toEqual(expect.arrayContaining(['chicken', 'garlic']));
    expect(results[0].missing_ingredients).toEqual(expect.arrayContaining(['lemon', 'olive oil']));
    expect(results[0].total_ingredients).toBe(4);
  });

  it('excludes recipes that do not have all requested dietary tags', async () => {
    mockRecommendQuery([MOCK_CHICKEN, MOCK_PASTA]);

    // PASTA is only Vegetarian, not Halal → excluded when Halal filter is active
    const results = await svc.recommend({ ingredients: ['garlic', 'chicken'], dietaryTags: ['Halal'] });

    expect(results.length).toBe(1);
    expect(results[0].recipe_id).toBe('r-uuid-1');
  });

  it('returns empty array when dietary filter excludes all recipes', async () => {
    mockRecommendQuery([MOCK_CHICKEN, MOCK_PASTA]);

    const results = await svc.recommend({ ingredients: ['garlic'], dietaryTags: ['Vegan'] });
    expect(results).toEqual([]);
  });

  it('flags allergen_warning when recipe contains a user allergen', async () => {
    mockRecommendQuery([MOCK_PASTA]);

    const results = await svc.recommend({ ingredients: ['pasta', 'garlic'], allergenNames: ['Gluten'] });

    expect(results[0].allergen_warning).toBe(true);
  });

  it('does not flag allergen_warning when recipe has no matching allergen', async () => {
    mockRecommendQuery([MOCK_CHICKEN]);

    const results = await svc.recommend({ ingredients: ['chicken', 'garlic'], allergenNames: ['Gluten'] });

    expect(results[0].allergen_warning).toBe(false);
  });

  it('allergen matching is case-insensitive and handles egg vs Eggs', async () => {
    const MOCK_EGG_RECIPE = {
      ...MOCK_CHICKEN,
      recipe_id: 'r-uuid-3',
      recipe_allergens: [{ allergens: { name: 'Eggs' } }]
    };
    mockRecommendQuery([MOCK_EGG_RECIPE]);

    const results = await svc.recommend({ ingredients: ['chicken'], allergenNames: ['egg'] });
    expect(results[0].allergen_warning).toBe(true);
  });

  it('returns at most 5 results even when more recipes match', async () => {
    const manyRecipes = Array.from({ length: 8 }, (_, i) => ({
      ...MOCK_CHICKEN,
      recipe_id: `r-uuid-${i}`,
      name: `Recipe ${i}`
    }));
    mockRecommendQuery(manyRecipes);

    const results = await svc.recommend({ ingredients: ['chicken', 'garlic', 'lemon', 'olive oil'] });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('throws when Supabase returns an error', async () => {
    mockRecommendQuery(null, { message: 'DB connection failed' });

    await expect(svc.recommend({ ingredients: ['chicken'] })).rejects.toThrow('DB connection failed');
  });

  it('returns null nutrition when recipe has no nutrition_info', async () => {
    mockRecommendQuery([MOCK_PASTA]);

    const results = await svc.recommend({ ingredients: ['pasta', 'tomato', 'garlic', 'basil'] });

    expect(results[0].nutrition).toBeNull();
  });

  it('requires ALL requested dietary tags to match (AND logic)', async () => {
    mockRecommendQuery([MOCK_CHICKEN, MOCK_PASTA]);

    // MOCK_CHICKEN has [Halal, GlutenFree]. Request [Halal, Vegan] → neither recipe has both
    const results = await svc.recommend({ ingredients: ['garlic'], dietaryTags: ['Halal', 'Vegan'] });

    expect(results).toEqual([]);
  });
});

describe('RecipeService.recommend — zero-match AI generation', () => {
  let svc;
  beforeEach(() => { svc = new RecipeService(); });
  afterEach(() => jest.clearAllMocks());

  test('generates and returns an AI recipe when no DB recipes match', async () => {
    const mockOpenAI = {
      generateRecipe: jest.fn().mockResolvedValue({
        name: 'Beetroot Bowl',
        category: 'Salad',
        cooking_time: 20,
        servings: 2,
        instructions: '1. Roast beetroot.\n2. Serve.',
        ingredients: [{ name: 'beetroot', category: 'Produce' }],
        dietary_tags: ['Vegan'],
        allergens: [],
        nutrition: { calories: 180, protein_g: 3, carbs_g: 20, fats_g: 6, fibre_g: 5 },
      }),
    };
    OpenAIService.mockImplementation(() => mockOpenAI);
    insertRecipe.mockResolvedValue({ recipe_id: 'r-ai-1' });

    let recipesCallCount = 0;
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') {
        recipesCallCount++;
        if (recipesCallCount === 1) {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              recipe_id: 'r-ai-1', name: 'Beetroot Bowl', description: null,
              instructions: '1. Roast beetroot.\n2. Serve.', cooking_time: 20, servings: 2,
              category: 'Salad', source: 'ai',
              recipe_ingredients: [{ is_optional: false, ingredients: { name: 'beetroot' } }],
              recipe_dietary_tags: [{ dietary_tags: { name: 'Vegan' } }],
              recipe_allergens: [],
              nutrition_info: { calories: 180, protein_g: 3, carbs_g: 20, fats_g: 6, fibre_g: 5 },
            },
            error: null,
          }),
        };
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const result = await svc.recommend({ ingredients: ['beetroot'] });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('ai');
    expect(result[0].name).toBe('Beetroot Bowl');
    expect(result[0].matching_ingredients).toEqual(['beetroot']);
    expect(insertRecipe).toHaveBeenCalledWith(expect.objectContaining({ source: 'ai', name: 'Beetroot Bowl' }));
  });

  test('resolves to empty array when the generated recipe rescored at zero match', async () => {
    const mockOpenAI = {
      generateRecipe: jest.fn().mockResolvedValue({
        name: 'Quinoa Salad',
        category: 'Salad',
        cooking_time: 15,
        servings: 2,
        instructions: '1. Cook quinoa.\n2. Serve.',
        ingredients: [{ name: 'quinoa', category: 'Pantry' }],
        dietary_tags: ['Vegan'],
        allergens: [],
        nutrition: { calories: 150, protein_g: 5, carbs_g: 25, fats_g: 2, fibre_g: 3 },
      }),
    };
    OpenAIService.mockImplementation(() => mockOpenAI);
    insertRecipe.mockResolvedValue({ recipe_id: 'r-ai-2' });

    let recipesCallCount = 0;
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') {
        recipesCallCount++;
        if (recipesCallCount === 1) {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              recipe_id: 'r-ai-2', name: 'Quinoa Salad', description: null,
              instructions: '1. Cook quinoa.\n2. Serve.', cooking_time: 15, servings: 2,
              category: 'Salad', source: 'ai',
              // Generated ingredient ('quinoa') does not match the user-supplied ingredient
              // ('beetroot'), so _scoreRecipe computes a score of 0 for this recipe.
              recipe_ingredients: [{ is_optional: false, ingredients: { name: 'quinoa' } }],
              recipe_dietary_tags: [{ dietary_tags: { name: 'Vegan' } }],
              recipe_allergens: [],
              nutrition_info: { calories: 150, protein_g: 5, carbs_g: 25, fats_g: 2, fibre_g: 3 },
            },
            error: null,
          }),
        };
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const result = await svc.recommend({ ingredients: ['beetroot'] });

    expect(result).toEqual([]);
  });

  test('resolves to empty array when generation fails after zero DB matches', async () => {
    const mockOpenAI = { generateRecipe: jest.fn().mockResolvedValue(null) };
    OpenAIService.mockImplementation(() => mockOpenAI);

    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await svc.recommend({ ingredients: ['durian', 'unobtainium'] });

    expect(result).toEqual([]);
    expect(insertRecipe).not.toHaveBeenCalled();
  });
});

describe('RecipeService.getById', () => {
  let svc;
  beforeEach(() => { svc = new RecipeService(); });
  afterEach(() => jest.clearAllMocks());

  it('returns full recipe data for a valid recipe_id', async () => {
    mockGetByIdQuery(MOCK_CHICKEN);

    const result = await svc.getById('r-uuid-1');

    expect(result).not.toBeNull();
    expect(result.recipe_id).toBe('r-uuid-1');
    expect(result.name).toBe('Lemon Garlic Chicken');
  });

  it('returns null when Supabase returns PGRST116 (row not found)', async () => {
    mockGetByIdQuery(null, { code: 'PGRST116', message: 'Row not found' });

    const result = await svc.getById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('returns null when recipe is inactive (is_active = false)', async () => {
    mockGetByIdQuery({ ...MOCK_CHICKEN, is_active: false });

    const result = await svc.getById('r-uuid-1');
    expect(result).toBeNull();
  });

  it('throws on non-404 Supabase errors', async () => {
    mockGetByIdQuery(null, { code: '500', message: 'Internal error' });

    await expect(svc.getById('r-uuid-1')).rejects.toThrow('Internal error');
  });
});

jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const MealPlanService = require('../src/services/MealPlanService');

beforeEach(() => jest.clearAllMocks());

// ── generateAndSavePlan ───────────────────────────────────────────────────────

describe('MealPlanService.generateAndSavePlan', () => {
  const mockRecipes = [
    {
      recipe_id: 'r1',
      name: 'Chicken Dish',
      cooking_time: 30,
      recipe_ingredients: [
        { is_optional: false, ingredients: { name: 'chicken', is_perishable: true } },
        { is_optional: false, ingredients: { name: 'garlic', is_perishable: false } },
      ],
      recipe_dietary_tags: [],
      nutrition_info: { calories: 400, protein_g: 30, carbs_g: 20, fats_g: 15 },
    },
    {
      recipe_id: 'r2',
      name: 'Pasta Dish',
      cooking_time: 20,
      recipe_ingredients: [
        { is_optional: false, ingredients: { name: 'pasta', is_perishable: false } },
        { is_optional: false, ingredients: { name: 'tomato', is_perishable: true } },
      ],
      recipe_dietary_tags: [],
      nutrition_info: { calories: 300, protein_g: 10, carbs_g: 50, fats_g: 8 },
    },
    {
      recipe_id: 'r3',
      name: 'Garlic Rice',
      cooking_time: 15,
      recipe_ingredients: [
        { is_optional: false, ingredients: { name: 'rice', is_perishable: false } },
        { is_optional: false, ingredients: { name: 'garlic', is_perishable: false } },
      ],
      recipe_dietary_tags: [],
      nutrition_info: { calories: 200, protein_g: 5, carbs_g: 40, fats_g: 2 },
    },
  ];

  function mockRecipesFetch(recipes = mockRecipes) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: recipes, error: null }),
    };
  }

  function mockInsertPlan(planId = 'plan-uuid') {
    return {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { plan_id: planId }, error: null }),
    };
  }

  function mockInsertItems() {
    return {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
  }

  test('assigns perishable-ingredient recipes to Day 1', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch())
      .mockReturnValueOnce(mockInsertPlan())
      .mockReturnValueOnce(mockInsertItems());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan(
      'user-uuid',
      ['chicken', 'garlic', 'pasta', 'tomato', 'rice'],
      3
    );

    expect(result.days[0].day_number).toBe(1);
    const day1Names = result.days[0].recipes.map(r => r.name);
    expect(day1Names).toContain('Chicken Dish');
  });

  test('returns top_up_items for ingredients not in session', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch())
      .mockReturnValueOnce(mockInsertPlan())
      .mockReturnValueOnce(mockInsertItems());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan('user-uuid', ['chicken'], 3);

    expect(result.top_up_items.length).toBeGreaterThan(0);
    expect(result.top_up_items.map(i => i.name)).toContain('garlic');
  });

  test('skips recipes with score 0 (no matching ingredients)', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch())
      .mockReturnValueOnce(mockInsertPlan())
      .mockReturnValueOnce(mockInsertItems());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan('user-uuid', ['chicken', 'garlic'], 3);

    const allRecipes = result.days.flatMap(d => d.recipes);
    const names = allRecipes.map(r => r.name);
    expect(names).not.toContain('Pasta Dish');
    expect(names).not.toContain('Garlic Rice');
  });

  test('does not save to DB when userId is null', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan(null, ['chicken', 'garlic', 'pasta', 'tomato', 'rice'], 3);

    expect(result.plan_id).toBeNull();
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
  });

  test('computes daily nutrition_summary correctly', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch())
      .mockReturnValueOnce(mockInsertPlan())
      .mockReturnValueOnce(mockInsertItems());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan(
      'user-uuid',
      ['chicken', 'garlic', 'pasta', 'tomato', 'rice'],
      1
    );

    const day1 = result.days[0];
    expect(day1.nutrition_summary.calories).toBeGreaterThan(0);
  });

  test('returns empty days when no recipes match session ingredients', async () => {
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(mockRecipesFetch());

    const service = new MealPlanService();
    const result = await service.generateAndSavePlan(null, [], 3);

    const allRecipes = result.days.flatMap(d => d.recipes);
    expect(allRecipes).toHaveLength(0);
  });
});

// ── getPlan ───────────────────────────────────────────────────────────────────

describe('MealPlanService.getPlan', () => {
  test('returns null when user has no plan', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const service = new MealPlanService();
    const result = await service.getPlan('user-uuid');
    expect(result).toBeNull();
  });

  test('returns plan with days and items', async () => {
    const plansChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ plan_id: 'plan-1', number_of_days: 2, created_at: '2026-06-12' }],
        error: null,
      }),
    };
    const itemsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            item_id: 'item-1',
            day_number: 1,
            recipes: { recipe_id: 'r1', name: 'Chicken Dish', cooking_time: 30, nutrition_info: { calories: 400, protein_g: 30, carbs_g: 20, fats_g: 15 } },
          },
        ],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(plansChain)
      .mockReturnValueOnce(itemsChain);

    const service = new MealPlanService();
    const result = await service.getPlan('user-uuid');
    expect(result.plan_id).toBe('plan-1');
    expect(result.days).toHaveLength(2);
    expect(result.days[0].items).toHaveLength(1);
    expect(result.days[0].items[0].name).toBe('Chicken Dish');
    expect(result.days[0].nutrition_summary.calories).toBe(400);
  });
});

// ── deletePlanItem ────────────────────────────────────────────────────────────

describe('MealPlanService.deletePlanItem', () => {
  test('throws 404 when item not found', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const service = new MealPlanService();
    await expect(service.deletePlanItem('user-uuid', 'bad-item')).rejects.toMatchObject({ status: 404 });
  });

  test('deletes item when it belongs to the user', async () => {
    const fetchChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { item_id: 'item-1', meal_plans: { user_id: 'user-uuid' } },
        error: null,
      }),
    };
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(deleteChain);

    const service = new MealPlanService();
    await service.deletePlanItem('user-uuid', 'item-1');
    expect(deleteChain.delete).toHaveBeenCalled();
  });
});

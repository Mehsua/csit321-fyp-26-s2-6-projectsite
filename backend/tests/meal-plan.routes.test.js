const request = require('supertest');
const app = require('../server');

jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');

// Mock JWT authentication as a registered user
jest.mock('../src/middleware/authenticate', () => (req, _res, next) => {
  req.user = { id: 'user-uuid', role: 'registered' };
  next();
});

beforeEach(() => jest.clearAllMocks());

// POST /api/meal-plan/generate

describe('POST /api/meal-plan/generate', () => {
  test('returns 400 when sessionIngredients is not an array', async () => {
    const res = await request(app)
      .post('/api/meal-plan/generate')
      .send({ sessionIngredients: 'chicken' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/array/);
  });

  test('returns 400 when numDays is out of range', async () => {
    const res = await request(app)
      .post('/api/meal-plan/generate')
      .send({ sessionIngredients: [], numDays: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/numDays/);
  });

  test('returns 201 and plan when called with valid body', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { plan_id: 'plan-1' }, error: null }),
    });

    const res = await request(app)
      .post('/api/meal-plan/generate')
      .send({ sessionIngredients: ['chicken', 'garlic'], numDays: 2 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('days');
    expect(res.body).toHaveProperty('top_up_items');
  });
});

// GET /api/meal-plan

describe('GET /api/meal-plan', () => {
  test('returns { plan: null } when user has no plan', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const res = await request(app).get('/api/meal-plan');
    expect(res.status).toBe(200);
    expect(res.body.plan).toBeNull();
  });

  test('returns plan object when plan exists', async () => {
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
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(plansChain)
      .mockReturnValueOnce(itemsChain);

    const res = await request(app).get('/api/meal-plan');
    expect(res.status).toBe(200);
    expect(res.body.plan.plan_id).toBe('plan-1');
    expect(res.body.plan.days).toHaveLength(2);
  });
});

// DELETE /api/meal-plan/items/:itemId

describe('DELETE /api/meal-plan/items/:itemId', () => {
  test('returns 404 when item not found', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await request(app).delete('/api/meal-plan/items/bad-item');
    expect(res.status).toBe(404);
  });

  test('returns 204 when item deleted successfully', async () => {
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

    const res = await request(app).delete('/api/meal-plan/items/item-1');
    expect(res.status).toBe(204);
  });
});

// POST /api/meal-plan/items

describe('POST /api/meal-plan/items', () => {
  test('returns 400 when recipeId is missing', async () => {
    const res = await request(app)
      .post('/api/meal-plan/items')
      .send({ dayNumber: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/recipeId/);
  });

  test('returns 201 when recipe added to plan', async () => {
    const plansChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ plan_id: 'plan-1', number_of_days: 3 }],
        error: null,
      }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(plansChain)
      .mockReturnValueOnce(insertChain);

    const res = await request(app)
      .post('/api/meal-plan/items')
      .send({ recipeId: 'r1', dayNumber: 1 });
    expect(res.status).toBe(201);
    expect(res.body.plan_id).toBe('plan-1');
  });
});

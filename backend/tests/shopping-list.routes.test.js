jest.mock('../src/db/supabase');
jest.mock('../src/services/ShoppingListService');
const { supabaseAdmin } = require('../src/db/supabase');
const ShoppingListService = require('../src/services/ShoppingListService');
const request = require('supertest');
const app = require('../server');

const MOCK_REGISTERED_USER = {
  user_id: 'user-uuid',
  email: 'test@test.com',
  name: 'Test User',
  role: 'registered',
  is_locked: false,
  lock_until: null,
  is_active: true,
};

function mockAuthUser(userRow = MOCK_REGISTERED_USER) {
  supabaseAdmin.auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: userRow.user_id } }, error: null }),
  };
  supabaseAdmin.from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: userRow, error: null }),
  });
}

let mockGenerate, mockSaveList, mockGetList, mockClearList;

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerate = jest.fn().mockResolvedValue([
    { ingredient_id: 'ing-1', name: 'pasta', category: 'Pantry', quantity: 200, unit: 'g', recipe_name: 'Tomato Pasta' },
  ]);
  mockSaveList = jest.fn().mockResolvedValue('list-uuid');
  mockGetList = jest.fn().mockResolvedValue({
    list_id: 'list-uuid',
    items: [{ item_id: 'item-1', name: 'pasta', category: 'Pantry', quantity: 200, unit: 'g', is_checked: false }],
  });
  mockClearList = jest.fn().mockResolvedValue(undefined);
  ShoppingListService.prototype.generateMissingItems = mockGenerate;
  ShoppingListService.prototype.saveList = mockSaveList;
  ShoppingListService.prototype.getList = mockGetList;
  ShoppingListService.prototype.clearList = mockClearList;
});

// ── POST /api/shopping-list/generate ─────────────────────────────────────────

describe('POST /api/shopping-list/generate', () => {
  test('400 when recipeId is missing', async () => {
    const res = await request(app)
      .post('/api/shopping-list/generate')
      .send({ sessionIngredients: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/recipeId/i);
  });

  test('400 when sessionIngredients is not an array', async () => {
    const res = await request(app)
      .post('/api/shopping-list/generate')
      .send({ recipeId: 'recipe-uuid', sessionIngredients: 'not-an-array' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sessionIngredients/i);
  });

  test('200 with items for guest (no auth) — does not call saveList', async () => {
    supabaseAdmin.auth = { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'no user' } }) };
    const res = await request(app)
      .post('/api/shopping-list/generate')
      .send({ recipeId: 'recipe-uuid', sessionIngredients: ['garlic'] });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(mockSaveList).not.toHaveBeenCalled();
  });

  test('200 for authenticated registered user — calls saveList', async () => {
    mockAuthUser();
    const res = await request(app)
      .post('/api/shopping-list/generate')
      .set('Authorization', 'Bearer valid-token')
      .send({ recipeId: 'recipe-uuid', sessionIngredients: [] });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(mockSaveList).toHaveBeenCalledWith('user-uuid', expect.any(Array));
  });

  test('defaults sessionIngredients to empty array when omitted', async () => {
    supabaseAdmin.auth = { getUser: jest.fn().mockRejectedValue(new Error('no auth')) };
    const res = await request(app)
      .post('/api/shopping-list/generate')
      .send({ recipeId: 'recipe-uuid' });
    expect(res.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledWith('recipe-uuid', []);
  });
});

// ── GET /api/shopping-list ────────────────────────────────────────────────────

describe('GET /api/shopping-list', () => {
  test('401 without auth token', async () => {
    const res = await request(app).get('/api/shopping-list');
    expect(res.status).toBe(401);
  });

  test('200 returns list for authenticated registered user', async () => {
    mockAuthUser();
    const res = await request(app)
      .get('/api/shopping-list')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(mockGetList).toHaveBeenCalledWith('user-uuid');
  });
});

// ── DELETE /api/shopping-list ─────────────────────────────────────────────────

describe('DELETE /api/shopping-list', () => {
  test('401 without auth token', async () => {
    const res = await request(app).delete('/api/shopping-list');
    expect(res.status).toBe(401);
  });

  test('204 for authenticated registered user', async () => {
    mockAuthUser();
    const res = await request(app)
      .delete('/api/shopping-list')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(204);
    expect(mockClearList).toHaveBeenCalledWith('user-uuid');
  });
});

jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    auth: { admin: { createUser: jest.fn() }, getUser: jest.fn() },
    from: jest.fn(),
  },
}));
jest.mock('../src/services/UserService');

const request = require('supertest');
const app = require('../server');
const UserService = require('../src/services/UserService');
const { supabaseAdmin } = require('../src/db/supabase');

const VALID_USER = {
  user_id: 'user-uuid',
  email: 'alice@test.com',
  name: 'Alice',
  role: 'registered',
  is_active: true,
  is_locked: false,
};

function mockAuth() {
  supabaseAdmin.auth.getUser = jest.fn().mockResolvedValue({
    data: { user: { id: VALID_USER.user_id } },
    error: null,
  });
  supabaseAdmin.from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: VALID_USER, error: null }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  UserService.prototype.getPreferences = jest.fn();
  UserService.prototype.setPreferences = jest.fn();
  UserService.prototype.getFavourites = jest.fn();
  UserService.prototype.addFavourite = jest.fn();
  UserService.prototype.removeFavourite = jest.fn();
});

// ── GET /api/users/me/preferences ─────────────────────────────────────────────
describe('GET /api/users/me/preferences', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/users/me/preferences');
    expect(res.status).toBe(401);
  });

  test('returns 200 with preferences for registered user', async () => {
    mockAuth();
    UserService.prototype.getPreferences.mockResolvedValue({
      dietaryTags: ['Halal'],
      allergenNames: ['Peanuts'],
    });

    const res = await request(app)
      .get('/api/users/me/preferences')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ dietaryTags: ['Halal'], allergenNames: ['Peanuts'] });
  });
});

// ── PUT /api/users/me/preferences ─────────────────────────────────────────────
describe('PUT /api/users/me/preferences', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).put('/api/users/me/preferences').send({});
    expect(res.status).toBe(401);
  });

  test('returns 400 when dietaryTags is not an array', async () => {
    mockAuth();
    const res = await request(app)
      .put('/api/users/me/preferences')
      .set('Authorization', 'Bearer valid-token')
      .send({ dietaryTags: 'Halal', allergenNames: [] });
    expect(res.status).toBe(400);
  });

  test('returns 200 on successful save', async () => {
    mockAuth();
    UserService.prototype.setPreferences.mockResolvedValue();

    const res = await request(app)
      .put('/api/users/me/preferences')
      .set('Authorization', 'Bearer valid-token')
      .send({ dietaryTags: ['Halal'], allergenNames: [] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Preferences saved');
  });
});

// ── GET /api/users/me/favourites ──────────────────────────────────────────────
describe('GET /api/users/me/favourites', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/users/me/favourites');
    expect(res.status).toBe(401);
  });

  test('returns 200 with favourites list', async () => {
    mockAuth();
    UserService.prototype.getFavourites.mockResolvedValue({
      count: 1,
      remaining: 49,
      favourites: [{ recipe_id: 'r-01', name: 'Test', score: 0.9 }],
    });

    const res = await request(app)
      .get('/api/users/me/favourites')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.favourites).toHaveLength(1);
  });
});

// ── POST /api/users/me/favourites ─────────────────────────────────────────────
describe('POST /api/users/me/favourites', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/users/me/favourites').send({});
    expect(res.status).toBe(401);
  });

  test('returns 400 when recipeId is missing', async () => {
    mockAuth();
    const res = await request(app)
      .post('/api/users/me/favourites')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 201 on successful save', async () => {
    mockAuth();
    UserService.prototype.addFavourite.mockResolvedValue();

    const res = await request(app)
      .post('/api/users/me/favourites')
      .set('Authorization', 'Bearer valid-token')
      .send({ recipeId: 'r-01', score: 0.92 });

    expect(res.status).toBe(201);
    expect(UserService.prototype.addFavourite).toHaveBeenCalledWith('user-uuid', 'r-01', 0.92);
  });

  test('returns 409 when already saved or limit reached', async () => {
    mockAuth();
    UserService.prototype.addFavourite.mockRejectedValue(
      Object.assign(new Error('Already saved'), { status: 409 })
    );

    const res = await request(app)
      .post('/api/users/me/favourites')
      .set('Authorization', 'Bearer valid-token')
      .send({ recipeId: 'r-01' });

    expect(res.status).toBe(409);
  });
});

// ── DELETE /api/users/me/favourites/:recipeId ──────────────────────────────────
describe('DELETE /api/users/me/favourites/:recipeId', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).delete('/api/users/me/favourites/r-01');
    expect(res.status).toBe(401);
  });

  test('returns 204 on successful removal', async () => {
    mockAuth();
    UserService.prototype.removeFavourite.mockResolvedValue();

    const res = await request(app)
      .delete('/api/users/me/favourites/r-01')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(204);
    expect(UserService.prototype.removeFavourite).toHaveBeenCalledWith('user-uuid', 'r-01');
  });
});

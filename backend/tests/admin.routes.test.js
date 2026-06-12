jest.mock('../src/services/AdminService');
const AdminService = require('../src/services/AdminService');
const request = require('supertest');
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

jest.mock('../src/middleware/authenticate', () => (req, _res, next) => {
  req.user = { user_id: 'admin-uuid', role: 'admin' };
  next();
});

describe('GET /api/admin/dashboard', () => {
  test('returns 200 with dashboard stats for admin', async () => {
    AdminService.prototype.getDashboardStats.mockResolvedValue({ totalRecipes: 10, registeredUsers: 5, activeSessions: 3, unresolvedErrors: 2 });
    AdminService.prototype.getRecentRecipes.mockResolvedValue([]);
    AdminService.prototype.getRecentErrors.mockResolvedValue([]);
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.totalRecipes).toBe(10);
    expect(res.body.recentRecipes).toBeDefined();
  });
});

describe('GET /api/admin/recipes', () => {
  test('returns 200 with recipes list for admin', async () => {
    AdminService.prototype.listRecipes.mockResolvedValue({ recipes: [], total: 0 });
    const res = await request(app).get('/api/admin/recipes').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recipes');
    expect(res.body).toHaveProperty('total');
  });
});

describe('POST /api/admin/recipes', () => {
  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', 'Bearer token')
      .send({ category: 'Malay' });
    expect(res.status).toBe(400);
  });

  test('returns 201 with new recipe when valid', async () => {
    AdminService.prototype.createRecipe.mockResolvedValue({ recipe_id: 'r-new', name: 'New Recipe' });
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', 'Bearer token')
      .send({ name: 'New Recipe', ingredientNames: ['chicken'], dietaryTagNames: ['Halal'], allergenNames: [] });
    expect(res.status).toBe(201);
    expect(res.body.recipe.name).toBe('New Recipe');
  });
});

describe('DELETE /api/admin/recipes/:id', () => {
  test('returns 204 on successful soft-delete', async () => {
    AdminService.prototype.deleteRecipe.mockResolvedValue();
    const res = await request(app)
      .delete('/api/admin/recipes/r-1')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(204);
  });
});

describe('GET /api/admin/users', () => {
  test('returns 200 with users list', async () => {
    AdminService.prototype.listUsers.mockResolvedValue({ users: [], total: 0 });
    const res = await request(app).get('/api/admin/users').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('total');
  });
});

describe('PUT /api/admin/users/:id/lock', () => {
  test('returns 200 with message on success', async () => {
    AdminService.prototype.lockUser.mockResolvedValue();
    const res = await request(app)
      .put('/api/admin/users/u-1/lock')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('GET /api/admin/logs', () => {
  test('returns 200 with logs list', async () => {
    AdminService.prototype.getErrorLogs.mockResolvedValue({ logs: [], total: 0 });
    const res = await request(app).get('/api/admin/logs').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
  });
});

describe('PATCH /api/admin/logs/:id', () => {
  test('returns 200 with message on success', async () => {
    AdminService.prototype.resolveErrorLog.mockResolvedValue();
    const res = await request(app)
      .patch('/api/admin/logs/log-1')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('DELETE /api/admin/logs/resolved', () => {
  test('returns 204 on success', async () => {
    AdminService.prototype.clearResolvedLogs.mockResolvedValue();
    const res = await request(app)
      .delete('/api/admin/logs/resolved')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(204);
  });
});

describe('POST /api/admin/users/:id/reset-password', () => {
  test('returns 200 with message on success', async () => {
    AdminService.prototype.resetUserPassword.mockResolvedValue();
    const res = await request(app)
      .post('/api/admin/users/u-1/reset-password')
      .set('Authorization', 'Bearer test-token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset email sent');
  });
});

describe('GET /api/admin/stats/registrations', () => {
  test('returns 200 with registrations array', async () => {
    AdminService.prototype.getDailyRegistrations.mockResolvedValue([
      { date: '2026-06-10', count: 2 },
      { date: '2026-06-11', count: 1 },
    ]);
    const res = await request(app)
      .get('/api/admin/stats/registrations')
      .set('Authorization', 'Bearer test-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.registrations)).toBe(true);
  });
});

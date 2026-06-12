jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    auth: { admin: { createUser: jest.fn() }, getUser: jest.fn() },
    from: jest.fn(),
  },
}));
jest.mock('../src/services/AuthService');

const request = require('supertest');
const app = require('../server');
const AuthService = require('../src/services/AuthService');
const { supabaseAdmin } = require('../src/db/supabase');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  test('returns 201 with user data on success', async () => {
    AuthService.register.mockResolvedValue({
      user_id: 'uuid-new', email: 'new@test.com', name: 'New', role: 'registered',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123', name: 'New' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ user: { email: 'new@test.com', role: 'registered' } });
  });

  test('returns 409 for duplicate email', async () => {
    const err = Object.assign(new Error('Account already exists'), { status: 409 });
    AuthService.register.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123', name: 'Dup' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Account already exists/);
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('returns 200 with token on valid credentials', async () => {
    AuthService.login.mockResolvedValue({
      access_token: 'jwt-token',
      user: { user_id: 'uuid-1', email: 'user@test.com', name: 'User', role: 'registered' },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('jwt-token');
    expect(res.body.user.role).toBe('registered');
  });

  test('returns 401 for invalid credentials', async () => {
    AuthService.login.mockRejectedValue(Object.assign(new Error('Incorrect email or password'), { status: 401 }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Incorrect email or password/);
  });

  test('returns 423 for locked account', async () => {
    const lockUntil = new Date(Date.now() + 600000).toISOString();
    AuthService.login.mockRejectedValue(Object.assign(new Error('Account locked'), { status: 423, lock_until: lockUntil }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'locked@test.com', password: 'any' });

    expect(res.status).toBe(423);
    expect(res.body).toMatchObject({ error: 'Account locked', lock_until: lockUntil });
  });

  test('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  test('returns 200 on successful logout', async () => {
    AuthService.logout.mockResolvedValue();
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-1' } }, error: null,
    });
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { user_id: 'uuid-1', email: 'u@t.com', name: 'U', role: 'registered', is_locked: false, is_active: true, lock_until: null },
        error: null,
      }),
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(AuthService.logout).toHaveBeenCalledWith('valid-token');
  });
});

describe('GET /api/auth/me', () => {
  test('returns 200 with user profile when authenticated', async () => {
    const profile = { user_id: 'uuid-1', email: 'u@t.com', name: 'U', role: 'registered', is_active: true };
    AuthService.getMe.mockResolvedValue(profile);
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-1' } }, error: null,
    });
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { user_id: 'uuid-1', email: 'u@t.com', name: 'U', role: 'registered', is_locked: false, is_active: true, lock_until: null },
        error: null,
      }),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('u@t.com');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  test('returns 200 with confirmation message', async () => {
    AuthService.forgotPassword = jest.fn().mockResolvedValue();
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });
});

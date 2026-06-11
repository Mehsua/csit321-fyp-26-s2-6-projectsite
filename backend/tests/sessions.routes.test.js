jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));
jest.mock('../src/services/SessionService');

const request = require('supertest');
const app = require('../server');
const SessionService = require('../src/services/SessionService');
const { supabaseAdmin } = require('../src/db/supabase');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/sessions', () => {
  test('creates a guest session when no auth token is provided', async () => {
    SessionService.createGuestSession.mockResolvedValue({
      session_id: 'sess-guest-uuid', user_id: null, is_active: true,
    });

    const res = await request(app).post('/api/sessions');

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBe('sess-guest-uuid');
    expect(res.body.user_id).toBeNull();
    expect(SessionService.createGuestSession).toHaveBeenCalled();
  });

  test('creates an authenticated session when valid JWT is provided', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-auth' } }, error: null,
    });
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { user_id: 'uuid-auth', email: 'u@t.com', name: 'U', role: 'registered', is_locked: false, is_active: true, lock_until: null },
        error: null,
      }),
    });
    SessionService.createAuthSession.mockResolvedValue({
      session_id: 'sess-auth-uuid', user_id: 'uuid-auth', is_active: true,
    });

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBe('sess-auth-uuid');
    expect(res.body.user_id).toBe('uuid-auth');
    expect(SessionService.createAuthSession).toHaveBeenCalledWith('uuid-auth');
  });

  test('falls back to guest session when token is expired or invalid', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null }, error: { message: 'invalid JWT' },
    });
    SessionService.createGuestSession.mockResolvedValue({
      session_id: 'sess-fallback-uuid', user_id: null, is_active: true,
    });

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer expired-or-invalid-token');

    expect(res.status).toBe(201);
    expect(res.body.user_id).toBeNull();
    expect(SessionService.createGuestSession).toHaveBeenCalled();
    expect(SessionService.createAuthSession).not.toHaveBeenCalled();
  });
});

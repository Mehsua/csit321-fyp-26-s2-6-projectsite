jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const { supabaseAdmin } = require('../src/db/supabase');
const authenticate = require('../src/middleware/authenticate');

function mockReqResNext(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

test('calls next() and sets req.user for valid JWT', async () => {
  const userId = 'uuid-100';
  supabaseAdmin.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  supabaseAdmin.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { user_id: userId, email: 'u@test.com', name: 'U', role: 'registered', is_locked: false, is_active: true, lock_until: null },
      error: null,
    }),
  });

  const { req, res, next } = mockReqResNext('Bearer valid-token');
  await authenticate(req, res, next);

  expect(next).toHaveBeenCalledWith();
  expect(req.user).toMatchObject({ user_id: userId, role: 'registered' });
});

test('returns 401 when Authorization header is missing', async () => {
  const { req, res, next } = mockReqResNext(undefined);
  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 when Supabase rejects the token', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'invalid JWT' },
  });

  const { req, res, next } = mockReqResNext('Bearer bad-token');
  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 when account is locked', async () => {
  const userId = 'uuid-locked';
  supabaseAdmin.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  supabaseAdmin.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        user_id: userId, email: 'l@test.com', name: 'L', role: 'registered',
        is_locked: true, lock_until: new Date(Date.now() + 600000).toISOString(),
        is_active: true,
      },
      error: null,
    }),
  });

  const { req, res, next } = mockReqResNext('Bearer locked-token');
  await authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

const requireRole = require('../src/middleware/requireRole');

describe('requireRole', () => {
  test('calls next() when user has the required role (string)', () => {
    const req = { user: { role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('calls next() when user role is in the allowed array', () => {
    const req = { user: { role: 'registered' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireRole(['admin', 'registered'])(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('returns 403 when role does not match', () => {
    const req = { user: { role: 'registered' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is not set (authenticate not called first)', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authenticate — updates session last_activity', () => {
  test('calls supabase update on sessions table after successful auth', async () => {
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq1 = jest.fn().mockReturnThis();
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });

    supabaseAdmin.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-uuid' } }, error: null,
    });
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-uuid', email: 'a@b.com', name: 'A', role: 'registered', is_locked: false, lock_until: null, is_active: true },
            error: null,
          }),
        };
      }
      if (table === 'sessions') {
        return { update: mockUpdate, eq: mockEq1 };
      }
      return {};
    });
    mockEq1.mockImplementation(() => ({ eq: mockEq2 }));

    const req = { headers: { authorization: 'Bearer test-token' } };
    const res = {};
    const next = jest.fn();
    const authenticate = require('../src/middleware/authenticate');
    await authenticate(req, res, next);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      last_activity: expect.any(String),
      expires_at: expect.any(String),
    }));
    expect(next).toHaveBeenCalled();
  });
});

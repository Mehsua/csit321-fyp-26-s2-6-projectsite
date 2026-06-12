jest.mock('../src/db/supabase', () => {
  return {
    supabase: {},
    supabaseAdmin: {
      auth: {
        admin: {
          createUser: jest.fn(),
        },
        getUser: jest.fn(),
      },
      from: jest.fn(),
    },
  };
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const { supabaseAdmin } = require('../src/db/supabase');
const { createClient } = require('@supabase/supabase-js');
const AuthService = require('../src/services/AuthService');

beforeEach(() => jest.clearAllMocks());

// ── register ──────────────────────────────────────────────────────────────────

describe('AuthService.register', () => {
  test('creates auth user + public users row on success', async () => {
    const newId = 'uuid-new-user';
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: newId } },
      error: null,
    });
    const chain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { user_id: newId, email: 'new@test.com', name: 'New', role: 'registered' },
        error: null,
      }),
    };
    supabaseAdmin.from.mockReturnValue(chain);

    const result = await AuthService.register({ email: 'new@test.com', password: 'password123', name: 'New' });

    expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@test.com', email_confirm: true })
    );
    expect(supabaseAdmin.from).toHaveBeenCalledWith('users');
    expect(result.role).toBe('registered');
    expect(result.user_id).toBe(newId);
  });

  test('throws "Account already exists" when Supabase Auth returns duplicate error', async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    await expect(
      AuthService.register({ email: 'dup@test.com', password: 'password123', name: 'Dup' })
    ).rejects.toMatchObject({ message: 'Account already exists' });
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  const mockUserRow = {
    user_id: 'uuid-user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'registered',
    is_locked: false,
    lock_until: null,
    fail_count: 0,
    is_active: true,
  };

  function mockUserLookup(userData) {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: userData, error: null }),
      update: jest.fn().mockReturnThis(),
    });
  }

  test('returns access_token and user on valid credentials', async () => {
    mockUserLookup(mockUserRow);

    const mockSignInClient = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            session: { access_token: 'jwt-abc', refresh_token: 'refresh-abc', expires_in: 3600 },
            user: { id: 'uuid-user-1' },
          },
          error: null,
        }),
      },
    };
    createClient.mockReturnValue(mockSignInClient);

    // After success, AuthService resets fail_count — mock the update call
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUserRow, error: null }),
      update: jest.fn().mockReturnThis(),
    });

    const result = await AuthService.login({ email: 'user@test.com', password: 'correctpass' });
    expect(result.access_token).toBe('jwt-abc');
    expect(result.user.role).toBe('registered');
  });

  test('increments fail_count on wrong password', async () => {
    const updateMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    supabaseAdmin.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: eqMock,
      single: jest.fn().mockResolvedValue({ data: { ...mockUserRow, fail_count: 2 }, error: null }),
      update: updateMock,
    }));

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    });

    await expect(
      AuthService.login({ email: 'user@test.com', password: 'wrong' })
    ).rejects.toMatchObject({ status: 401 });

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ fail_count: 3 }));
  });

  test('sets is_locked=true and lock_until on 5th failure', async () => {
    const updateMock = jest.fn().mockReturnThis();
    supabaseAdmin.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { ...mockUserRow, fail_count: 4 }, error: null }),
      update: updateMock,
    }));

    createClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    });

    await expect(
      AuthService.login({ email: 'user@test.com', password: 'wrong5' })
    ).rejects.toMatchObject({ status: 401 });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_locked: true, fail_count: 5 })
    );
  });

  test('returns 423 immediately when account is locked and lock has not expired', async () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { ...mockUserRow, is_locked: true, lock_until: futureTime, fail_count: 5 },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    });

    await expect(
      AuthService.login({ email: 'user@test.com', password: 'any' })
    ).rejects.toMatchObject({ status: 423, message: 'Account locked' });
  });
});

describe('AuthService.forgotPassword', () => {
  test('calls supabase auth resetPasswordForEmail with the email', async () => {
    supabaseAdmin.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({ error: null });
    await AuthService.forgotPassword('user@example.com');
    expect(supabaseAdmin.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com');
  });

  test('resolves without throwing even if email is not registered (do not reveal account existence)', async () => {
    supabaseAdmin.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({ error: { message: 'User not found' } });
    await expect(AuthService.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
  });
});

describe('AuthService.register — with dietary and allergen preferences', () => {
  test('inserts dietary preferences when dietaryTags provided', async () => {
    const dietaryInsert = jest.fn().mockResolvedValue({ error: null });
    const allergenInsert = jest.fn().mockResolvedValue({ error: null });

    supabaseAdmin.auth.admin = {
      createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'new-uuid' } }, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'new-uuid', email: 'a@b.com', name: 'A', role: 'registered' },
            error: null,
          }),
        };
      }
      if (table === 'dietary_tags') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [{ tag_id: 't-1', name: 'Halal' }], error: null }),
        };
      }
      if (table === 'user_dietary_preferences') {
        return { insert: dietaryInsert };
      }
      if (table === 'allergens') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [{ allergen_id: 'a-1', name: 'Peanuts' }], error: null }),
        };
      }
      if (table === 'user_allergens') {
        return { insert: allergenInsert };
      }
      return {};
    });

    await AuthService.register({ email: 'a@b.com', password: 'pass1234', name: 'A', dietaryTags: ['Halal'], allergens: ['Peanuts'] });
    expect(dietaryInsert).toHaveBeenCalledWith([{ user_id: 'new-uuid', tag_id: 't-1' }]);
    expect(allergenInsert).toHaveBeenCalledWith([{ user_id: 'new-uuid', allergen_id: 'a-1' }]);
  });

  test('skips preference inserts when no dietaryTags or allergens provided', async () => {
    const anyInsert = jest.fn();
    supabaseAdmin.auth.admin = {
      createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'new-uuid' } }, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'new-uuid', email: 'a@b.com', name: 'A', role: 'registered' },
            error: null,
          }),
        };
      }
      return { insert: anyInsert };
    });

    await AuthService.register({ email: 'a@b.com', password: 'pass1234', name: 'A' });
    expect(anyInsert).not.toHaveBeenCalled();
  });
});

jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: { from: jest.fn() },
}));

const { supabaseAdmin } = require('../src/db/supabase');
const sessionService = require('../src/services/SessionService');

beforeEach(() => jest.clearAllMocks());

function mockInsertChain(resolvedValue) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('SessionService.createGuestSession', () => {
  test('returns session row with user_id=null on success', async () => {
    const fakeRow = { session_id: 'ses-1', user_id: null, is_active: true, created_at: new Date().toISOString(), expires_at: new Date().toISOString() };
    supabaseAdmin.from.mockReturnValue(mockInsertChain({ data: fakeRow, error: null }));

    const result = await sessionService.createGuestSession();
    expect(result.user_id).toBeNull();
    expect(result.session_id).toBe('ses-1');
    const call = supabaseAdmin.from.mock.calls[0][0];
    expect(call).toBe('sessions');
  });

  test('throws 500 when Supabase insert returns an error', async () => {
    supabaseAdmin.from.mockReturnValue(mockInsertChain({ data: null, error: { message: 'db error' } }));

    await expect(sessionService.createGuestSession()).rejects.toMatchObject({ status: 500 });
  });
});

describe('SessionService.createAuthSession', () => {
  test('returns session row with correct user_id on success', async () => {
    const userId = 'user-uuid-123';
    const fakeRow = { session_id: 'ses-2', user_id: userId, is_active: true, created_at: new Date().toISOString(), expires_at: new Date().toISOString() };
    supabaseAdmin.from.mockReturnValue(mockInsertChain({ data: fakeRow, error: null }));

    const result = await sessionService.createAuthSession(userId);
    expect(result.user_id).toBe(userId);
    expect(result.session_id).toBe('ses-2');
  });

  test('throws 500 when Supabase insert returns an error', async () => {
    supabaseAdmin.from.mockReturnValue(mockInsertChain({ data: null, error: { message: 'db error' } }));

    await expect(sessionService.createAuthSession('u-1')).rejects.toMatchObject({ status: 500 });
  });
});

describe('SessionService.updateActivity', () => {
  test('calls supabase update on sessions table with last_activity and expires_at', async () => {
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq1   = jest.fn().mockReturnThis();
    const mockEq2   = jest.fn().mockResolvedValue({ error: null });

    supabaseAdmin.from.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq1 });
    mockEq1.mockReturnValue({ eq: mockEq2 });

    await sessionService.updateActivity('user-uuid-999');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        last_activity: expect.any(String),
        expires_at: expect.any(String),
      })
    );
    expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-uuid-999');
    expect(mockEq2).toHaveBeenCalledWith('is_active', true);
    // updateActivity returns nothing — no return-value assertion needed
  });
});

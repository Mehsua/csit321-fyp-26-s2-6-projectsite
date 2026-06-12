jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const AdminService = require('../src/services/AdminService');

beforeEach(() => jest.clearAllMocks());

// ── getDashboardStats ────────────────────────────────────────────────────────

describe('AdminService.getDashboardStats', () => {
  test('returns counts for all 4 stat categories', async () => {
    let callCount = 0;
    supabaseAdmin.from = jest.fn().mockImplementation(() => {
      callCount++;
      const count = [10, 5, 3, 2][callCount - 1];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve, reject) => Promise.resolve({ count, error: null }).then(resolve, reject);
      return chain;
    });
    const svc = new AdminService();
    const stats = await svc.getDashboardStats();
    expect(stats.totalRecipes).toBe(10);
    expect(stats.registeredUsers).toBe(5);
    expect(stats.activeSessions).toBe(3);
    expect(stats.unresolvedErrors).toBe(2);
  });

  test('throws when any supabase query fails', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve({ count: null, error: { message: 'DB error' } }).then(resolve, reject),
    });
    const svc = new AdminService();
    await expect(svc.getDashboardStats()).rejects.toBeDefined();
  });
});

// ── getRecentRecipes ─────────────────────────────────────────────────────────

describe('AdminService.getRecentRecipes', () => {
  test('returns up to limit recent recipes ordered by created_at desc', async () => {
    const rows = [{ recipe_id: 'r-1', name: 'Nasi Lemak', category: 'Malay', created_at: '2026-06-01' }];
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    });
    const svc = new AdminService();
    const result = await svc.getRecentRecipes(5);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nasi Lemak');
  });
});

// ── getErrorLogs ─────────────────────────────────────────────────────────────

describe('AdminService.getErrorLogs', () => {
  test('returns paginated logs with total count', async () => {
    const rows = [{ log_id: 'l-1', error_type: 'API', message: 'crash', is_resolved: false }];
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: rows, count: 1, error: null }),
    });
    const svc = new AdminService();
    const result = await svc.getErrorLogs({});
    expect(result.logs).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

// ── resolveErrorLog ──────────────────────────────────────────────────────────

describe('AdminService.resolveErrorLog', () => {
  test('updates is_resolved to true for the given log_id', async () => {
    const updateChain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(updateChain);
    const svc = new AdminService();
    await svc.resolveErrorLog('log-uuid');
    expect(updateChain.update).toHaveBeenCalledWith({ is_resolved: true });
    expect(updateChain.eq).toHaveBeenCalledWith('log_id', 'log-uuid');
  });
});

// ── clearResolvedLogs ────────────────────────────────────────────────────────

describe('AdminService.clearResolvedLogs', () => {
  test('deletes all logs where is_resolved=true', async () => {
    const deleteChain = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(deleteChain);
    const svc = new AdminService();
    await svc.clearResolvedLogs();
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('is_resolved', true);
  });
});

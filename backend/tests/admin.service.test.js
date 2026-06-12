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

// ── listRecipes ──────────────────────────────────────────────────────────────

describe('AdminService.listRecipes', () => {
  test('returns paginated recipes with total count', async () => {
    const rows = [{ recipe_id: 'r-1', name: 'Chicken Rendang', category: 'Malay', recipe_dietary_tags: [], recipe_allergens: [], recipe_ingredients: [], nutrition_info: null }];
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: rows, count: 1, error: null }),
    });
    const svc = new AdminService();
    const result = await svc.listRecipes({});
    expect(result.recipes).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.recipes[0].name).toBe('Chicken Rendang');
  });
});

// ── createRecipe ─────────────────────────────────────────────────────────────

describe('AdminService.createRecipe', () => {
  test('inserts recipe row and returns it', async () => {
    const newRecipe = { recipe_id: 'r-new', name: 'Test Recipe' };
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'recipes') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: newRecipe, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });
    const svc = new AdminService();
    const result = await svc.createRecipe({ name: 'Test Recipe', ingredientNames: [], dietaryTagNames: [], allergenNames: [] });
    expect(result.recipe_id).toBe('r-new');
  });
});

// ── updateRecipe ─────────────────────────────────────────────────────────────

describe('AdminService.updateRecipe', () => {
  test('updates recipe fields via supabase update', async () => {
    const updateChain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(updateChain);
    const svc = new AdminService();
    await svc.updateRecipe('r-1', { name: 'New Name', category: 'Indian' });
    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name', category: 'Indian' }));
  });
});

// ── deleteRecipe ─────────────────────────────────────────────────────────────

describe('AdminService.deleteRecipe', () => {
  test('soft-deletes recipe by setting is_active=false', async () => {
    const updateChain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(updateChain);
    const svc = new AdminService();
    await svc.deleteRecipe('r-1');
    expect(updateChain.update).toHaveBeenCalledWith({ is_active: false });
    expect(updateChain.eq).toHaveBeenCalledWith('recipe_id', 'r-1');
  });
});

// ── listUsers ────────────────────────────────────────────────────────────────

describe('AdminService.listUsers', () => {
  test('returns paginated users with total count', async () => {
    const rows = [{ user_id: 'u-1', name: 'John', email: 'john@example.com', role: 'registered', is_locked: false, is_active: true }];
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: rows, count: 1, error: null }),
    });
    const svc = new AdminService();
    const result = await svc.listUsers({});
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

// ── lockUser / unlockUser ────────────────────────────────────────────────────

describe('AdminService.lockUser', () => {
  test('sets is_locked=true for a registered user', async () => {
    const chain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);
    const svc = new AdminService();
    await svc.lockUser('u-1');
    expect(chain.update).toHaveBeenCalledWith({ is_locked: true });
  });
});

describe('AdminService.unlockUser', () => {
  test('resets is_locked, fail_count, and lock_until', async () => {
    const chain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);
    const svc = new AdminService();
    await svc.unlockUser('u-1');
    expect(chain.update).toHaveBeenCalledWith({ is_locked: false, fail_count: 0, lock_until: null });
  });
});

// ── deactivateUser / reactivateUser ──────────────────────────────────────────

describe('AdminService.deactivateUser', () => {
  test('sets is_active=false for a registered user', async () => {
    const chain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);
    const svc = new AdminService();
    await svc.deactivateUser('u-1');
    expect(chain.update).toHaveBeenCalledWith({ is_active: false });
  });
});

describe('AdminService.reactivateUser', () => {
  test('sets is_active=true and resets lock state', async () => {
    const chain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);
    const svc = new AdminService();
    await svc.reactivateUser('u-1');
    expect(chain.update).toHaveBeenCalledWith({ is_active: true, is_locked: false, fail_count: 0, lock_until: null });
  });
});

// ── resetUserPassword ────────────────────────────────────────────────────────

describe('AdminService.resetUserPassword', () => {
  test('calls supabase auth generateLink for the user email', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
    });
    supabaseAdmin.auth = {
      admin: {
        generateLink: jest.fn().mockResolvedValue({ data: { properties: { action_link: 'https://reset.link' } }, error: null }),
      },
    };
    const svc = new AdminService();
    await svc.resetUserPassword('u-1');
    expect(supabaseAdmin.auth.admin.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'recovery', email: 'test@example.com' })
    );
  });

  test('throws if user not found', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });
    const svc = new AdminService();
    await expect(svc.resetUserPassword('bad-id')).rejects.toBeDefined();
  });
});

// ── getDailyRegistrations ─────────────────────────────────────────────────────

describe('AdminService.getDailyRegistrations', () => {
  test('returns array of { date, count } for last 7 days', async () => {
    const rows = [
      { created_at: '2026-06-10T10:00:00Z' },
      { created_at: '2026-06-10T14:00:00Z' },
      { created_at: '2026-06-11T09:00:00Z' },
    ];
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
    });
    const svc = new AdminService();
    const result = await svc.getDailyRegistrations();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(7);
    result.forEach(r => {
      expect(r).toHaveProperty('date');
      expect(r).toHaveProperty('count');
    });
  });
});

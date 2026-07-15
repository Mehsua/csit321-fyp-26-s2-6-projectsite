jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const UserService = require('../src/services/UserService');

beforeEach(() => jest.clearAllMocks());

// ── getTasteProfile ───────────────────────────────────────────────────────────
describe('UserService.getTasteProfile', () => {
  test('returns defaults when no profile exists (PGRST116)', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);

    const service = new UserService();
    const result = await service.getTasteProfile('user-uuid');
    expect(result).toEqual({ preferred_cuisines: [], spice_level: 'medium', max_cooking_time: null });
  });

  test('returns saved profile when it exists', async () => {
    const profile = { preferred_cuisines: ['Asian', 'Indian'], spice_level: 'spicy', max_cooking_time: 30 };
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: profile, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);

    const service = new UserService();
    const result = await service.getTasteProfile('user-uuid');
    expect(result).toEqual(profile);
  });
});

// ── setTasteProfile ───────────────────────────────────────────────────────────
describe('UserService.setTasteProfile', () => {
  test('calls upsert with correct data', async () => {
    const upsertChain = { upsert: jest.fn().mockResolvedValue({ error: null }) };
    supabaseAdmin.from = jest.fn().mockReturnValue(upsertChain);

    const service = new UserService();
    await expect(service.setTasteProfile('user-uuid', {
      preferredCuisines: ['Asian'],
      spiceLevel: 'mild',
      maxCookingTime: 20,
    })).resolves.toBeUndefined();

    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-uuid',
        preferred_cuisines: ['Asian'],
        spice_level: 'mild',
        max_cooking_time: 20,
      }),
      { onConflict: 'user_id' }
    );
  });
});

// ── getMedicalProfile ─────────────────────────────────────────────────────────
describe('UserService.getMedicalProfile', () => {
  test('returns empty array when user has no conditions', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);

    const service = new UserService();
    const result = await service.getMedicalProfile('user-uuid');
    expect(result).toEqual([]);
  });

  test('returns condition names as array', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ condition: 'Diabetes' }, { condition: 'WeightLoss' }],
        error: null,
      }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(chain);

    const service = new UserService();
    const result = await service.getMedicalProfile('user-uuid');
    expect(result).toEqual(['Diabetes', 'WeightLoss']);
  });
});

// ── setMedicalProfile ─────────────────────────────────────────────────────────
describe('UserService.setMedicalProfile', () => {
  test('deletes existing then inserts new conditions', async () => {
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn()
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const service = new UserService();
    await expect(service.setMedicalProfile('user-uuid', ['Diabetes'])).resolves.toBeUndefined();
    expect(insertChain.insert).toHaveBeenCalledWith([{ user_id: 'user-uuid', condition: 'Diabetes' }]);
  });

  test('only deletes when conditions array is empty (no insert)', async () => {
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(deleteChain);

    const service = new UserService();
    await expect(service.setMedicalProfile('user-uuid', [])).resolves.toBeUndefined();
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
  });
});

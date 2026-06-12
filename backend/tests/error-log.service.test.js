jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const ErrorLogService = require('../src/services/ErrorLogService');

beforeEach(() => jest.clearAllMocks());

function mockInsert(error = null) {
  supabaseAdmin.from = jest.fn().mockReturnValue({
    insert: jest.fn().mockResolvedValue({ error }),
  });
}

describe('ErrorLogService.logError', () => {
  test('inserts a row with all fields provided', async () => {
    mockInsert(null);
    await ErrorLogService.logError({ userId: 'u-1', errorType: 'API', message: 'Unhandled error', endpoint: 'GET /api/recipes' });
    expect(supabaseAdmin.from).toHaveBeenCalledWith('error_logs');
    const insertArg = supabaseAdmin.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertArg).toMatchObject({ user_id: 'u-1', error_type: 'API', message: 'Unhandled error', endpoint: 'GET /api/recipes' });
  });

  test('inserts with user_id null when userId not provided', async () => {
    mockInsert(null);
    await ErrorLogService.logError({ errorType: 'DB', message: 'timeout' });
    const insertArg = supabaseAdmin.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertArg.user_id).toBeNull();
  });

  test('inserts with endpoint null when endpoint not provided', async () => {
    mockInsert(null);
    await ErrorLogService.logError({ errorType: 'OpenAI', message: 'rate limit' });
    const insertArg = supabaseAdmin.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertArg.endpoint).toBeNull();
  });

  test('throws when supabase insert returns an error', async () => {
    mockInsert({ message: 'insert failed' });
    await expect(ErrorLogService.logError({ errorType: 'API', message: 'err' })).rejects.toMatchObject({ message: 'insert failed' });
  });

  test('sets correct error_type field', async () => {
    mockInsert(null);
    await ErrorLogService.logError({ errorType: 'Auth', message: 'locked' });
    const insertArg = supabaseAdmin.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertArg.error_type).toBe('Auth');
  });
});

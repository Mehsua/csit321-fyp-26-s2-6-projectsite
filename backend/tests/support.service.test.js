jest.mock('../src/db/supabase');
const { supabaseAdmin } = require('../src/db/supabase');
const SupportService = require('../src/services/SupportService');

beforeEach(() => jest.clearAllMocks());

const SAMPLE_FAQS = [
  { faq_id: 'faq-1', question: 'How do I add my ingredients?', answer: 'Type your ingredients in the chat separated by commas.', category: 'Usage' },
  { faq_id: 'faq-2', question: 'I forgot my password. What should I do?', answer: 'Use the Forgot password link on the login page.', category: 'Troubleshooting' },
  { faq_id: 'faq-3', question: 'What dietary filters are available?', answer: 'FoodBot supports Halal, Vegan, Vegetarian, and Gluten-Free filters.', category: 'Features' },
];

function mockFaqFetch(data, error = null) {
  supabaseAdmin.from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data, error }),
  });
}

// ── queryFAQ ─────────────────────────────────────────────────────────────────

describe('SupportService.queryFAQ', () => {
  test('returns matched FAQ when keyword overlaps with question', async () => {
    mockFaqFetch(SAMPLE_FAQS);
    const service = new SupportService();
    const result = await service.queryFAQ('forgot password help');
    expect(result.matched).toBe(true);
    expect(result.faq_id).toBe('faq-2');
    expect(result.category).toBe('Troubleshooting');
  });

  test('returns matched:false when no keywords overlap', async () => {
    mockFaqFetch(SAMPLE_FAQS);
    const service = new SupportService();
    const result = await service.queryFAQ('xyzzy quux blorp');
    expect(result.matched).toBe(false);
    expect(result.faq_id).toBeUndefined();
  });

  test('returns matched:false when faq_entries table is empty', async () => {
    mockFaqFetch([]);
    const service = new SupportService();
    const result = await service.queryFAQ('dietary filters');
    expect(result.matched).toBe(false);
  });

  test('returns matched:false on DB error', async () => {
    mockFaqFetch(null, { message: 'connection failed' });
    const service = new SupportService();
    const result = await service.queryFAQ('ingredients question');
    expect(result.matched).toBe(false);
  });

  test('returns best match when multiple entries partially overlap', async () => {
    mockFaqFetch(SAMPLE_FAQS);
    const service = new SupportService();
    // 'dietary filters available' matches faq-3 more strongly than faq-1
    const result = await service.queryFAQ('dietary filters available');
    expect(result.matched).toBe(true);
    expect(result.faq_id).toBe('faq-3');
  });

  test('matching is case-insensitive', async () => {
    mockFaqFetch(SAMPLE_FAQS);
    const service = new SupportService();
    const result = await service.queryFAQ('FORGOT PASSWORD');
    expect(result.matched).toBe(true);
    expect(result.faq_id).toBe('faq-2');
  });

  test('returns matched:false when message contains only stop words and short tokens', async () => {
    mockFaqFetch(SAMPLE_FAQS);
    const service = new SupportService();
    const result = await service.queryFAQ('the a is to');
    expect(result.matched).toBe(false);
  });

  // ── createSupportRequest ──────────────────────────────────────────────────

  test('createSupportRequest inserts with userId when authenticated', async () => {
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { request_id: 'req-uuid' }, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(insertChain);

    const service = new SupportService();
    const result = await service.createSupportRequest('user-uuid', 'My meal plan is not loading.');
    expect(result.request_id).toBe('req-uuid');
    expect(result.contact_info).toMatch(/@/);
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-uuid', status: 'open' }));
  });

  test('createSupportRequest inserts with null userId for guests', async () => {
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { request_id: 'req-uuid-2' }, error: null }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(insertChain);

    const service = new SupportService();
    const result = await service.createSupportRequest(null, 'I cannot find a recipe.');
    expect(result.request_id).toBe('req-uuid-2');
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: null }));
  });

  test('createSupportRequest throws on DB error', async () => {
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
    };
    supabaseAdmin.from = jest.fn().mockReturnValue(insertChain);

    const service = new SupportService();
    await expect(service.createSupportRequest(null, 'help')).rejects.toThrow('Failed to create support request');
  });
});

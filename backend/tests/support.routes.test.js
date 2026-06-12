jest.mock('../src/services/SupportService');
const SupportService = require('../src/services/SupportService');
const request = require('supertest');
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

// ── POST /api/support/query ───────────────────────────────────────────────────

describe('POST /api/support/query', () => {
  test('400 when message is missing', async () => {
    const res = await request(app).post('/api/support/query').send({});
    expect(res.status).toBe(400);
  });

  test('400 when message is empty string', async () => {
    const res = await request(app).post('/api/support/query').send({ message: '   ' });
    expect(res.status).toBe(400);
  });

  test('200 with matched FAQ when SupportService finds a match', async () => {
    SupportService.prototype.queryFAQ.mockResolvedValue({
      matched: true,
      faq_id: 'faq-1',
      question: 'How do I add my ingredients?',
      answer: 'Type your ingredients in the chat.',
      category: 'Usage',
    });

    const res = await request(app)
      .post('/api/support/query')
      .send({ message: 'how do I add ingredients' });

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.answer).toBe('Type your ingredients in the chat.');
    expect(res.body.category).toBe('Usage');
  });

  test('200 with matched:false when no FAQ found', async () => {
    SupportService.prototype.queryFAQ.mockResolvedValue({ matched: false });

    const res = await request(app)
      .post('/api/support/query')
      .send({ message: 'some unrelated question' });

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
    expect(res.body.answer).toBeUndefined();
  });

  test('accessible without authentication token', async () => {
    SupportService.prototype.queryFAQ.mockResolvedValue({ matched: false });
    const res = await request(app)
      .post('/api/support/query')
      .send({ message: 'help me' });
    expect(res.status).toBe(200);
  });
});

// ── POST /api/support/escalate ────────────────────────────────────────────────

describe('POST /api/support/escalate', () => {
  test('400 when message is missing', async () => {
    const res = await request(app).post('/api/support/escalate').send({});
    expect(res.status).toBe(400);
  });

  test('201 with request_id and contact_info for guest', async () => {
    SupportService.prototype.createSupportRequest.mockResolvedValue({
      request_id: 'req-uuid',
      contact_info: 'support@foodbot.com',
    });

    const res = await request(app)
      .post('/api/support/escalate')
      .send({ message: 'I cannot load my meal plan.' });

    expect(res.status).toBe(201);
    expect(res.body.request_id).toBe('req-uuid');
    expect(res.body.contact_info).toBe('support@foodbot.com');
  });

  test('201 and passes null userId for unauthenticated request', async () => {
    SupportService.prototype.createSupportRequest.mockResolvedValue({
      request_id: 'req-uuid-2',
      contact_info: 'support@foodbot.com',
    });

    await request(app)
      .post('/api/support/escalate')
      .send({ message: 'Problem with login.' });

    expect(SupportService.prototype.createSupportRequest).toHaveBeenCalledWith(
      null,
      'Problem with login.'
    );
  });

  test('contact_info is a non-empty string', async () => {
    SupportService.prototype.createSupportRequest.mockResolvedValue({
      request_id: 'req-uuid-3',
      contact_info: 'support@foodbot.com',
    });

    const res = await request(app)
      .post('/api/support/escalate')
      .send({ message: 'need help' });

    expect(typeof res.body.contact_info).toBe('string');
    expect(res.body.contact_info.length).toBeGreaterThan(0);
  });
});

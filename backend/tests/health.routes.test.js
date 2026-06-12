jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));

const request = require('supertest');
const app     = require('../server');

describe('GET /api/health', () => {
  test('returns 200 with status ok and a timestamp', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });
});

jest.mock('../src/db/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn(),
  },
}));
jest.mock('../src/services/OpenAIService');

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../src/db/supabase');
const OpenAIService = require('../src/services/OpenAIService');
const { resetOpenAIService } = require('../src/controllers/recipeController');

const RECIPE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567801';

function mockRecipeQuery(data, error = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error })
  };
  supabaseAdmin.from = jest.fn().mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  resetOpenAIService();
});

describe('GET /api/recipes/:id/instructions', () => {
  it('returns 200 with DB instructions when recipe has instructions', async () => {
    mockRecipeQuery({
      name: 'Lemon Garlic Chicken',
      instructions: '1. Season chicken. 2. Cook until golden.'
    });

    const res = await request(app).get(`/api/recipes/${RECIPE_ID}/instructions`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      steps: '1. Season chicken. 2. Cook until golden.',
      ai_generated: false
    });
  });

  it('falls back to OpenAI when instructions is null', async () => {
    mockRecipeQuery({ name: 'No Instructions Recipe', instructions: null });
    const mockInstance = {
      generateCookingInstructions: jest.fn()
        .mockResolvedValue('1. AI step one.\n2. AI step two.')
    };
    OpenAIService.mockImplementation(() => mockInstance);

    const res = await request(app).get(`/api/recipes/${RECIPE_ID}/instructions`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      steps: '1. AI step one.\n2. AI step two.',
      ai_generated: true
    });
    expect(mockInstance.generateCookingInstructions).toHaveBeenCalledWith('No Instructions Recipe');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('recipes');
  });

  it('falls back to OpenAI when instructions is empty string', async () => {
    mockRecipeQuery({ name: 'Empty Instructions Recipe', instructions: '' });
    const mockInstance = {
      generateCookingInstructions: jest.fn()
        .mockResolvedValue('1. Step one.')
    };
    OpenAIService.mockImplementation(() => mockInstance);

    const res = await request(app).get(`/api/recipes/${RECIPE_ID}/instructions`);

    expect(res.status).toBe(200);
    expect(res.body.ai_generated).toBe(true);
  });

  it('returns 404 when recipe does not exist', async () => {
    mockRecipeQuery(null, { code: 'PGRST116', message: 'Row not found' });

    const res = await request(app).get('/api/recipes/00000000-0000-0000-0000-000000000000/instructions');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 503 with error message when OpenAI fallback fails', async () => {
    mockRecipeQuery({ name: 'Recipe Without Instructions', instructions: null });
    const mockInstance = {
      generateCookingInstructions: jest.fn()
        .mockRejectedValue(new Error('OpenAI rate limit'))
    };
    OpenAIService.mockImplementation(() => mockInstance);

    const res = await request(app).get(`/api/recipes/${RECIPE_ID}/instructions`);

    expect(mockInstance.generateCookingInstructions).toHaveBeenCalledWith('Recipe Without Instructions');
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Cooking instructions unavailable, please try again later');
  });

  it('returns ai_generated: true for a stored-instructions recipe with source ai', async () => {
    mockRecipeQuery({ name: 'AI Beetroot Bowl', instructions: '1. Roast beetroot.', source: 'ai' });

    const res = await request(app).get(`/api/recipes/${RECIPE_ID}/instructions`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ steps: '1. Roast beetroot.', ai_generated: true });
  });
});

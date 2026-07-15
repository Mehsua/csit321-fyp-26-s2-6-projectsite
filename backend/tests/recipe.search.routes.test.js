jest.mock('../src/services/RecipeService');

const request = require('supertest');
const app = require('../server');
const RecipeService = require('../src/services/RecipeService');

const MOCK_RESULT = [
  {
    recipe_id: 'r-uuid-1',
    name: 'Lemon Garlic Chicken',
    description: 'A simple chicken dish.',
    instructions: '1. Season. 2. Cook.',
    cooking_time: 35,
    servings: 2,
    category: 'Western',
    score: 0.75,
    matching_ingredients: ['chicken', 'garlic'],
    missing_ingredients: ['lemon'],
    total_ingredients: 3,
    allergen_warning: false,
    allergens: [],
    dietary_tags: ['Halal'],
    nutrition: { calories: 320, protein_g: 28, carbs_g: 5, fats_g: 12, fibre_g: 1 }
  }
];

const MOCK_RECIPE_DETAIL = {
  recipe_id: 'r-uuid-1',
  name: 'Lemon Garlic Chicken',
  description: 'A simple chicken dish.',
  instructions: '1. Season chicken. 2. Cook.',
  cooking_time: 35,
  servings: 2,
  category: 'Western',
  source: 'db',
  is_active: true,
  recipe_ingredients: [{ is_optional: false, ingredients: { name: 'chicken', category: 'Meat' } }],
  recipe_dietary_tags: [{ dietary_tags: { name: 'Halal' } }],
  recipe_allergens: [],
  nutrition_info: { calories: 320, protein_g: 28, carbs_g: 5, fats_g: 12, fibre_g: 1 }
};

describe('POST /api/recipes/recommend', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with recipes array for valid ingredients', async () => {
    RecipeService.prototype.recommend = jest.fn().mockResolvedValue(MOCK_RESULT);

    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: ['chicken', 'garlic'] });

    expect(res.status).toBe(200);
    expect(res.body.recipes).toHaveLength(1);
    expect(res.body.recipes[0].recipe_id).toBe('r-uuid-1');
    expect(res.body.recipes[0].score).toBe(0.75);
  });

  it('passes dietary_tags and allergen_names to RecipeService', async () => {
    RecipeService.prototype.recommend = jest.fn().mockResolvedValue([]);

    await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: ['garlic'], dietary_tags: ['Halal'], allergen_names: ['Dairy'] });

    expect(RecipeService.prototype.recommend).toHaveBeenCalledWith({
      ingredients: ['garlic'],
      dietaryTags: ['Halal'],
      allergenNames: ['Dairy'],
      tasteProfile: null,
      medicalConditions: [],
    });
  });

  it('returns 200 with empty array when no matches found', async () => {
    RecipeService.prototype.recommend = jest.fn().mockResolvedValue([]);

    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: ['tofu'] });

    expect(res.status).toBe(200);
    expect(res.body.recipes).toEqual([]);
  });

  it('returns 400 when ingredients is missing', async () => {
    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when ingredients is empty array', async () => {
    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when ingredients is not an array', async () => {
    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: 'chicken' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when ingredients array contains empty strings', async () => {
    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: ['', 'chicken'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 500 when RecipeService throws', async () => {
    RecipeService.prototype.recommend = jest.fn().mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/recipes/recommend')
      .send({ ingredients: ['chicken'] });

    expect(res.status).toBe(500);
  });
});

describe('GET /api/recipes/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with full recipe data for a valid id', async () => {
    RecipeService.prototype.getById = jest.fn().mockResolvedValue(MOCK_RECIPE_DETAIL);

    const res = await request(app).get('/api/recipes/r-uuid-1');

    expect(res.status).toBe(200);
    expect(res.body.recipe.recipe_id).toBe('r-uuid-1');
    expect(res.body.recipe.name).toBe('Lemon Garlic Chicken');
  });

  it('returns 404 when recipe does not exist', async () => {
    RecipeService.prototype.getById = jest.fn().mockResolvedValue(null);

    const res = await request(app).get('/api/recipes/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 500 when RecipeService throws', async () => {
    RecipeService.prototype.getById = jest.fn().mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/recipes/r-uuid-1');

    expect(res.status).toBe(500);
  });
});

const { supabaseAdmin } = require('../db/supabase');
const OpenAIService = require('../services/OpenAIService');
const RecipeService = require('../services/RecipeService');

let openAIService;
function getOpenAIService() {
  if (!openAIService) openAIService = new OpenAIService();
  return openAIService;
}

function resetOpenAIService() {
  openAIService = null;
}

function getRecipeService() {
  return new RecipeService();
}

async function getInstructions(req, res, next) {
  try {
    const { id } = req.params;

    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .select('name, instructions')
      .eq('recipe_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      return next(error);
    }
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.instructions && recipe.instructions.trim()) {
      return res.status(200).json({ steps: recipe.instructions, ai_generated: false });
    }

    try {
      const steps = await getOpenAIService().generateCookingInstructions(recipe.name);
      return res.status(200).json({ steps, ai_generated: true });
    } catch {
      return res.status(503).json({ error: 'Cooking instructions unavailable, please try again later' });
    }
  } catch (err) {
    next(err);
  }
}

async function recommend(req, res, next) {
  try {
    const { ingredients, dietary_tags = [], allergen_names = [], taste_profile = null, medical_conditions = [] } = req.body;
    if (!Array.isArray(ingredients) || ingredients.length === 0 ||
        !ingredients.every(i => typeof i === 'string' && i.trim().length > 0)) {
      return res.status(400).json({ error: 'ingredients must be a non-empty array of strings' });
    }
    const recipes = await getRecipeService().recommend({
      ingredients,
      dietaryTags: dietary_tags,
      allergenNames: allergen_names,
      tasteProfile: taste_profile,
      medicalConditions: medical_conditions,
    });
    return res.status(200).json({ recipes });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const recipe = await getRecipeService().getById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    return res.status(200).json({ recipe });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInstructions, resetOpenAIService, recommend, getById };

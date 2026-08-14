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

const VALID_DIETARY_TAGS = ['GlutenFree', 'Halal', 'Vegan', 'Vegetarian'];
const VALID_ALLERGENS = ['Dairy', 'Eggs', 'Gluten', 'Peanuts', 'Shellfish', 'Soy'];

// Case-insensitive, prefix-tolerant canonicalization against a fixed vocabulary.
// Mirrors the looseness RecipeService._scoreRecipe already uses for allergen
// comparisons (d === u || d.startsWith(u) || u.startsWith(d)) so that real
// frontend values (e.g. lowercase "egg", "peanuts") resolve to their canonical
// form instead of being silently dropped. Anything that doesn't match the
// vocabulary even loosely is dropped, preserving the whitelist's security
// property.
function canonicalizeAgainstVocabulary(values, vocabulary) {
  if (!Array.isArray(values)) return [];
  const result = [];
  for (const raw of values) {
    if (typeof raw !== 'string') continue;
    const v = raw.toLowerCase().trim();
    if (!v) continue;
    const canonical = vocabulary.find(c => {
      const lc = c.toLowerCase();
      return lc === v || lc.startsWith(v) || v.startsWith(lc);
    });
    if (canonical && !result.includes(canonical)) {
      result.push(canonical);
    }
  }
  return result;
}

async function getInstructions(req, res, next) {
  try {
    const { id } = req.params;

    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .select('name, instructions, source')
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
      return res.status(200).json({ steps: recipe.instructions, ai_generated: recipe.source === 'ai' });
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
    const safeDietaryTags = canonicalizeAgainstVocabulary(dietary_tags, VALID_DIETARY_TAGS);
    const safeAllergenNames = canonicalizeAgainstVocabulary(allergen_names, VALID_ALLERGENS);

    const recipes = await getRecipeService().recommend({
      ingredients,
      dietaryTags: safeDietaryTags,
      allergenNames: safeAllergenNames,
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

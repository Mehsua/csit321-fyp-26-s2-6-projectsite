const { supabaseAdmin } = require('../db/supabase');
const OpenAIService = require('../services/OpenAIService');

let openAIService;
function getOpenAIService() {
  if (!openAIService) openAIService = new OpenAIService();
  return openAIService;
}

function resetOpenAIService() {
  openAIService = null;
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

module.exports = { getInstructions, resetOpenAIService };

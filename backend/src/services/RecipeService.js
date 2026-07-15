const { supabaseAdmin } = require('../db/supabase');

class RecipeService {
  async recommend({ ingredients = [], dietaryTags = [], allergenNames = [], tasteProfile = null, medicalConditions = [] }) {
    const userIngredients = ingredients.map(i => i.toLowerCase().trim());

    const { data: recipes, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        recipe_id, name, description, instructions, cooking_time, servings, category, source,
        recipe_ingredients(is_optional, ingredients(name)),
        recipe_dietary_tags(dietary_tags(name)),
        recipe_allergens(allergens(name)),
        nutrition_info(calories, protein_g, carbs_g, fats_g, fibre_g)
      `)
      .eq('is_active', true);

    if (error) throw new Error(error.message || String(error));

    return (recipes || [])
      .map(recipe => this._scoreRecipe(recipe, userIngredients, dietaryTags, allergenNames, tasteProfile, medicalConditions))
      .filter(r => r !== null && r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  _scoreRecipe(recipe, userIngredients, dietaryTags, allergenNames, tasteProfile, medicalConditions) {
    // Hard dietary exclusion
    if (dietaryTags.length > 0) {
      const recipeTags = (recipe.recipe_dietary_tags || [])
        .map(t => t.dietary_tags?.name?.toLowerCase())
        .filter(Boolean);
      const allTagsMet = dietaryTags.every(tag => recipeTags.includes(tag.toLowerCase()));
      if (!allTagsMet) return null;
    }

    // Base match score
    const recipeIngredients = (recipe.recipe_ingredients || [])
      .filter(ri => !ri.is_optional)
      .map(ri => ri.ingredients?.name?.toLowerCase())
      .filter(Boolean);

    const total = recipeIngredients.length;
    if (total === 0) return null;

    const matching = recipeIngredients.filter(ri =>
      userIngredients.some(ui => this._isIngredientMatch(ui, ri))
    );
    const matchingCount = matching.length;
    const missingCount = total - matchingCount;
    const baseScore = Math.max(0, matchingCount / total - missingCount * 0.05);

    // Taste profile boost (max +0.25 total, capped at 1.0)
    let tasteBoost = 0;
    if (tasteProfile) {
      const preferred = (tasteProfile.preferred_cuisines || []).map(c => c.toLowerCase());
      if (preferred.length > 0 && preferred.includes((recipe.category || '').toLowerCase())) {
        tasteBoost += 0.15;
      }
      if (
        tasteProfile.max_cooking_time &&
        recipe.cooking_time &&
        recipe.cooking_time <= tasteProfile.max_cooking_time
      ) {
        tasteBoost += 0.10;
      }
    }
    const score = parseFloat(Math.min(1, baseScore + tasteBoost).toFixed(4));

    // Soft allergen flag
    const recipeAllergenNames = (recipe.recipe_allergens || [])
      .map(ra => ra.allergens?.name?.toLowerCase())
      .filter(Boolean);
    const allergenWarning = allergenNames.length > 0 && allergenNames.some(userAllergen => {
      const u = userAllergen.toLowerCase();
      return recipeAllergenNames.some(d => d === u || d.startsWith(u) || u.startsWith(d));
    });

    // Medical warnings based on nutrition thresholds
    const medicalWarnings = [];
    if (medicalConditions.length > 0) {
      const n = recipe.nutrition_info;
      if (n) {
        if (medicalConditions.includes('Diabetes') && n.carbs_g > 45) {
          medicalWarnings.push('High carb — limit for diabetes');
        }
        if (
          (medicalConditions.includes('Hypertension') || medicalConditions.includes('HeartDisease')) &&
          n.fats_g > 20
        ) {
          medicalWarnings.push('High fat — limit for heart health');
        }
        if (medicalConditions.includes('WeightLoss') && n.calories > 450) {
          medicalWarnings.push('High calorie');
        }
      }
    }

    return {
      recipe_id: recipe.recipe_id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      category: recipe.category,
      score,
      matching_ingredients: matching,
      missing_ingredients: recipeIngredients.filter(ri =>
        !userIngredients.some(ui => this._isIngredientMatch(ui, ri))
      ),
      total_ingredients: total,
      allergen_warning: allergenWarning,
      allergens: recipeAllergenNames,
      dietary_tags: (recipe.recipe_dietary_tags || []).map(t => t.dietary_tags?.name).filter(Boolean),
      nutrition: recipe.nutrition_info
        ? {
            calories: recipe.nutrition_info.calories,
            protein_g: recipe.nutrition_info.protein_g,
            carbs_g: recipe.nutrition_info.carbs_g,
            fats_g: recipe.nutrition_info.fats_g,
            fibre_g: recipe.nutrition_info.fibre_g
          }
        : null,
      medical_warnings: medicalWarnings,
    };
  }

  _isIngredientMatch(userIng, recipeIng) {
    return userIng === recipeIng || userIng.includes(recipeIng) || recipeIng.includes(userIng);
  }

  async getById(recipeId) {
    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        recipe_id, name, description, instructions, cooking_time, servings, category, source, is_active,
        recipe_ingredients(is_optional, ingredients(name, category)),
        recipe_dietary_tags(dietary_tags(name)),
        recipe_allergens(allergens(name)),
        nutrition_info(calories, protein_g, carbs_g, fats_g, fibre_g)
      `)
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message || String(error));
    if (!recipe || !recipe.is_active) return null;
    return recipe;
  }
}

module.exports = RecipeService;

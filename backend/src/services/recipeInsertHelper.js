const { supabaseAdmin } = require('../db/supabase');

async function insertRecipe({
  name, description = null, category = null, cookingTime = null, servings = null,
  instructions = null, source = 'db',
  ingredients = [], dietaryTagNames = [], allergenNames = [], nutrition = null,
} = {}) {
  const { data: recipe, error: recipeError } = await supabaseAdmin
    .from('recipes')
    .insert({ name, description, category, cooking_time: cookingTime, servings, instructions, source })
    .select()
    .single();
  if (recipeError) throw recipeError;
  const recipeId = recipe.recipe_id;

  if (ingredients.length > 0) {
    const ingredientNames = ingredients.map(i => i.name);
    const { data: existing } = await supabaseAdmin.from('ingredients').select('ingredient_id, name').in('name', ingredientNames);
    const existingMap = new Map((existing ?? []).map(i => [i.name, i.ingredient_id]));
    const newOnes = ingredients.filter(i => !existingMap.has(i.name));
    if (newOnes.length > 0) {
      const { data: newIngs, error: ingError } = await supabaseAdmin
        .from('ingredients')
        .insert(newOnes.map(i => ({ name: i.name, category: i.category ?? null })))
        .select('ingredient_id, name');
      if (ingError) throw ingError;
      (newIngs ?? []).forEach(i => existingMap.set(i.name, i.ingredient_id));
    }
    const links = ingredientNames.filter(n => existingMap.has(n)).map(n => ({ recipe_id: recipeId, ingredient_id: existingMap.get(n) }));
    if (links.length > 0) {
      const { error: linkError } = await supabaseAdmin.from('recipe_ingredients').insert(links);
      if (linkError) throw linkError;
    }
  }

  if (dietaryTagNames.length > 0) {
    const { data: tags } = await supabaseAdmin.from('dietary_tags').select('tag_id').in('name', dietaryTagNames);
    if (tags?.length > 0) {
      const { error } = await supabaseAdmin.from('recipe_dietary_tags').insert(tags.map(t => ({ recipe_id: recipeId, tag_id: t.tag_id })));
      if (error) throw error;
    }
  }

  if (allergenNames.length > 0) {
    const { data: allergens } = await supabaseAdmin.from('allergens').select('allergen_id').in('name', allergenNames);
    if (allergens?.length > 0) {
      const { error } = await supabaseAdmin.from('recipe_allergens').insert(allergens.map(a => ({ recipe_id: recipeId, allergen_id: a.allergen_id })));
      if (error) throw error;
    }
  }

  if (nutrition) {
    const { error } = await supabaseAdmin.from('nutrition_info').insert({
      recipe_id: recipeId,
      calories: nutrition.calories ?? null,
      protein_g: nutrition.protein_g ?? null,
      carbs_g: nutrition.carbs_g ?? null,
      fats_g: nutrition.fats_g ?? null,
      fibre_g: nutrition.fibre_g ?? null,
    });
    if (error) throw error;
  }

  return recipe;
}

module.exports = { insertRecipe };

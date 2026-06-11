const { supabaseAdmin } = require('../db/supabase');

const MAX_FAVOURITES = 50;

class UserService {
  async getPreferences(userId) {
    const [{ data: dietaryRows }, { data: allergenRows }] = await Promise.all([
      supabaseAdmin
        .from('user_dietary_preferences')
        .select('dietary_tags(name)')
        .eq('user_id', userId),
      supabaseAdmin
        .from('user_allergens')
        .select('allergens(name)')
        .eq('user_id', userId),
    ]);
    return {
      dietaryTags: (dietaryRows || []).map(r => r.dietary_tags?.name).filter(Boolean),
      allergenNames: (allergenRows || []).map(r => r.allergens?.name).filter(Boolean),
    };
  }

  async setPreferences(userId, { dietaryTags = [], allergenNames = [] } = {}) {
    const [{ data: tagRows }, { data: allergenRows }] = await Promise.all([
      supabaseAdmin.from('dietary_tags').select('tag_id, name').in('name', dietaryTags),
      supabaseAdmin.from('allergens').select('allergen_id, name').in('name', allergenNames),
    ]);
    const tagIds = (tagRows || []).map(r => r.tag_id);
    const allergenIds = (allergenRows || []).map(r => r.allergen_id);

    await supabaseAdmin.from('user_dietary_preferences').delete().eq('user_id', userId);
    if (tagIds.length > 0) {
      await supabaseAdmin.from('user_dietary_preferences')
        .insert(tagIds.map(tag_id => ({ user_id: userId, tag_id })));
    }

    await supabaseAdmin.from('user_allergens').delete().eq('user_id', userId);
    if (allergenIds.length > 0) {
      await supabaseAdmin.from('user_allergens')
        .insert(allergenIds.map(allergen_id => ({ user_id: userId, allergen_id })));
    }
  }

  async getFavourites(userId) {
    const { data, error } = await supabaseAdmin
      .from('user_favourites')
      .select(`
        saved_at, score,
        recipes(
          recipe_id, name, cooking_time, category,
          recipe_dietary_tags(dietary_tags(name)),
          recipe_allergens(allergens(name)),
          nutrition_info(calories, protein_g, carbs_g, fats_g)
        )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw new Error(error.message || String(error));

    const favourites = (data || []).filter(row => row.recipes).map(row => ({
      recipe_id: row.recipes?.recipe_id,
      name: row.recipes?.name,
      cooking_time: row.recipes?.cooking_time,
      category: row.recipes?.category,
      saved_at: row.saved_at,
      score: row.score,
      dietary_tags: (row.recipes?.recipe_dietary_tags || [])
        .map(t => t.dietary_tags?.name).filter(Boolean),
      allergens: (row.recipes?.recipe_allergens || [])
        .map(a => a.allergens?.name).filter(Boolean),
      nutrition: row.recipes?.nutrition_info
        ? {
            calories: row.recipes.nutrition_info.calories,
            protein: row.recipes.nutrition_info.protein_g,
            carbs: row.recipes.nutrition_info.carbs_g,
            fats: row.recipes.nutrition_info.fats_g,
          }
        : null,
    }));

    return { count: favourites.length, remaining: MAX_FAVOURITES - favourites.length, favourites };
  }

  async addFavourite(userId, recipeId, score = null) {
    const { count } = await supabaseAdmin
      .from('user_favourites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count >= MAX_FAVOURITES) {
      throw Object.assign(new Error('Maximum 50 favourites reached'), { status: 409 });
    }

    const row = { user_id: userId, recipe_id: recipeId };
    if (score != null) row.score = score;

    const { error } = await supabaseAdmin.from('user_favourites').insert(row);
    if (error) {
      if (error.code === '23505') {
        throw Object.assign(new Error('Already saved'), { status: 409 });
      }
      throw new Error(error.message || String(error));
    }
  }

  async removeFavourite(userId, recipeId) {
    const { error } = await supabaseAdmin
      .from('user_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw new Error(error.message || String(error));
  }
}

module.exports = UserService;

const { supabaseAdmin } = require('../db/supabase');

class AdminService {
  async getDashboardStats() {
    const [recipesRes, usersRes, sessionsRes, errorsRes] = await Promise.all([
      supabaseAdmin.from('recipes').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'registered').eq('is_active', true),
      supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
      supabaseAdmin.from('error_logs').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
    ]);
    if (recipesRes.error) throw recipesRes.error;
    if (usersRes.error) throw usersRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (errorsRes.error) throw errorsRes.error;
    return {
      totalRecipes: recipesRes.count ?? 0,
      registeredUsers: usersRes.count ?? 0,
      activeSessions: sessionsRes.count ?? 0,
      unresolvedErrors: errorsRes.count ?? 0,
    };
  }

  async getRecentRecipes(limit = 5) {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('recipe_id, name, category, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getRecentErrors(limit = 5) {
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .select('log_id, error_type, message, endpoint, user_id, is_resolved, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async getErrorLogs({ type = '', status = '', search = '', page = 1, pageSize = 20 } = {}) {
    let query = supabaseAdmin
      .from('error_logs')
      .select('log_id, error_type, message, endpoint, user_id, is_resolved, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (type) query = query.eq('error_type', type);
    if (status === 'open') query = query.eq('is_resolved', false);
    if (status === 'resolved') query = query.eq('is_resolved', true);
    if (search) query = query.ilike('message', `%${search}%`);
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { logs: data ?? [], total: count ?? 0 };
  }

  async resolveErrorLog(logId) {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .update({ is_resolved: true })
      .eq('log_id', logId);
    if (error) throw error;
  }

  async clearResolvedLogs() {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .eq('is_resolved', true);
    if (error) throw error;
  }

  async listRecipes({ search = '', category = '', page = 1, pageSize = 20 } = {}) {
    let query = supabaseAdmin
      .from('recipes')
      .select(`
        recipe_id, name, category, cooking_time, servings, is_active, created_at,
        recipe_dietary_tags(dietary_tags(name)),
        recipe_allergens(allergens(name)),
        recipe_ingredients(ingredient_id),
        nutrition_info(calories)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    const recipes = (data ?? []).map(r => ({
      recipe_id: r.recipe_id,
      name: r.name,
      category: r.category,
      cooking_time: r.cooking_time,
      servings: r.servings,
      is_active: r.is_active,
      created_at: r.created_at,
      dietary_tags: (r.recipe_dietary_tags || []).map(t => t.dietary_tags?.name).filter(Boolean),
      allergens: (r.recipe_allergens || []).map(a => a.allergens?.name).filter(Boolean),
      ingredient_count: (r.recipe_ingredients || []).length,
      has_nutrition: r.nutrition_info != null,
    }));
    return { recipes, total: count ?? 0 };
  }

  async createRecipe({ name, description = null, category = null, cookingTime = null, servings = null, instructions = null, ingredientNames = [], dietaryTagNames = [], allergenNames = [], nutrition = null } = {}) {
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert({ name, description, category, cooking_time: cookingTime, servings, instructions, source: 'db' })
      .select()
      .single();
    if (recipeError) throw recipeError;
    const recipeId = recipe.recipe_id;

    if (ingredientNames.length > 0) {
      const { data: existing } = await supabaseAdmin.from('ingredients').select('ingredient_id, name').in('name', ingredientNames);
      const existingMap = new Map((existing ?? []).map(i => [i.name, i.ingredient_id]));
      const newNames = ingredientNames.filter(n => !existingMap.has(n));
      if (newNames.length > 0) {
        const { data: newIngs, error: ingError } = await supabaseAdmin.from('ingredients').insert(newNames.map(name => ({ name }))).select('ingredient_id, name');
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

  async updateRecipe(recipeId, { name, description, category, cookingTime, servings, instructions, ingredientNames, dietaryTagNames, allergenNames, nutrition } = {}) {
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (description !== undefined) fields.description = description;
    if (category !== undefined) fields.category = category;
    if (cookingTime !== undefined) fields.cooking_time = cookingTime;
    if (servings !== undefined) fields.servings = servings;
    if (instructions !== undefined) fields.instructions = instructions;

    if (Object.keys(fields).length > 0) {
      const { error } = await supabaseAdmin.from('recipes').update(fields).eq('recipe_id', recipeId);
      if (error) throw error;
    }

    if (ingredientNames !== undefined) {
      await supabaseAdmin.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      if (ingredientNames.length > 0) {
        const { data: existing } = await supabaseAdmin.from('ingredients').select('ingredient_id, name').in('name', ingredientNames);
        const existingMap = new Map((existing ?? []).map(i => [i.name, i.ingredient_id]));
        const newNames = ingredientNames.filter(n => !existingMap.has(n));
        if (newNames.length > 0) {
          const { data: newIngs, error } = await supabaseAdmin.from('ingredients').insert(newNames.map(name => ({ name }))).select('ingredient_id, name');
          if (error) throw error;
          (newIngs ?? []).forEach(i => existingMap.set(i.name, i.ingredient_id));
        }
        const links = ingredientNames.filter(n => existingMap.has(n)).map(n => ({ recipe_id: recipeId, ingredient_id: existingMap.get(n) }));
        if (links.length > 0) {
          const { error } = await supabaseAdmin.from('recipe_ingredients').insert(links);
          if (error) throw error;
        }
      }
    }

    if (dietaryTagNames !== undefined) {
      await supabaseAdmin.from('recipe_dietary_tags').delete().eq('recipe_id', recipeId);
      if (dietaryTagNames.length > 0) {
        const { data: tags } = await supabaseAdmin.from('dietary_tags').select('tag_id').in('name', dietaryTagNames);
        if (tags?.length > 0) {
          const { error } = await supabaseAdmin.from('recipe_dietary_tags').insert(tags.map(t => ({ recipe_id: recipeId, tag_id: t.tag_id })));
          if (error) throw error;
        }
      }
    }

    if (allergenNames !== undefined) {
      await supabaseAdmin.from('recipe_allergens').delete().eq('recipe_id', recipeId);
      if (allergenNames.length > 0) {
        const { data: allergens } = await supabaseAdmin.from('allergens').select('allergen_id').in('name', allergenNames);
        if (allergens?.length > 0) {
          const { error } = await supabaseAdmin.from('recipe_allergens').insert(allergens.map(a => ({ recipe_id: recipeId, allergen_id: a.allergen_id })));
          if (error) throw error;
        }
      }
    }

    if (nutrition !== undefined) {
      const { error } = await supabaseAdmin.from('nutrition_info').upsert({
        recipe_id: recipeId,
        calories: nutrition?.calories ?? null,
        protein_g: nutrition?.protein_g ?? null,
        carbs_g: nutrition?.carbs_g ?? null,
        fats_g: nutrition?.fats_g ?? null,
        fibre_g: nutrition?.fibre_g ?? null,
      }, { onConflict: 'recipe_id' });
      if (error) throw error;
    }
  }

  async deleteRecipe(recipeId) {
    const { error } = await supabaseAdmin
      .from('recipes')
      .update({ is_active: false })
      .eq('recipe_id', recipeId);
    if (error) throw error;
  }

  async listUsers({ search = '', role = '', status = '', page = 1, pageSize = 20 } = {}) {
    let query = supabaseAdmin
      .from('users')
      .select('user_id, name, email, role, is_locked, is_active, fail_count, lock_until, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) query = query.eq('role', role);
    if (status === 'locked') query = query.eq('is_locked', true);
    if (status === 'inactive') query = query.eq('is_active', false);
    if (status === 'active') query = query.eq('is_active', true).eq('is_locked', false);
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { users: data ?? [], total: count ?? 0 };
  }

  async lockUser(userId) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_locked: true })
      .eq('user_id', userId);
    if (error) throw error;
  }

  async unlockUser(userId) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_locked: false, fail_count: 0, lock_until: null })
      .eq('user_id', userId);
    if (error) throw error;
  }

  async deactivateUser(userId) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('user_id', userId);
    if (error) throw error;
  }

  async reactivateUser(userId) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: true, is_locked: false, fail_count: 0, lock_until: null })
      .eq('user_id', userId);
    if (error) throw error;
  }
}

module.exports = AdminService;

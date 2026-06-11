const { supabaseAdmin } = require('../db/supabase');

class MealPlanService {
  async generateAndSavePlan(userId, sessionIngredients = [], numDays = 3, dietaryTags = []) {
    const userIngredients = sessionIngredients.map(i => i.toLowerCase().trim());

    const { data: recipes, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        recipe_id, name, cooking_time,
        recipe_ingredients(is_optional, ingredients(name, is_perishable)),
        recipe_dietary_tags(dietary_tags(name)),
        nutrition_info(calories, protein_g, carbs_g, fats_g)
      `)
      .eq('is_active', true);
    if (error) throw new Error(error.message);

    const scored = [];
    for (const recipe of (recipes || [])) {
      if (dietaryTags.length > 0) {
        const recipeTags = (recipe.recipe_dietary_tags || [])
          .map(t => t.dietary_tags?.name?.toLowerCase()).filter(Boolean);
        if (!dietaryTags.every(tag => recipeTags.includes(tag))) continue;
      }

      const required = (recipe.recipe_ingredients || [])
        .filter(ri => !ri.is_optional && ri.ingredients)
        .map(ri => ri.ingredients);
      const total = required.length;
      if (total === 0) continue;

      const matched = required.filter(ing =>
        userIngredients.some(ui => {
          const ri = ing.name.toLowerCase();
          return ui === ri || ui.includes(ri) || ri.includes(ui);
        })
      );
      const matchingCount = matched.length;
      const missingCount = total - matchingCount;
      const score = parseFloat(Math.max(0, matchingCount / total - missingCount * 0.05).toFixed(4));
      if (score === 0) continue;

      const hasPerishable = matched.some(ing => ing.is_perishable);
      if (!hasPerishable) continue;

      scored.push({
        recipe_id: recipe.recipe_id,
        name: recipe.name,
        cooking_time: recipe.cooking_time,
        nutrition: recipe.nutrition_info || null,
        score,
        hasPerishable,
        perishable_warnings: matched.filter(ing => ing.is_perishable).map(ing => ing.name),
        all_required: required,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    const RECIPES_PER_DAY = 2;
    const selected = scored.slice(0, numDays * RECIPES_PER_DAY);

    const sessionSet = new Set(userIngredients);
    const topUpMap = new Map();
    const days = [];

    for (let d = 1; d <= numDays; d++) {
      const start = (d - 1) * RECIPES_PER_DAY;
      const dayRecipes = selected.slice(start, start + RECIPES_PER_DAY);
      const nutrition_summary = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };

      for (const r of dayRecipes) {
        const n = r.nutrition || {};
        nutrition_summary.calories += n.calories || 0;
        nutrition_summary.protein_g += n.protein_g || 0;
        nutrition_summary.carbs_g += n.carbs_g || 0;
        nutrition_summary.fats_g += n.fats_g || 0;

        for (const ing of r.all_required) {
          if (!sessionSet.has(ing.name.toLowerCase())) {
            topUpMap.set(ing.name.toLowerCase(), ing.name);
          }
        }
      }

      days.push({
        day_number: d,
        recipes: dayRecipes.map(r => ({
          recipe_id: r.recipe_id,
          name: r.name,
          cooking_time: r.cooking_time,
          nutrition: r.nutrition,
          perishable_warnings: r.perishable_warnings,
        })),
        nutrition_summary,
      });
    }

    const top_up_items = Array.from(topUpMap.values()).map(name => ({ name }));

    let plan_id = null;
    if (userId) {
      const { data: plan, error: planError } = await supabaseAdmin
        .from('meal_plans')
        .insert({ user_id: userId, number_of_days: numDays })
        .select('plan_id')
        .single();
      if (planError) throw new Error(planError.message);
      plan_id = plan.plan_id;

      const items = [];
      for (const d of days) {
        for (const r of d.recipes) {
          items.push({ plan_id, recipe_id: r.recipe_id, day_number: d.day_number });
        }
      }
      if (items.length > 0) {
        const { error: itemsError } = await supabaseAdmin
          .from('meal_plan_items')
          .insert(items);
        if (itemsError) throw new Error(itemsError.message);
      }
    }

    return { plan_id, number_of_days: numDays, days, top_up_items };
  }

  async getPlan(userId) {
    const { data: plans, error } = await supabaseAdmin
      .from('meal_plans')
      .select('plan_id, number_of_days, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    if (!plans?.length) return null;

    const plan = plans[0];
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('meal_plan_items')
      .select(`
        item_id, day_number,
        recipes(recipe_id, name, cooking_time, nutrition_info(calories, protein_g, carbs_g, fats_g))
      `)
      .eq('plan_id', plan.plan_id)
      .order('day_number');
    if (itemsError) throw new Error(itemsError.message);

    const dayMap = {};
    for (let d = 1; d <= plan.number_of_days; d++) {
      dayMap[d] = {
        day_number: d,
        items: [],
        nutrition_summary: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
      };
    }
    for (const item of (items || [])) {
      const d = item.day_number;
      if (!dayMap[d]) continue;
      const recipe = item.recipes;
      dayMap[d].items.push({
        item_id: item.item_id,
        recipe_id: recipe?.recipe_id,
        name: recipe?.name,
        cooking_time: recipe?.cooking_time,
        nutrition: recipe?.nutrition_info || null,
      });
      const n = recipe?.nutrition_info || {};
      dayMap[d].nutrition_summary.calories += n.calories || 0;
      dayMap[d].nutrition_summary.protein_g += n.protein_g || 0;
      dayMap[d].nutrition_summary.carbs_g += n.carbs_g || 0;
      dayMap[d].nutrition_summary.fats_g += n.fats_g || 0;
    }

    return {
      plan_id: plan.plan_id,
      number_of_days: plan.number_of_days,
      created_at: plan.created_at,
      days: Object.values(dayMap),
    };
  }

  async deletePlanItem(userId, itemId) {
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('meal_plan_items')
      .select('item_id, meal_plans(user_id)')
      .eq('item_id', itemId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    if (!item || item.meal_plans?.user_id !== userId) {
      throw Object.assign(new Error('Meal plan item not found'), { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('meal_plan_items')
      .delete()
      .eq('item_id', itemId);
    if (error) throw new Error(error.message);
  }

  async addItemToPlan(userId, recipeId, dayNumber = 1) {
    const { data: plans } = await supabaseAdmin
      .from('meal_plans')
      .select('plan_id, number_of_days')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    let planId;
    let numDays = 3;
    if (!plans?.length) {
      const { data: newPlan, error: planError } = await supabaseAdmin
        .from('meal_plans')
        .insert({ user_id: userId, number_of_days: 3 })
        .select('plan_id, number_of_days')
        .single();
      if (planError) throw new Error(planError.message);
      planId = newPlan.plan_id;
      numDays = newPlan.number_of_days;
    } else {
      planId = plans[0].plan_id;
      numDays = plans[0].number_of_days;
    }

    const safeDay = Math.min(Math.max(1, dayNumber), numDays);
    const { error: itemError } = await supabaseAdmin
      .from('meal_plan_items')
      .insert({ plan_id: planId, recipe_id: recipeId, day_number: safeDay });
    if (itemError) throw new Error(itemError.message);

    return planId;
  }
}

module.exports = MealPlanService;

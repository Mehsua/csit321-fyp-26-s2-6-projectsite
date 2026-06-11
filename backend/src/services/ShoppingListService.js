const { supabaseAdmin } = require('../db/supabase');

class ShoppingListService {
  async generateMissingItems(recipeId, sessionIngredients = []) {
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .select('name')
      .eq('recipe_id', recipeId)
      .single();
    if (recipeError || !recipe) return [];

    const { data: riData } = await supabaseAdmin
      .from('recipe_ingredients')
      .select('quantity, unit, ingredients(ingredient_id, name, category)')
      .eq('recipe_id', recipeId);

    const sessionSet = new Set(
      sessionIngredients.map(s => s.toLowerCase().trim())
    );

    return (riData || [])
      .filter(row => row.ingredients && !sessionSet.has(row.ingredients.name.toLowerCase()))
      .map(row => ({
        ingredient_id: row.ingredients.ingredient_id,
        name: row.ingredients.name,
        category: row.ingredients.category || 'Other',
        quantity: row.quantity,
        unit: row.unit,
        recipe_name: recipe.name,
      }));
  }

  async saveList(userId, items) {
    const { data: lists } = await supabaseAdmin
      .from('shopping_lists')
      .select('list_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    let listId;
    if (!lists?.length) {
      const { data: newList, error: insertError } = await supabaseAdmin
        .from('shopping_lists')
        .insert({ user_id: userId })
        .select('list_id')
        .single();
      if (insertError || !newList) throw new Error('Failed to create shopping list');
      listId = newList.list_id;
    } else {
      listId = lists[0].list_id;
    }

    if (items.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('shopping_list_items')
        .upsert(
          items.map(item => ({
            list_id: listId,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity || null,
            unit: item.unit || null,
            is_checked: false,
          })),
          { onConflict: 'list_id,ingredient_id', ignoreDuplicates: true }
        );
      if (upsertError) throw new Error('Failed to save shopping list items');
    }
    return listId;
  }

  async getList(userId) {
    const { data: lists } = await supabaseAdmin
      .from('shopping_lists')
      .select('list_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!lists?.length) return { list_id: null, items: [] };

    const listId = lists[0].list_id;
    const { data: items, error } = await supabaseAdmin
      .from('shopping_list_items')
      .select('item_id, quantity, unit, is_checked, ingredients(ingredient_id, name, category)')
      .eq('list_id', listId);

    if (error) throw new Error(error.message);

    return {
      list_id: listId,
      items: (items || []).map(row => ({
        item_id: row.item_id,
        ingredient_id: row.ingredients?.ingredient_id,
        name: row.ingredients?.name,
        category: row.ingredients?.category || 'Other',
        quantity: row.quantity,
        unit: row.unit,
        is_checked: row.is_checked,
      })),
    };
  }

  async clearList(userId) {
    const { error } = await supabaseAdmin
      .from('shopping_lists')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  }
}

module.exports = ShoppingListService;

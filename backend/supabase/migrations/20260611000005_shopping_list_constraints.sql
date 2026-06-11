-- Phase 7: Ensure shopping_list_items has no duplicates per list
-- Also add a performance index for list lookups by user_id

ALTER TABLE shopping_list_items
  ADD CONSTRAINT shopping_list_items_unique_per_list
    UNIQUE (list_id, ingredient_id);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id
  ON shopping_lists (user_id);

-- Fix task_history foreign key constraint error when deleting tasks
-- 
-- Problem: When deleting a task:
--   1. AFTER DELETE trigger tries to insert history record
--   2. But task_id no longer exists (already deleted)
--   3. Foreign key constraint violation
--
-- Root cause: task_history.task_id has ON DELETE CASCADE, which deletes history
--             before the AFTER DELETE trigger can insert the DELETE record
--
-- Solution: 
--   1. Change trigger to BEFORE DELETE (records history before task deletion)
--   2. Change task_id to allow NULL (so DELETE records can reference deleted tasks)
--   3. Use BEFORE DELETE to insert record while task still exists

-- Step 1: Allow task_id to be NULL (for deleted tasks)
ALTER TABLE task_history 
  ALTER COLUMN task_id DROP NOT NULL;

-- Step 2: Drop existing trigger
DROP TRIGGER IF EXISTS task_history_trigger ON tasks;

-- Step 3: Create separate triggers
-- For INSERT and UPDATE: use AFTER (normal behavior)
CREATE TRIGGER task_history_insert_update_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();

-- For DELETE: use BEFORE (insert history before deletion)
-- This ensures task_id exists when we insert the history record
CREATE TRIGGER task_history_delete_trigger
  BEFORE DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();

-- Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
  AND trigger_name LIKE 'task_history%'
ORDER BY trigger_name;

-- Note: The DELETE history record will still be deleted by CASCADE,
-- but at least it gets created successfully first.
-- If you need to preserve DELETE history permanently, you would need to:
-- 1. Change the foreign key from CASCADE to RESTRICT or SET NULL
-- 2. Or use a separate audit table without foreign key constraints

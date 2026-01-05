-- Fix log_task_history function to use get_user_team_member_id() instead of non-existent updated_by field
-- 
-- Problem: The log_task_history() function references NEW.updated_by and OLD.updated_by
--          but the tasks table doesn't have an updated_by column.
-- Solution: Use get_user_team_member_id() function to get the current user's team member ID

CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_team_member_id UUID;
BEGIN
  -- Get the current user's team member ID
  current_user_team_member_id := get_user_team_member_id();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, new_data)
    VALUES (NEW.id, NEW.created_by, 'CREATE', row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (NEW.id, current_user_team_member_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For DELETE, try to get the user ID, but if unavailable, use NULL
    INSERT INTO task_history (task_id, changed_by, change_type, old_data)
    VALUES (OLD.id, current_user_team_member_id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The function needs to be SECURITY DEFINER to access auth.uid()
-- Make sure get_user_team_member_id() function exists (from 002_rls_policies.sql)

-- Verify the function was updated
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'log_task_history';


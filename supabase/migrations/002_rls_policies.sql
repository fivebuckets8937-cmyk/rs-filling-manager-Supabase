-- Enable Row Level Security on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's team_member id
CREATE OR REPLACE FUNCTION get_user_team_member_id()
RETURNS UUID AS $$
  SELECT id FROM team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid() AND role = 'MANAGER'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Team Members Policies
-- Users can view all team members
CREATE POLICY "Users can view all team members"
  ON team_members FOR SELECT
  USING (true);

-- Users can only update their own team_member record
CREATE POLICY "Users can update own team member"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

-- Tasks Policies
-- Managers can view all tasks
CREATE POLICY "Managers can view all tasks"
  ON tasks FOR SELECT
  USING (is_manager());

-- Regular members can view tasks assigned to them or created by them
CREATE POLICY "Members can view own tasks"
  ON tasks FOR SELECT
  USING (
    assignee_id = get_user_team_member_id() 
    OR created_by = get_user_team_member_id()
  );

-- Managers can insert tasks
CREATE POLICY "Managers can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (is_manager());

-- Users can create tasks if they are assigned as creator
CREATE POLICY "Users can create tasks as creator"
  ON tasks FOR INSERT
  WITH CHECK (created_by = get_user_team_member_id());

-- Managers can update all tasks
CREATE POLICY "Managers can update all tasks"
  ON tasks FOR UPDATE
  USING (is_manager());

-- Task assignees can update their assigned tasks
CREATE POLICY "Assignees can update assigned tasks"
  ON tasks FOR UPDATE
  USING (assignee_id = get_user_team_member_id());

-- Task creators can update their created tasks
CREATE POLICY "Creators can update created tasks"
  ON tasks FOR UPDATE
  USING (created_by = get_user_team_member_id());

-- Managers can delete tasks
CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  USING (is_manager());

-- Task Progress Policies
-- Users can view progress for tasks they have access to
CREATE POLICY "Users can view accessible task progress"
  ON task_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_progress.task_id
      AND (
        is_manager()
        OR t.assignee_id = get_user_team_member_id()
        OR t.created_by = get_user_team_member_id()
      )
    )
  );

-- Users can insert/update progress for accessible tasks
CREATE POLICY "Users can manage accessible task progress"
  ON task_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_progress.task_id
      AND (
        is_manager()
        OR t.assignee_id = get_user_team_member_id()
        OR t.created_by = get_user_team_member_id()
      )
    )
  );

-- Task History Policies
-- Users can view history for tasks they have access to
CREATE POLICY "Users can view accessible task history"
  ON task_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_history.task_id
      AND (
        is_manager()
        OR t.assignee_id = get_user_team_member_id()
        OR t.created_by = get_user_team_member_id()
      )
    )
  );


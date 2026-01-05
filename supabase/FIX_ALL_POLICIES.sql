-- ============================================
-- 修复重复策略错误 - 一次性修复脚本
-- ============================================
-- 
-- 如果遇到 "policy already exists" 错误，运行此脚本
-- 此脚本会安全地删除并重新创建所有策略
-- ============================================

-- ============================================
-- 删除所有现有策略（如果存在）
-- ============================================

-- Team Members 策略
DROP POLICY IF EXISTS "Users can view all team members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team member" ON team_members;

-- Tasks 策略
DROP POLICY IF EXISTS "Managers can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Members can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks as creator" ON tasks;
DROP POLICY IF EXISTS "Managers can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Assignees can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can update created tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;

-- Task Progress 策略
DROP POLICY IF EXISTS "Users can view accessible task progress" ON task_progress;
DROP POLICY IF EXISTS "Users can manage accessible task progress" ON task_progress;

-- Task History 策略
DROP POLICY IF EXISTS "Users can view accessible task history" ON task_history;
DROP POLICY IF EXISTS "Users can insert task history" ON task_history;

-- ============================================
-- 确保函数存在（这些通常是幂等的）
-- ============================================

CREATE OR REPLACE FUNCTION get_user_team_member_id()
RETURNS UUID AS $$
  SELECT id FROM team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid() AND role = 'MANAGER'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 确保 RLS 已启用
-- ============================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 重新创建所有策略
-- ============================================

-- Team Members Policies
CREATE POLICY "Users can view all team members"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Users can update own team member"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

-- Tasks Policies
CREATE POLICY "Managers can view all tasks"
  ON tasks FOR SELECT
  USING (is_manager());

CREATE POLICY "Members can view own tasks"
  ON tasks FOR SELECT
  USING (
    assignee_id = get_user_team_member_id() 
    OR created_by = get_user_team_member_id()
  );

CREATE POLICY "Managers can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (is_manager());

CREATE POLICY "Users can create tasks as creator"
  ON tasks FOR INSERT
  WITH CHECK (created_by = get_user_team_member_id());

CREATE POLICY "Managers can update all tasks"
  ON tasks FOR UPDATE
  USING (is_manager());

CREATE POLICY "Assignees can update assigned tasks"
  ON tasks FOR UPDATE
  USING (assignee_id = get_user_team_member_id());

CREATE POLICY "Creators can update created tasks"
  ON tasks FOR UPDATE
  USING (created_by = get_user_team_member_id());

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  USING (is_manager());

-- Task Progress Policies
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

CREATE POLICY "Users can insert task history"
  ON task_history FOR INSERT
  WITH CHECK (
    is_manager()
    OR changed_by = get_user_team_member_id()
  );

-- ============================================
-- 验证策略创建成功
-- ============================================

-- 查看所有策略
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('team_members', 'tasks', 'task_progress', 'task_history')
ORDER BY tablename, policyname;


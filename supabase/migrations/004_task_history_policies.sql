-- Allow task_history inserts from triggers when managers or owners perform changes
CREATE POLICY "Users can insert task history"
  ON task_history FOR INSERT
  WITH CHECK (
    is_manager()
    OR changed_by = get_user_team_member_id()
  );



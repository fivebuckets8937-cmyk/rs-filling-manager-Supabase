# 修复重复策略错误

## 错误信息
```
ERROR: 42710: policy "Users can insert task history" for table "task_history" already exists
```

## 问题原因

这个错误发生在重复执行 SQL 迁移脚本时。PostgreSQL 不允许创建同名的策略（Policy），如果策略已存在，再次执行 `CREATE POLICY` 会报错。

## 解决方案

### 方案一：使用修复后的迁移脚本（推荐）

我已经更新了 `004_task_history_policies.sql` 文件，添加了 `DROP POLICY IF EXISTS` 语句，可以安全地重复执行。

### 方案二：手动删除已存在的策略

如果错误已经发生，可以手动删除策略后重新创建：

```sql
-- 删除已存在的策略
DROP POLICY IF EXISTS "Users can insert task history" ON task_history;

-- 重新创建策略
CREATE POLICY "Users can insert task history"
  ON task_history FOR INSERT
  WITH CHECK (
    is_manager()
    OR changed_by = get_user_team_member_id()
  );
```

### 方案三：一次性修复所有可能的重复策略

如果需要修复所有可能重复的策略，可以执行以下脚本：

```sql
-- Task History 策略
DROP POLICY IF EXISTS "Users can insert task history" ON task_history;
DROP POLICY IF EXISTS "Users can view accessible task history" ON task_history;

-- 重新创建策略
-- View policy (should already exist from 002_rls_policies.sql, but safe to recreate)
DROP POLICY IF EXISTS "Users can view accessible task history" ON task_history;
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

-- Insert policy
CREATE POLICY "Users can insert task history"
  ON task_history FOR INSERT
  WITH CHECK (
    is_manager()
    OR changed_by = get_user_team_member_id()
  );
```

## 验证修复

执行以下查询验证策略是否正确创建：

```sql
-- 查看 task_history 表的所有策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'task_history'
ORDER BY policyname;
```

应该看到两条策略：
1. `Users can insert task history` (INSERT)
2. `Users can view accessible task history` (SELECT)

## 最佳实践

为了避免将来遇到类似问题：

1. **总是使用 `DROP POLICY IF EXISTS`**：在创建策略前先删除
2. **迁移脚本应该是幂等的**：可以安全地多次执行而不出错
3. **测试迁移脚本**：在开发环境测试多次执行迁移脚本

## 相关文件

- `supabase/migrations/002_rls_policies.sql` - 初始 RLS 策略
- `supabase/migrations/004_task_history_policies.sql` - Task History 插入策略（已修复）


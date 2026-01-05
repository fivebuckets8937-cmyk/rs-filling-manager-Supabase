# 修复 "record 'new' has no field 'updated_by'" 错误

## 错误信息
```
Error: Failed to run sql query: ERROR: record "new" has no field "updated_by"
```

## 问题原因

在 `log_task_history()` 触发函数中，代码试图访问 `NEW.updated_by` 和 `OLD.updated_by` 字段，但是 `tasks` 表中并没有 `updated_by` 字段。

查看 `tasks` 表结构：
- ✅ 有 `created_by` 字段（创建者）
- ✅ 有 `updated_at` 字段（更新时间）
- ❌ **没有** `updated_by` 字段（更新者）

但是触发器函数在第104行和第108行试图访问不存在的字段：
```sql
VALUES (NEW.id, NEW.updated_by, 'UPDATE', ...);  -- ❌ 错误
VALUES (OLD.id, OLD.updated_by, 'DELETE', ...);  -- ❌ 错误
```

## 解决方案

修改 `log_task_history()` 函数，使用 `get_user_team_member_id()` 函数来获取当前执行更新/删除操作的用户ID，而不是从不存在的字段获取。

### 方法一：执行修复脚本（推荐）

在 Supabase SQL Editor 中执行 `supabase/migrations/005_fix_task_history_trigger.sql` 文件。

这个脚本会：
1. 重新创建 `log_task_history()` 函数
2. 使用 `get_user_team_member_id()` 获取当前用户ID
3. 验证函数是否正确更新

### 方法二：手动执行 SQL

```sql
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
    INSERT INTO task_history (task_id, changed_by, change_type, old_data)
    VALUES (OLD.id, current_user_team_member_id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 修复内容说明

### 修复前（错误）
```sql
VALUES (NEW.id, NEW.updated_by, 'UPDATE', ...);  -- ❌ updated_by 不存在
VALUES (OLD.id, OLD.updated_by, 'DELETE', ...);  -- ❌ updated_by 不存在
```

### 修复后（正确）
```sql
current_user_team_member_id := get_user_team_member_id();  -- 获取当前用户ID
VALUES (NEW.id, current_user_team_member_id, 'UPDATE', ...);  -- ✅ 使用当前用户ID
VALUES (OLD.id, current_user_team_member_id, 'DELETE', ...);  -- ✅ 使用当前用户ID
```

## 工作原理

1. **INSERT 操作**：使用 `NEW.created_by`（创建任务的用户）
2. **UPDATE 操作**：使用 `get_user_team_member_id()` 获取当前执行更新的用户ID
3. **DELETE 操作**：使用 `get_user_team_member_id()` 获取当前执行删除的用户ID

`get_user_team_member_id()` 函数会：
- 从 `auth.uid()` 获取当前认证用户的ID
- 查询 `team_members` 表找到对应的 `team_member.id`
- 返回该ID用于记录在 `task_history` 中

## 验证修复

修复后，可以执行以下操作来验证：

1. **更新一个任务**：在前端编辑任务并保存
2. **检查 task_history 表**：
```sql
SELECT 
  th.id,
  th.task_id,
  th.change_type,
  th.changed_by,
  tm.name as changed_by_name,
  th.created_at
FROM task_history th
LEFT JOIN team_members tm ON th.changed_by = tm.id
ORDER BY th.created_at DESC
LIMIT 10;
```

应该能看到：
- ✅ 没有错误
- ✅ `changed_by` 字段正确记录了执行操作的用户
- ✅ 历史记录正确保存

## 注意事项

1. **函数执行权限**：函数使用 `SECURITY DEFINER`，这意味着它以函数创建者的权限执行，可以访问 `auth.uid()`
2. **用户未登录情况**：如果用户未登录或没有关联的 `team_member` 记录，`get_user_team_member_id()` 会返回 `NULL`，历史记录中的 `changed_by` 也会是 `NULL`
3. **向后兼容**：修复不会影响现有的历史记录，只是确保新的历史记录能正确保存

## 相关文件

- `supabase/migrations/001_initial_schema.sql` - 初始表结构和触发器（已修复）
- `supabase/migrations/005_fix_task_history_trigger.sql` - 修复脚本
- `supabase/migrations/002_rls_policies.sql` - 包含 `get_user_team_member_id()` 函数定义


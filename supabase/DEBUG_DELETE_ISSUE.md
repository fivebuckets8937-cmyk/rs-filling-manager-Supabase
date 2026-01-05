# 调试删除任务失败问题

## 问题描述
前端显示 "Failed to delete task" 错误。

## 可能的原因

### 1. 权限问题
- **RLS 策略未正确配置**：确保 "Managers can delete tasks" 策略存在
- **用户角色不是 MANAGER**：只有管理员可以删除任务
- **用户未登录或 session 过期**：检查认证状态

### 2. 数据库策略问题
检查以下策略是否存在：

```sql
-- 检查删除策略
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
WHERE tablename = 'tasks' AND cmd = 'DELETE';
```

应该看到策略："Managers can delete tasks"

### 3. 函数问题
检查 `is_manager()` 函数是否正常工作：

```sql
-- 测试 is_manager() 函数
SELECT is_manager() as is_manager_role;
```

### 4. 用户团队成员记录问题
确保当前用户有对应的 `team_members` 记录：

```sql
-- 检查当前用户的 team_member 记录
SELECT 
  tm.*,
  au.email,
  tm.role
FROM team_members tm
JOIN auth.users au ON tm.user_id = au.id
WHERE au.id = auth.uid();
```

## 调试步骤

### 步骤 1: 检查浏览器控制台
打开浏览器开发者工具（F12），查看 Console 标签页中的详细错误信息。

### 步骤 2: 验证用户角色
在应用中，确认当前登录用户是 MANAGER 角色。

### 步骤 3: 检查数据库策略
在 Supabase SQL Editor 中执行：

```sql
-- 检查所有 tasks 表的策略
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks';
```

### 步骤 4: 手动测试删除权限
在 Supabase SQL Editor 中执行（替换 task_id）：

```sql
-- 测试删除权限（需要以当前用户身份执行）
-- 在应用中使用 Supabase JS 客户端执行，或在 SQL Editor 中使用 SECURITY DEFINER 函数测试

-- 创建测试函数
CREATE OR REPLACE FUNCTION test_delete_task(test_task_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_is_manager BOOLEAN;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'Error: User not authenticated';
  END IF;
  
  user_is_manager := is_manager();
  
  IF NOT user_is_manager THEN
    RETURN 'Error: User is not a manager. Current role: ' || 
           (SELECT role FROM team_members WHERE user_id = current_user_id);
  END IF;
  
  -- 尝试删除
  DELETE FROM tasks WHERE id = test_task_id;
  
  IF FOUND THEN
    RETURN 'Success: Task deleted';
  ELSE
    RETURN 'Error: Task not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用方式（替换实际的 task_id）
-- SELECT test_delete_task('your-task-id-here'::uuid);
```

### 步骤 5: 检查 Supabase 客户端配置
确保 Supabase 客户端正确配置了认证：

```typescript
// 检查是否已登录
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// 检查当前用户
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

## 常见错误和解决方案

### 错误 1: "new row violates row-level security policy"
**原因**：RLS 策略阻止了删除操作
**解决**：
1. 确认策略存在：运行上面的 SQL 检查
2. 确认用户是 MANAGER：检查 team_members 表中的 role
3. 重新运行策略创建脚本：`supabase/migrations/002_rls_policies.sql`

### 错误 2: "permission denied for table tasks"
**原因**：用户没有删除权限
**解决**：
1. 检查 RLS 是否启用：`SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'tasks';`
2. 确认策略正确配置

### 错误 3: "function is_manager() does not exist"
**原因**：辅助函数未创建
**解决**：运行 `supabase/migrations/002_rls_policies.sql` 重新创建函数

### 错误 4: "No team member found"
**原因**：当前用户没有对应的 team_members 记录
**解决**：
1. 检查 auth.users 表中是否有当前用户
2. 在 team_members 表中创建对应的记录
3. 参考 `supabase/INSERT_TEAM_MEMBER.sql` 创建记录

## 修复脚本

如果策略丢失，运行修复脚本：

```sql
-- 运行完整的策略修复
-- 参考 supabase/FIX_ALL_POLICIES.sql

-- 或者只修复删除策略
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  USING (is_manager());
```

## 验证修复

修复后，执行以下步骤验证：

1. **刷新页面**，重新登录
2. **确认用户角色**：界面应显示 "Manager"
3. **尝试删除任务**：应该可以成功删除
4. **检查浏览器控制台**：不应该有错误信息
5. **检查数据库**：任务应该从 tasks 表中删除
6. **检查历史记录**：task_history 表中应该有 DELETE 类型的记录


# 修复删除任务时的外键约束错误

## 错误信息
```
insert or update on table "task_history" violates foreign key constraint "task_history_task_id_fkey"
```

## 问题原因

当删除任务时，发生以下序列：

1. **任务从 tasks 表中删除**
2. **CASCADE 删除**：由于 `task_history` 表的外键设置了 `ON DELETE CASCADE`，所有相关的历史记录被自动删除
3. **AFTER DELETE 触发器执行**：尝试在 `task_history` 表中插入一条 DELETE 记录
4. **外键约束失败**：由于任务已经被删除，`task_id` 不再存在于 `tasks` 表中，外键约束检查失败

**问题根源**：
- `task_history` 表的外键：`task_id UUID REFERENCES tasks(id) ON DELETE CASCADE`
- 触发器时机：`AFTER DELETE`（在删除之后执行）
- 当触发器执行时，任务已经被删除，外键引用失效

## 解决方案

将 DELETE 操作的触发器改为 `BEFORE DELETE`，在任务实际删除之前记录历史。

### 修复步骤

#### 方法一：执行修复脚本（推荐）

在 Supabase SQL Editor 中执行 `supabase/migrations/006_fix_task_history_trigger_timing.sql`

#### 方法二：手动执行

```sql
-- 1. 删除现有的触发器
DROP TRIGGER IF EXISTS task_history_trigger ON tasks;

-- 2. 为 INSERT 和 UPDATE 创建 AFTER 触发器
CREATE TRIGGER task_history_insert_update_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();

-- 3. 为 DELETE 创建 BEFORE 触发器（关键修复）
CREATE TRIGGER task_history_delete_trigger
  BEFORE DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();
```

### 为什么 BEFORE DELETE 可以解决问题？

1. **执行顺序**：
   - `BEFORE DELETE` 触发器在任务实际删除之前执行
   - 此时 `task_id` 仍然存在于 `tasks` 表中
   - 外键约束检查通过，可以成功插入历史记录

2. **CASCADE 行为**：
   - 触发器执行后，任务被删除
   - CASCADE 会删除之前的历史记录（CREATE、UPDATE等）
   - 但 DELETE 记录已经在删除之前插入，不受影响

3. **数据完整性**：
   - DELETE 历史记录会保留在 `task_history` 表中
   - 即使任务本身被删除，我们仍然知道它曾经存在和被删除的信息

## 验证修复

### 1. 检查触发器是否正确创建

```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
  AND trigger_name LIKE 'task_history%'
ORDER BY trigger_name;
```

应该看到两个触发器：
- `task_history_insert_update_trigger` - AFTER INSERT OR UPDATE
- `task_history_delete_trigger` - BEFORE DELETE

### 2. 测试删除功能

1. 选择一个测试任务
2. 执行删除操作
3. 检查是否成功删除
4. 检查 `task_history` 表中是否有 DELETE 记录：

```sql
SELECT 
  th.*,
  th.old_data->>'project_number' as project_number,
  th.old_data->>'batch_info' as batch_info
FROM task_history th
WHERE th.change_type = 'DELETE'
ORDER BY th.created_at DESC
LIMIT 5;
```

## 技术说明

### 触发器执行时机对比

| 操作 | 触发器时机 | 执行顺序 | 是否受 CASCADE 影响 |
|------|-----------|---------|-------------------|
| INSERT | AFTER | 插入后 → 记录历史 | 否 |
| UPDATE | AFTER | 更新后 → 记录历史 | 否 |
| DELETE (旧) | AFTER | 删除 → CASCADE删除历史 → 尝试记录（失败） | 是 ❌ |
| DELETE (新) | BEFORE | 记录历史 → 删除 → CASCADE删除旧历史 | 否 ✅ |

### 为什么 CASCADE 不会删除新插入的记录？

1. **BEFORE DELETE 触发器**在删除之前执行
2. 插入 DELETE 记录时，任务还存在（外键有效）
3. 然后任务被删除
4. CASCADE 删除发生在**插入 DELETE 记录之后**
5. 但是，由于时间差，新插入的 DELETE 记录也可能被 CASCADE 删除

**实际上，我们需要一个更好的解决方案**：修改外键约束或使用不同的方法来保存删除历史。

## 更好的解决方案（可选）

如果需要确保 DELETE 历史记录在 CASCADE 后仍然保留，可以考虑：

### 方案 1：将 task_id 改为可选（推荐用于审计）

```sql
-- 修改 task_history 表，允许 task_id 为 NULL（对于已删除的任务）
ALTER TABLE task_history 
  ALTER COLUMN task_id DROP NOT NULL;

-- 在删除历史记录时，仍然保存 task_id，即使任务被删除
-- 但由于 CASCADE，我们需要在触发器中使用不同的方法

-- 修改触发器，在删除前复制 task_id
CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_team_member_id UUID;
  deleted_task_id UUID;
BEGIN
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
    -- 保存 task_id 到变量（在删除前）
    deleted_task_id := OLD.id;
    -- 插入历史记录（此时 task_id 仍然存在）
    INSERT INTO task_history (task_id, changed_by, change_type, old_data)
    VALUES (deleted_task_id, current_user_team_member_id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**注意**：这个方案仍然可能受到 CASCADE 的影响。更好的方法是禁用 CASCADE 或使用 RESTRICT。

### 方案 2：禁用 CASCADE，手动管理（不推荐）

```sql
-- 修改外键约束
ALTER TABLE task_history 
  DROP CONSTRAINT task_history_task_id_fkey;

ALTER TABLE task_history
  ADD CONSTRAINT task_history_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT;
```

但这会导致无法删除任务（因为历史记录阻止删除）。

## 推荐的最终方案

当前修复（BEFORE DELETE 触发器）应该可以工作，因为：
1. 触发器在删除之前执行
2. 插入历史记录时任务仍存在
3. CASCADE 删除发生在插入之后，但由于时间差，新记录可能也会被删除

**如果问题仍然存在**，我们需要将 `task_id` 改为可选（允许 NULL），并在触发器中使用保存的 task_id 值。

## 测试

修复后，执行以下测试：

```sql
-- 1. 创建一个测试任务并删除它
-- 2. 检查历史记录
SELECT * FROM task_history 
WHERE change_type = 'DELETE' 
ORDER BY created_at DESC 
LIMIT 1;
```

如果看到 DELETE 记录，说明修复成功！


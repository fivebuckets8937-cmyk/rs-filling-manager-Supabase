# Supabase 数据库配置说明

## 数据库 Schema

本目录包含数据库迁移脚本，用于设置 RS Filling 管理系统的数据库结构。

## 迁移脚本

### 001_initial_schema.sql

创建以下数据库表：

- **team_members**: 团队成员表，关联 Supabase auth.users
- **tasks**: 任务主表
- **task_progress**: 任务进度详情表（8个步骤）
- **task_history**: 任务变更历史表（用于审计）

还包括：
- 索引优化
- 自动更新时间戳的触发器
- 任务历史记录的自动记录触发器

### 002_rls_policies.sql

配置 Row Level Security (RLS) 策略：

- 启用所有表的 RLS
- 创建辅助函数（get_user_team_member_id, is_manager）
- 配置访问策略：
  - 管理员可以查看和编辑所有任务
  - 普通成员只能访问分配给自己的任务或自己创建的任务

### 003_initial_data.sql

初始团队成员数据脚本（可选）：

- 包含创建初始团队成员的 SQL 模板
- 需要先创建 auth.users，然后关联 team_members
- 提供两种方式：基于邮箱查询或直接使用 UUID

## 使用步骤

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 依次执行迁移脚本（按顺序）：
   - `001_initial_schema.sql` - 创建表结构
   - `002_rls_policies.sql` - 配置安全策略
   - `003_initial_data.sql` - 初始化数据（可选）
3. 验证表结构是否正确创建
4. 测试 RLS 策略是否生效

## 数据初始化

### 方式 1：使用 SQL 脚本

1. 在 Supabase Dashboard > Authentication > Users 中创建用户
2. 记录用户的 ID 或邮箱
3. 在 SQL Editor 中执行 `003_initial_data.sql`，根据注释修改用户 ID

### 方式 2：使用 TypeScript 脚本

1. 确保已安装依赖：`npm install`
2. 设置环境变量（需要 Service Role Key）：
   ```env
   VITE_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. 运行脚本：
   ```bash
   npx tsx scripts/initTeamMembers.ts
   ```

**注意**：TypeScript 脚本需要 Service Role Key（不是 anon key），因为它需要创建用户。

## 验证

执行以下查询验证设置：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('team_members', 'tasks', 'task_progress', 'task_history');

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'tasks', 'task_progress', 'task_history');

-- 检查策略是否存在
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 注意事项

- 迁移脚本使用 `IF NOT EXISTS` 和 `CREATE OR REPLACE` 确保可以安全地重复执行
- RLS 策略在开发环境中可能需要调整，请根据实际需求修改
- 确保在创建用户后，及时创建对应的 team_member 记录


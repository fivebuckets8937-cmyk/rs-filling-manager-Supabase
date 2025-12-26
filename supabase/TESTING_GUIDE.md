# Supabase 测试指南

本指南将帮助你逐步在 Supabase 中配置和测试 RS Filling 管理系统。

## 前置条件

- 已创建 Supabase 项目
- 已获取 Supabase URL 和 API Key
- 已安装 Node.js 和 npm

## 步骤 1：执行数据库迁移

### 1.1 创建表结构

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 点击 **New query**
4. 复制 `supabase/migrations/001_initial_schema.sql` 的全部内容
5. 粘贴到 SQL Editor
6. 点击 **Run** 执行

**验证：**
```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('team_members', 'tasks', 'task_progress', 'task_history');
```

应该看到 4 个表。

### 1.2 配置安全策略

1. 在 SQL Editor 中新建查询
2. 复制 `supabase/migrations/002_rls_policies.sql` 的全部内容
3. 粘贴并执行

**验证：**
```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'tasks', 'task_progress', 'task_history');
```

所有表的 `rowsecurity` 应该为 `true`。

## 步骤 2：创建测试用户

### 2.1 创建认证用户

1. 进入 **Authentication > Users**
2. 点击 **Add user** > **Create new user**
3. 创建以下测试用户（至少创建一个用于测试）：

**推荐测试用户：**
- Email: `test@example.com`
- Password: `Test123456!`
- Auto Confirm User: ✅ (勾选)

### 2.2 创建团队成员记录

1. 在 **Authentication > Users** 中，找到刚创建的用户
2. 复制用户的 **UUID** (ID 列)
3. 进入 **SQL Editor**，执行以下 SQL（替换 `USER_UUID_HERE` 为实际 UUID）：

```sql
-- 创建测试用户的团队成员记录
INSERT INTO team_members (user_id, name, role, avatar)
VALUES (
  'USER_UUID_HERE',  -- 替换为实际用户 UUID
  'Test User', 
  'MANAGER',  -- 或 'MEMBER'
  'https://ui-avatars.com/api/?name=Test+User&background=0f172a&color=fff'
);
```

**验证：**
```sql
-- 检查团队成员是否创建成功
SELECT tm.*, au.email 
FROM team_members tm
LEFT JOIN auth.users au ON tm.user_id = au.id;
```

## 步骤 3：配置环境变量

1. 在项目根目录创建 `.env.local` 文件
2. 从 Supabase Dashboard > **Settings > API** 获取：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

3. 在 `.env.local` 中添加：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For AI features
API_KEY=your_gemini_api_key
```

## 步骤 4：安装依赖并运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 步骤 5：测试功能

### 5.1 登录测试

1. 打开应用（通常是 `http://localhost:5173`）
2. 使用创建的测试用户登录：
   - Email: `test@example.com`
   - Password: `Test123456!`
3. 验证：
   - ✅ 能够成功登录
   - ✅ 看到仪表盘界面
   - ✅ 侧边栏显示用户名

### 5.2 团队成员加载测试

登录后验证：
- ✅ 团队成员列表已加载（用于任务分配）
- ✅ 工作负载图表显示团队成员
- ✅ AI 简报功能可以访问团队成员数据

**如果团队成员为空：**
- 检查浏览器控制台是否有错误
- 验证 team_members 表中是否有数据
- 检查 RLS 策略是否正确配置

### 5.3 任务创建测试

1. 点击 **新建灌装任务** 按钮
2. 填写任务信息：
   - Project Number: `TEST-001`
   - Batch Info: `BATCH-TEST`
   - Start Date: 选择今天
   - 其他字段可选
3. 点击 **保存任务**
4. 验证：
   - ✅ 任务成功保存
   - ✅ 任务出现在任务列表中
   - ✅ 任务 ID 是 UUID 格式

### 5.4 实时同步测试

1. 在浏览器中打开两个标签页，都登录同一个用户
2. 在第一个标签页创建或修改任务
3. 验证：
   - ✅ 第二个标签页自动更新（无需刷新）
   - ✅ 实时同步正常工作

### 5.5 权限测试

**测试管理员权限：**
1. 创建一个 MANAGER 角色的用户
2. 登录后验证：
   - ✅ 可以看到所有任务
   - ✅ 可以分配任务给任何成员

**测试普通成员权限：**
1. 创建一个 MEMBER 角色的用户
2. 登录后验证：
   - ✅ 只能看到分配给自己的任务
   - ✅ 可以编辑自己的任务

## 步骤 6：数据库验证

在 Supabase Dashboard 中验证数据：

### 6.1 检查任务数据

```sql
-- 查看所有任务
SELECT 
  t.*,
  tm.name as assignee_name,
  creator.name as creator_name
FROM tasks t
LEFT JOIN team_members tm ON t.assignee_id = tm.id
LEFT JOIN team_members creator ON t.created_by = creator.id
ORDER BY t.created_at DESC;
```

### 6.2 检查任务进度

```sql
-- 查看任务进度
SELECT 
  tp.*,
  t.project_number
FROM task_progress tp
JOIN tasks t ON tp.task_id = t.id
ORDER BY tp.task_id, tp.day;
```

### 6.3 检查任务历史

```sql
-- 查看任务变更历史
SELECT 
  th.*,
  t.project_number,
  changer.name as changed_by_name
FROM task_history th
JOIN tasks t ON th.task_id = t.id
LEFT JOIN team_members changer ON th.changed_by = changer.id
ORDER BY th.created_at DESC
LIMIT 20;
```

## 常见问题排查

### 问题 1：登录后看不到数据

**检查清单：**
- [ ] 环境变量是否正确配置
- [ ] team_members 表中是否有当前用户的记录
- [ ] RLS 策略是否正确配置
- [ ] 浏览器控制台是否有错误

**解决方案：**
```sql
-- 检查当前用户的 team_member 记录
SELECT tm.*, au.email 
FROM team_members tm
JOIN auth.users au ON tm.user_id = au.id
WHERE au.email = 'test@example.com';  -- 替换为你的邮箱
```

### 问题 2：无法创建任务

**可能原因：**
- RLS 策略阻止插入
- 缺少 created_by 字段

**解决方案：**
- 检查 RLS 策略中的 INSERT 策略
- 确保用户有对应的 team_member 记录

### 问题 3：实时同步不工作

**检查清单：**
- [ ] Supabase Realtime 是否启用（默认启用）
- [ ] 表是否启用了 Realtime（在 Supabase Dashboard > Database > Replication 中检查）
- [ ] 浏览器控制台是否有 WebSocket 连接错误

**启用 Realtime：**
1. 进入 Supabase Dashboard > **Database > Replication**
2. 确保以下表启用了 Replication：
   - `tasks` ✅
   - `task_progress` ✅
   - `team_members` ✅

### 问题 4：权限错误

**检查 RLS 策略：**
```sql
-- 查看所有策略
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**测试策略：**
```sql
-- 以特定用户身份测试（需要 Service Role Key）
SET ROLE authenticated;
SET request.jwt.claim.sub = 'USER_UUID_HERE';
SELECT * FROM tasks;  -- 应该只返回该用户有权限的任务
```

## 测试检查清单

完成以下测试以确保系统正常工作：

### 基础功能
- [ ] 用户登录/登出
- [ ] 团队成员列表加载
- [ ] 任务列表加载
- [ ] 创建新任务
- [ ] 编辑任务
- [ ] 更新任务进度
- [ ] 任务状态变更

### 高级功能
- [ ] 实时同步（多标签页测试）
- [ ] AI 简报生成
- [ ] 任务分配建议
- [ ] CSV 导出
- [ ] 工作负载图表
- [ ] 日历视图

### 权限和安全
- [ ] 管理员可以查看所有任务
- [ ] 普通成员只能查看自己的任务
- [ ] 数据隔离正确
- [ ] RLS 策略生效

### 错误处理
- [ ] 网络错误显示友好提示
- [ ] 权限错误显示正确消息
- [ ] 数据验证错误正确显示

## 下一步

测试通过后，可以：
1. 创建更多测试用户
2. 添加更多团队成员
3. 创建测试任务数据
4. 准备生产环境部署


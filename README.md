

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1X5Pv_CWg38ioEx2EWhSTTBZ7HQnVVVsR

## Run Locally

**Prerequisites:**  Node.js

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

#### 2.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 等待项目初始化完成

#### 2.2 设置数据库

在 Supabase Dashboard 的 SQL Editor 中，依次执行以下迁移脚本：

1. **创建表结构**：复制并执行 `supabase/migrations/001_initial_schema.sql`
2. **配置安全策略**：复制并执行 `supabase/migrations/002_rls_policies.sql`

**验证表创建：**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('team_members', 'tasks', 'task_progress', 'task_history');
```

**验证 RLS 启用：**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'tasks', 'task_progress', 'task_history');
```

#### 2.3 配置环境变量

1. 在项目根目录创建 `.env.local` 文件
2. 从 Supabase Dashboard 的 **Settings > API** 页面获取：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For AI features
API_KEY=your_gemini_api_key
```

**重要：** 确保 `.env.local` 文件在 `.gitignore` 中，不会被提交到版本控制。

#### 2.4 创建初始用户和团队成员

**快速测试步骤：**

1. **创建认证用户：**
   - 进入 Supabase Dashboard > **Authentication > Users**
   - 点击 **Add user** > **Create new user**
   - Email: `test@example.com`
   - Password: `Test123456!`
   - ✅ 勾选 **Auto Confirm User**
   - 点击 **Create user**

2. **创建团队成员记录：**
   - 在用户列表中，复制刚创建用户的 **UUID** (ID 列)
   - 进入 **SQL Editor**，执行以下 SQL（替换 `USER_UUID_HERE`）：

```sql
INSERT INTO team_members (user_id, name, role, avatar)
VALUES (
  'USER_UUID_HERE',  -- 替换为实际用户 UUID
  'Test User', 
  'MANAGER',
  'https://ui-avatars.com/api/?name=Test+User&background=0f172a&color=fff'
);
```

**验证团队成员创建：**
```sql
SELECT tm.*, au.email 
FROM team_members tm
LEFT JOIN auth.users au ON tm.user_id = au.id;
```

**其他初始化方式：**
- 使用 SQL 脚本：参考 `supabase/migrations/003_initial_data.sql`
- 使用 TypeScript 工具：参考 `scripts/initTeamMembers.ts`
- 详细说明：参考 `supabase/README.md`

#### 2.5 启用 Realtime（重要）

确保实时同步功能正常工作：

1. 进入 Supabase Dashboard > **Database > Replication**
2. 确保以下表启用了 **Replication**：
   - ✅ `tasks`
   - ✅ `task_progress`
   - ✅ `team_members`

如果未启用，点击表名旁边的开关启用。

### 3. (可选) AI 功能设置

如果需要 AI 简报功能，设置 Ollama：

```bash
ollama run qwen3
```

### 4. 运行应用

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 5. 测试应用

1. **登录测试：**
   - 使用创建的测试用户登录
   - Email: `test@example.com`
   - Password: `Test123456!`

2. **功能测试：**
   - ✅ 创建新任务
   - ✅ 编辑任务
   - ✅ 查看团队成员列表
   - ✅ 测试实时同步（打开两个标签页）

3. **验证数据：**
   - 在 Supabase Dashboard > **Table Editor** 中查看 `tasks` 表
   - 确认数据已正确保存

**详细测试指南：** 参考 `supabase/TESTING_GUIDE.md`

## 多用户协作功能

### 功能特性

- ✅ **Supabase 认证**: 使用邮箱/密码登录，安全的用户认证系统
- ✅ **实时同步**: 多个用户同时访问，数据实时同步更新
- ✅ **数据隔离**: Row Level Security (RLS) 确保用户只能访问授权数据
- ✅ **任务管理**: 完整的任务 CRUD 操作，支持进度跟踪
- ✅ **历史记录**: 自动记录任务变更历史，支持审计
- ✅ **权限控制**: 管理员可查看所有任务，普通成员只能查看分配的任务

### 数据库结构

- `team_members` - 团队成员表（关联 Supabase auth.users）
- `tasks` - 任务主表
- `task_progress` - 任务进度详情表（8个步骤）
- `task_history` - 任务变更历史表（审计）

### 安全策略

系统使用 Row Level Security (RLS) 实现数据安全：

- **管理员 (MANAGER)**: 可以查看和编辑所有任务
- **普通成员 (MEMBER)**: 只能查看和编辑分配给自己的任务或自己创建的任务
- 所有数据访问都通过 RLS 策略自动过滤

### 实时同步

系统使用 Supabase Realtime 实现实时数据同步：

- 当任何用户创建、更新或删除任务时，所有在线用户会自动看到更新
- 无需刷新页面，数据实时同步
- 支持多用户同时协作

### 使用说明

1. **首次使用**: 在 Supabase 中创建用户账户
2. **登录**: 使用邮箱和密码登录系统
3. **协作**: 多个用户可以同时访问，数据自动同步
4. **权限**: 根据角色（管理员/成员）自动应用不同的数据访问权限

## 部署

### 前端部署到 Vercel

#### 方式一：通过 Vercel Dashboard（推荐首次部署）

1. **准备 GitHub 仓库**
   - 将代码推送到 GitHub 仓库
   - 确保仓库是公开的，或已授权 Vercel 访问私有仓库

2. **连接 Vercel**
   - 访问 [Vercel](https://vercel.com) 并登录（可使用 GitHub 账户）
   - 点击 **Add New Project**
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测到 Vite 项目

3. **配置环境变量**
   - 在项目设置页面，进入 **Environment Variables**
   - 添加以下环境变量：
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     API_KEY=your_gemini_api_key (可选)
     ```
   - 从 Supabase Dashboard > **Settings > API** 获取前两个变量的值
   - 点击 **Save** 保存

4. **部署**
   - 点击 **Deploy** 按钮
   - Vercel 会自动构建并部署项目
   - 部署完成后，你会获得一个 URL（如 `https://your-app.vercel.app`）

5. **后续更新**
   - 每次推送到 `main` 或 `master` 分支时，Vercel 会自动重新部署

#### 方式二：使用 Vercel CLI 命令行部署

使用 Vercel CLI 可以在本地通过命令行直接部署项目，适合快速部署和测试。

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```
   - 会打开浏览器进行登录，或使用邮箱登录

3. **首次部署（创建项目）**
   ```bash
   # 在项目根目录运行
   vercel
   ```
   
   按照提示操作：
   - **是否链接到现有项目？** 选择 `No`（首次部署创建新项目）
   - **项目名称**：输入项目名称（如：`rs-filling-manager`）
   - **目录**：使用默认值 `./`
   - **是否覆盖设置？** 选择 `No`（使用默认配置）

4. **配置环境变量**
   
   部署后，需要在 Vercel Dashboard 中配置环境变量：
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 进入项目 > **Settings > Environment Variables**
   - 添加以下变量：
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     API_KEY=your_gemini_api_key (可选)
     ```
   - 确保为所有环境（Production, Preview, Development）都添加了变量

5. **部署到生产环境**
   ```bash
   # 部署到预览环境（默认）
   vercel
   
   # 部署到生产环境
   vercel --prod
   ```

6. **链接到现有项目**
   
   如果项目已在 Vercel 中存在，可以链接本地项目：
   ```bash
   vercel link
   ```
   - 选择对应的项目
   - 会生成 `.vercel/project.json` 文件，包含项目配置信息

7. **查看部署信息**
   ```bash
   # 列出所有项目
   vercel ls
   
   # 查看项目详情
   vercel inspect [项目名称]
   
   # 查看部署日志
   vercel logs [部署URL]
   ```

8. **环境变量管理（CLI）**
   ```bash
   # 添加环境变量
   vercel env add VITE_SUPABASE_URL production
   
   # 查看环境变量
   vercel env ls
   
   # 删除环境变量
   vercel env rm VITE_SUPABASE_URL production
   ```

**优势：**
- ✅ 快速部署，无需打开浏览器
- ✅ 适合 CI/CD 和自动化脚本
- ✅ 可以管理环境变量
- ✅ 支持本地开发和测试

**注意事项：**
- 首次部署建议使用 Dashboard 方式，便于配置环境变量
- 使用 CLI 部署后，仍需在 Dashboard 中配置环境变量
- 生产环境部署使用 `vercel --prod` 命令

#### 方式三：通过 GitHub Actions CI/CD（自动化部署）

项目已配置 GitHub Actions 工作流，可以实现自动化部署：

1. **配置 GitHub Secrets**
   - 进入 GitHub 仓库 > **Settings > Secrets and variables > Actions**
   - 添加以下 Secrets：
     - `VERCEL_TOKEN`: 从 Vercel Dashboard > **Settings > Tokens** 创建
     - `VERCEL_ORG_ID`: 从 Vercel Dashboard > **Settings > General** 获取
     - `VERCEL_PROJECT_ID`: 首次部署后，从项目设置页面获取
     - `VITE_SUPABASE_URL`: Supabase 项目 URL
     - `VITE_SUPABASE_ANON_KEY`: Supabase 匿名公钥
     - `API_KEY`: Gemini API 密钥（可选）

2. **自动部署流程**
   - 推送到 `main` 或 `master` 分支时，GitHub Actions 会自动：
     1. 运行 TypeScript 类型检查
     2. 构建项目
     3. 部署到 Vercel 生产环境

3. **查看部署状态**
   - 在 GitHub 仓库的 **Actions** 标签页查看工作流运行状态
   - 部署成功后，访问 Vercel 提供的 URL

#### 环境变量配置说明

**必需的环境变量：**
- `VITE_SUPABASE_URL`: Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名公钥（用于客户端访问）

**可选的环境变量：**
- `API_KEY`: Google Gemini API 密钥（仅在使用 AI 功能时需要）

**配置位置：**
- **本地开发**: 在 `.env.local` 文件中配置（参考 `.env.example`）
- **Vercel 部署**: 
  - 在 Vercel Dashboard > **Settings > Environment Variables** 中配置（推荐）
  - 或使用 CLI：`vercel env add [变量名] [环境]`
- **GitHub Actions**: 在 GitHub Secrets 中配置

### 数据库

Supabase 提供托管数据库，无需额外配置。所有数据存储在 Supabase 云端，支持：
- 自动备份
- 实时同步
- 行级安全策略（RLS）
- 高可用性

### 生产环境优化

项目已配置以下生产环境优化：

- **性能优化**：
  - 代码分割和懒加载
  - 资源压缩和缓存策略
  - Tree Shaking 优化
  - 构建产物优化

- **安全增强**：
  - 安全响应头（CSP, X-Frame-Options 等）
  - 输入验证和 XSS 防护
  - 环境变量安全配置

- **错误处理**：
  - 全局错误边界（Error Boundary）
  - 错误追踪和日志记录
  - 生产环境日志管理

- **PWA 支持**：
  - Web App Manifest
  - Service Worker（基础配置）
  - 离线缓存策略

详细配置请参考 `DEPLOYMENT_CHECKLIST.md`。

## 故障排除

### 详细文档

- `如何获取项目URL.md` - 如何获取 Vercel、Supabase 和本地开发 URL
- `TROUBLESHOOTING.md` - 页面加载和运行时问题排查
- `VERCEL_DEPLOYMENT_TROUBLESHOOTING.md` - Vercel 部署故障排除（DEPLOYMENT_NOT_FOUND 等错误）
- `DEPLOYMENT_CHECKLIST.md` - 部署前检查清单

### 常见问题

#### 本地开发问题

1. **无法登录**: 检查 Supabase 项目是否已创建，环境变量是否正确
2. **看不到任务**: 检查 RLS 策略是否正确配置，用户是否有对应的 team_member 记录
3. **实时同步不工作**: 确保 Supabase Realtime 功能已启用（默认启用）

#### 部署相关问题

1. **构建失败**
   - 检查 `package.json` 中的构建脚本是否正确
   - 确保所有依赖都已正确安装
   - 查看 Vercel 构建日志中的错误信息

2. **环境变量未生效**
   - 确认在 Vercel Dashboard 中正确配置了环境变量
   - 环境变量名称必须以 `VITE_` 开头才能在客户端使用
   - 修改环境变量后需要重新部署

3. **部署后无法访问**
   - 检查 Supabase 项目的 CORS 设置
   - 确认 Supabase URL 和密钥配置正确
   - 查看浏览器控制台的错误信息

4. **GitHub Actions 部署失败**
   - 检查 GitHub Secrets 是否已正确配置
   - 确认 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` 是否正确
   - 查看 GitHub Actions 日志中的详细错误信息
   - **DEPLOYMENT_NOT_FOUND 错误**：参考 `VERCEL_DEPLOYMENT_TROUBLESHOOTING.md` 获取详细解决方案

### 检查清单

**本地开发：**
- [ ] Supabase 项目已创建
- [ ] 数据库迁移脚本已执行
- [ ] 环境变量已配置（`.env.local`）
- [ ] 至少创建了一个用户和对应的 team_member 记录
- [ ] RLS 策略已启用
- [ ] Realtime 功能已启用

**部署准备：**
- [ ] 代码已推送到 GitHub 仓库
- [ ] Vercel 项目已创建并连接 GitHub
- [ ] 环境变量已在 Vercel Dashboard 中配置
- [ ] 首次部署成功
- [ ] （可选）GitHub Secrets 已配置（用于 CI/CD）

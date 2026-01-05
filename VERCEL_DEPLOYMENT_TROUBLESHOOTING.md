# Vercel 部署故障排除指南

## 📋 快速参考：获取 Vercel 配置信息

### 最简单的方法（推荐）

```bash
# 1. 安装并登录 Vercel CLI
npm i -g vercel
vercel login

# 2. 在项目目录运行
vercel link

# 3. 查看生成的文件
cat .vercel/project.json
```

文件内容包含：
- `projectId` → **VERCEL_PROJECT_ID**
- `orgId` → **VERCEL_ORG_ID**

### 手动获取方法

| 配置项 | 获取位置 | 详细步骤 |
|--------|---------|---------|
| **VERCEL_TOKEN** | Account Settings > Tokens | 点击右上角头像 → Account Settings → Tokens → Create Token |
| **VERCEL_ORG_ID** | Account Settings > General | 点击右上角头像 → Account Settings → General → 查看 Vercel ID |
| **VERCEL_PROJECT_ID** | 项目 Settings > General | 进入项目 → Settings → General → 查看 Project ID |

### 验证信息是否正确

```bash
# 测试 Token
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v2/user

# 如果返回用户信息（JSON），说明配置正确
```

---

## 错误：DEPLOYMENT_NOT_FOUND (404)

### 错误信息
```
404: NOT_FOUND
Code: DEPLOYMENT_NOT_FOUND
ID: pdx1::zgc54-1767514809666-448bb9d38558
```

### 可能的原因

1. **Vercel 项目不存在或已被删除**
2. **GitHub Secrets 配置错误**
3. **Vercel Token 无效或过期**
4. **项目 ID 或组织 ID 不正确**

## 解决步骤

### 步骤 1：验证 Vercel 项目是否存在

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 检查项目是否在项目列表中
3. 如果项目不存在，需要重新创建项目

### 步骤 2：获取 Vercel 配置信息

#### 方法一：使用 Vercel CLI（推荐，最简单）

这是获取所有信息的最简单方法：

```bash
# 1. 安装 Vercel CLI（如果未安装）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在项目根目录运行，链接到现有项目或创建新项目
vercel link
```

按照提示操作：
- 如果项目已存在，选择对应的项目
- 如果项目不存在，选择创建新项目

**完成后，会在项目根目录生成 `.vercel/project.json` 文件：**

```json
{
  "projectId": "prj_xxxxxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxxxxx"
}
```

- `projectId` = **VERCEL_PROJECT_ID**
- `orgId` = **VERCEL_ORG_ID**

#### 方法二：通过 Vercel Dashboard（手动获取）

##### 1. 获取 VERCEL_TOKEN

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. **重要**：点击右上角的**个人头像**（不是项目设置）
3. 选择 **`Account Settings`**（账户设置）
4. 在左侧菜单中，点击 **`Tokens`**
5. 点击 **`Create Token`** 按钮
6. 输入 Token 名称（如：`github-actions-deploy`）
7. 选择过期时间（建议：**`No Expiration`**）
8. 点击 **`Create`**
9. **立即复制生成的 Token**（只显示一次，之后无法再次查看）
   - 格式类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

##### 2. 获取 VERCEL_ORG_ID

**方式 A：通过 Account Settings（推荐）**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角的**个人头像**
3. 选择 **`Account Settings`**
4. 在左侧菜单中，点击 **`General`**
5. 找到 **`Vercel ID`** 或 **`User ID`** 字段
   - 如果是个人账户，显示为 `user_xxxxx`
   - 如果是团队账户，显示为 `team_xxxxx`
6. 复制此 ID，这就是 **VERCEL_ORG_ID**

**方式 B：通过项目设置（如果使用团队）**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目页面
3. 点击 **`Settings`** 标签页
4. 在左侧菜单中，点击 **`General`**
5. 找到 **`Organization`** 部分
6. 查看组织名称，然后：
   - 点击组织名称进入组织设置
   - 在组织设置的 `General` 页面找到 `Team ID` 或 `Organization ID`
   - 格式：`team_xxxxx`

##### 3. 获取 VERCEL_PROJECT_ID

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目页面（点击项目名称）
3. 点击 **`Settings`** 标签页
4. 在左侧菜单中，点击 **`General`**
5. 向下滚动，找到 **`Project ID`** 部分
6. 复制显示的 Project ID
   - 格式：`prj_xxxxxxxxxxxxxxxx`

**注意**：如果看不到 Project ID，可能需要：
- 确保项目已经至少部署过一次
- 检查是否有权限查看项目设置

#### 方法三：通过 Vercel API（高级）

如果上述方法都不行，可以使用 API：

```bash
# 使用 VERCEL_TOKEN 获取组织信息
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v2/user

# 获取项目列表（包含项目 ID）
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects
```

### 步骤 2.5：验证获取的信息

在配置到 GitHub Secrets 之前，建议先验证：

```bash
# 测试 VERCEL_TOKEN 是否有效
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v2/user

# 如果返回用户信息（JSON），说明 Token 有效
# 如果返回 401 或 403，说明 Token 无效或过期
```

### 步骤 3：重新创建 Vercel 项目（如果需要）

如果项目不存在或需要重新创建：

#### 方式 A：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 `Add New Project`
3. 选择 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. 添加环境变量：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   API_KEY=your_api_key (可选)
   ```
6. 点击 `Deploy`
7. 部署成功后，从项目设置中获取 `VERCEL_PROJECT_ID`

#### 方式 B：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目根目录运行
vercel

# 按照提示完成项目创建
# 选择：
# - 是否链接到现有项目：No（创建新项目）
# - 项目名称：rs-filling-manager（或自定义）
# - 目录：./（默认）
```

### 步骤 4：配置 GitHub Secrets

将获取的信息添加到 GitHub Secrets：

1. **进入 GitHub 仓库**
   - 打开您的 GitHub 仓库页面
   - 点击 **`Settings`** 标签页（在仓库顶部菜单栏）

2. **进入 Secrets 设置**
   - 在左侧菜单中，找到 **`Secrets and variables`**
   - 点击展开，选择 **`Actions`**

3. **添加 Secrets**
   点击 **`New repository secret`** 按钮，依次添加以下三个 Secrets：

   **Secret 1: VERCEL_TOKEN**
   - **Name**: `VERCEL_TOKEN`
   - **Value**: 粘贴从步骤 2 获取的 Token
   - 点击 **`Add secret`**

   **Secret 2: VERCEL_ORG_ID**
   - **Name**: `VERCEL_ORG_ID`
   - **Value**: 粘贴从步骤 2 获取的 Org ID（格式：`team_xxxxx` 或 `user_xxxxx`）
   - 点击 **`Add secret`**

   **Secret 3: VERCEL_PROJECT_ID**
   - **Name**: `VERCEL_PROJECT_ID`
   - **Value**: 粘贴从步骤 2 获取的 Project ID（格式：`prj_xxxxx`）
   - 点击 **`Add secret`**

4. **验证 Secrets 已添加**
   - 确认在 Secrets 列表中能看到这三个 Secrets
   - 注意：Secrets 的值会被隐藏，只显示名称

**重要提示**：
- Secrets 名称必须**完全匹配**（区分大小写）
- 确保没有多余的空格
- 如果 Secrets 已存在，可以点击编辑更新

### 步骤 5：验证 GitHub Actions 工作流

1. 进入 GitHub 仓库的 `Actions` 标签页
2. 查看最新的工作流运行
3. 如果失败，检查错误日志
4. 确认所有 Secrets 都已正确配置

### 步骤 6：测试部署

触发一次新的部署：

```bash
# 提交一个小的更改来触发部署
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

或者：

1. 在 GitHub 仓库中，进入 `Actions` 标签页
2. 选择 `Deploy to Vercel` 工作流
3. 点击 `Run workflow`
4. 选择分支（通常是 `main`）
5. 点击 `Run workflow`

## 常见问题

### Q1: 如何确认 Vercel Token 是否有效？

```bash
# 使用 curl 测试 Token
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v2/user
```

**预期结果**：
- ✅ 如果返回 JSON 格式的用户信息，说明 Token 有效
- ❌ 如果返回 `401 Unauthorized` 或 `403 Forbidden`，说明 Token 无效或过期

**如果 Token 无效**：
1. 删除旧的 Token（Account Settings > Tokens）
2. 创建新的 Token
3. 更新 GitHub Secrets 中的 `VERCEL_TOKEN`

### Q2: 如何获取 Vercel 项目信息？

**使用 Vercel CLI：**
```bash
# 列出所有项目
vercel ls

# 查看项目详情
vercel inspect [项目名称]
```

**使用 API：**
```bash
# 获取所有项目（包含项目 ID）
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects

# 获取特定项目信息
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects/YOUR_PROJECT_ID
```

**使用 vercel link（最简单）：**
```bash
# 在项目目录运行
vercel link

# 完成后查看 .vercel/project.json
cat .vercel/project.json
```

### Q3: GitHub Actions 仍然失败怎么办？

1. **检查工作流文件**：
   - 确认 `.github/workflows/deploy.yml` 存在
   - 检查 YAML 语法是否正确

2. **检查分支名称**：
   - 确认工作流中指定的分支名称（`main` 或 `master`）与实际分支匹配

3. **查看详细日志**：
   - 在 GitHub Actions 中点击失败的步骤
   - 查看完整的错误日志

### Q4: 如何手动部署到 Vercel？

如果 GitHub Actions 持续失败，可以手动部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### Q5: 环境变量未生效？

1. 在 Vercel Dashboard 中检查环境变量：
   - 进入项目 > `Settings` > `Environment Variables`
   - 确认变量已添加到所有环境（Production, Preview, Development）

2. 重新部署：
   - 添加或修改环境变量后，需要重新部署才能生效

## 验证清单

部署成功后，请验证：

- [ ] Vercel 项目已创建
- [ ] GitHub Secrets 已正确配置
- [ ] 环境变量已在 Vercel Dashboard 中配置
- [ ] GitHub Actions 工作流运行成功
- [ ] 部署的网站可以正常访问
- [ ] 登录功能正常
- [ ] 数据库连接正常

## 获取帮助

如果问题仍然存在，请提供以下信息：

1. **错误日志**：从 GitHub Actions 中复制的完整错误信息
2. **Vercel 项目状态**：项目是否存在于 Vercel Dashboard
3. **Secrets 配置**：确认哪些 Secrets 已配置（不包含实际值）
4. **工作流文件**：`.github/workflows/deploy.yml` 的内容

## 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [项目部署指南](./DEPLOYMENT_TEST_GUIDE.md)
- [快速部署指南](./QUICK_DEPLOY.md)


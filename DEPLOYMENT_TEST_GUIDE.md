# 部署测试指南

本指南将帮助您完成从本地测试到生产环境部署的完整流程。

## 第一步：本地构建测试

在部署到 Vercel 之前，先在本地验证构建是否成功。

### Windows PowerShell 执行策略问题

如果遇到 PowerShell 执行策略错误，可以使用以下方法：

**方法 1：使用 cmd 运行**
```cmd
cmd /c "npm run build"
```

**方法 2：临时允许脚本执行**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
npm run build
```

**方法 3：使用 npx**
```powershell
npx tsc && npx vite build
```

### 验证构建结果

构建成功后，检查以下内容：

1. **dist 目录已创建**
   ```powershell
   Test-Path dist
   ```

2. **dist 目录包含以下文件：**
   - `index.html`
   - `assets/` 目录（包含 JS、CSS 文件）
   - `manifest.json`（如果配置了 PWA）

3. **检查构建输出**
   - 查看终端输出，确认没有错误
   - 检查是否有 TypeScript 类型错误
   - 确认所有资源文件都已正确打包

### 本地预览测试

```bash
npm run preview
```

访问 `http://localhost:4173` 验证应用是否正常运行。

## 第二步：准备 GitHub 仓库

### 1. 检查 Git 状态

```bash
git status
```

确保所有需要提交的文件都已添加：
- `vercel.json`
- `.github/workflows/deploy.yml`
- `utils/logger.ts`
- `utils/errorTracker.ts`
- `components/ErrorBoundary.tsx`
- `public/manifest.json`
- `public/sw.js`
- `DEPLOYMENT_CHECKLIST.md`
- 所有更新的服务文件

### 2. 提交更改

```bash
git add .
git commit -m "feat: 添加部署配置和生产环境优化"
git push origin main
```

## 第三步：Vercel 部署

### 方式一：首次部署（通过 Vercel Dashboard）

1. **访问 Vercel**
   - 打开 [https://vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择您的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Vite（应该自动检测）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `dist`（默认）
   - **Install Command**: `npm install`（默认）

4. **配置环境变量**
   在部署前，点击 "Environment Variables" 添加：
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   API_KEY=your_gemini_api_key (可选)
   ```
   
   **重要**：确保为所有环境（Production, Preview, Development）都添加了环境变量。

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 1-3 分钟）
   - 记录部署 URL（如 `https://your-app.vercel.app`）

### 方式二：使用 Vercel CLI（可选）

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

## 第四步：部署后验证

### 1. 基本功能测试

访问部署的 URL，测试以下功能：

- [ ] **页面加载**
  - 页面正常加载，无白屏
  - 控制台无严重错误

- [ ] **登录功能**
  - 使用测试账户登录
  - 验证登录成功

- [ ] **任务管理**
  - 创建新任务
  - 编辑任务
  - 删除任务
  - 更新任务进度

- [ ] **实时同步**
  - 打开两个浏览器标签页
  - 在一个标签页创建任务
  - 验证另一个标签页自动更新

### 2. 性能测试

使用浏览器开发者工具测试：

- [ ] **Lighthouse 测试**
  - 打开 Chrome DevTools > Lighthouse
  - 运行性能测试
  - 目标分数：Performance > 80, Accessibility > 90

- [ ] **网络请求**
  - 检查 Network 标签页
  - 确认资源加载正常
  - 检查缓存策略是否生效

- [ ] **控制台检查**
  - 无 JavaScript 错误
  - 无网络请求失败
  - 日志输出正常（开发环境）

### 3. 安全测试

- [ ] **HTTPS**
  - 确认 URL 使用 HTTPS
  - 证书有效

- [ ] **安全响应头**
  - 打开 Network 标签页
  - 检查响应头：
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `X-XSS-Protection: 1; mode=block`

- [ ] **环境变量安全**
  - 检查页面源代码
  - 确认敏感信息（如 API 密钥）未暴露

### 4. PWA 测试（如果配置）

- [ ] **Manifest**
  - 访问 `/manifest.json`
  - 验证 JSON 格式正确

- [ ] **Service Worker**
  - 打开 Application > Service Workers
  - 确认 Service Worker 已注册
  - 测试离线功能

### 5. 移动端测试

- [ ] **响应式布局**
  - 使用移动设备或浏览器响应式模式
  - 验证布局正常显示

- [ ] **触摸交互**
  - 测试按钮点击
  - 测试表单输入

## 第五步：配置 CI/CD（可选）

如果使用 GitHub Actions 自动部署：

### 1. 获取 Vercel 凭证

- **VERCEL_TOKEN**: 
  - Vercel Dashboard > Settings > Tokens
  - 点击 "Create Token"
  - 复制 token

- **VERCEL_ORG_ID**:
  - Vercel Dashboard > Settings > General
  - 复制 "Organization ID"

- **VERCEL_PROJECT_ID**:
  - 首次部署后，在项目设置页面获取
  - 或在项目 URL 中找到

### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库
2. Settings > Secrets and variables > Actions
3. 点击 "New repository secret"
4. 添加以下 Secrets：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `API_KEY`（可选）

### 3. 测试自动部署

1. 创建一个测试更改
2. 提交并推送到 `main` 分支
3. 在 GitHub Actions 中查看部署状态
4. 验证自动部署成功

## 常见问题排查

### 构建失败

**问题**: Vercel 构建失败

**解决方案**:
1. 检查构建日志中的错误信息
2. 确认 `package.json` 中的依赖正确
3. 检查 TypeScript 类型错误
4. 验证环境变量是否正确配置

### 环境变量未生效

**问题**: 部署后环境变量未生效

**解决方案**:
1. 确认环境变量名称正确（Vite 需要 `VITE_` 前缀）
2. 确认环境变量已保存
3. 重新部署以应用新的环境变量

### 功能不工作

**问题**: 部署后某些功能不工作

**解决方案**:
1. 检查浏览器控制台错误
2. 验证 Supabase 连接状态
3. 检查网络请求是否成功
4. 确认 RLS 策略正确配置

### 实时同步不工作

**问题**: 多用户实时同步失败

**解决方案**:
1. 确认 Supabase Realtime 已启用
2. 检查表是否启用了 Replication
3. 验证 WebSocket 连接

## 回滚流程

如果部署后发现问题：

### 快速回滚

1. 进入 Vercel Dashboard
2. 进入项目的 Deployments 页面
3. 找到上一个正常工作的部署
4. 点击 "..." > "Promote to Production"

### 代码回滚

```bash
# 回退到上一个稳定版本
git revert HEAD
git push origin main
```

## 后续维护

- 定期检查部署状态
- 监控错误日志
- 定期更新依赖
- 备份数据库（Supabase 自动备份）
- 定期审查安全配置

## 测试检查清单

使用以下清单确保所有测试完成：

```
部署前：
[ ] 本地构建成功
[ ] 代码已提交到 Git
[ ] 环境变量已准备

部署中：
[ ] Vercel 项目已创建
[ ] 环境变量已配置
[ ] 首次部署成功

部署后：
[ ] 页面正常加载
[ ] 登录功能正常
[ ] 任务 CRUD 正常
[ ] 实时同步正常
[ ] 性能测试通过
[ ] 安全测试通过
[ ] 移动端测试通过
```

## 联系与支持

如遇到问题，请参考：
- `DEPLOYMENT_CHECKLIST.md` - 详细检查清单
- `README.md` - 项目文档
- `TROUBLESHOOTING.md` - 故障排除指南


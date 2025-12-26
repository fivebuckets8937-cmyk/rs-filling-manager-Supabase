# 部署检查清单

本文档提供了部署前后的完整检查清单，确保应用成功部署到生产环境。

## 部署前检查

### 1. 代码准备
- [ ] 所有代码已提交到 Git 仓库
- [ ] 代码已通过本地测试
- [ ] 没有未提交的更改
- [ ] 代码已通过 TypeScript 类型检查 (`npm run build`)
- [ ] 本地构建成功，无错误或警告

### 2. 环境变量配置
- [ ] 已创建 `.env.example` 文件（包含所有必需的环境变量）
- [ ] 确认所有环境变量已在 Vercel Dashboard 中配置：
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `API_KEY`（可选，如使用 AI 功能）
- [ ] 环境变量值正确（从 Supabase Dashboard 获取）

### 3. Supabase 配置
- [ ] Supabase 项目已创建并运行
- [ ] 数据库迁移脚本已执行：
  - [ ] `001_initial_schema.sql` - 表结构
  - [ ] `002_rls_policies.sql` - 安全策略
  - [ ] `004_task_history_policies.sql` - 历史记录策略
- [ ] RLS (Row Level Security) 已启用
- [ ] Realtime 功能已启用（用于实时同步）
- [ ] 至少创建了一个测试用户和对应的 `team_member` 记录

### 4. 构建配置
- [ ] `package.json` 中的构建脚本正确
- [ ] `vite.config.ts` 已配置生产构建优化
- [ ] `vercel.json` 配置正确
- [ ] 没有硬编码的 API 密钥或敏感信息

### 5. 安全配置
- [ ] `vercel.json` 中已配置安全响应头
- [ ] 确认敏感信息不会暴露在客户端代码中
- [ ] Supabase RLS 策略已正确配置

### 6. GitHub Actions（如使用 CI/CD）
- [ ] `.github/workflows/deploy.yml` 文件存在
- [ ] GitHub Secrets 已配置：
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `API_KEY`（可选）

## 部署步骤

### 方式一：通过 Vercel Dashboard（首次部署）

1. **连接 GitHub 仓库**
   - [ ] 访问 [Vercel Dashboard](https://vercel.com)
   - [ ] 点击 "Add New Project"
   - [ ] 选择 GitHub 仓库
   - [ ] 授权 Vercel 访问仓库

2. **配置项目**
   - [ ] Vercel 自动检测到 Vite 项目
   - [ ] 确认构建命令：`npm run build`
   - [ ] 确认输出目录：`dist`
   - [ ] 确认框架预设：Vite

3. **配置环境变量**
   - [ ] 进入项目设置 > Environment Variables
   - [ ] 添加所有必需的环境变量
   - [ ] 确认环境变量应用于 Production、Preview、Development

4. **部署**
   - [ ] 点击 "Deploy" 按钮
   - [ ] 等待构建完成
   - [ ] 记录部署 URL

### 方式二：通过 GitHub Actions（自动化部署）

1. **配置 GitHub Secrets**
   - [ ] 获取 Vercel Token（Settings > Tokens）
   - [ ] 获取 Vercel Org ID（Settings > General）
   - [ ] 首次部署后获取 Project ID
   - [ ] 在 GitHub 仓库中配置所有 Secrets

2. **触发部署**
   - [ ] 推送到 `main` 或 `master` 分支
   - [ ] 在 GitHub Actions 中查看部署状态
   - [ ] 确认部署成功

## 部署后验证

### 1. 基本功能测试
- [ ] 访问部署的 URL，页面正常加载
- [ ] 登录功能正常
- [ ] 登出功能正常
- [ ] 页面无控制台错误

### 2. 功能测试
- [ ] 创建任务功能正常
- [ ] 编辑任务功能正常
- [ ] 删除任务功能正常
- [ ] 查看任务列表正常
- [ ] 任务进度更新正常

### 3. 多用户测试
- [ ] 实时同步功能正常（打开两个浏览器标签页测试）
- [ ] 权限控制正常（MANAGER vs MEMBER）
- [ ] 多用户同时操作无冲突

### 4. 性能测试
- [ ] 页面加载速度正常（使用 Lighthouse 测试）
- [ ] 首屏渲染时间 < 3 秒
- [ ] 资源加载正常（无 404 错误）
- [ ] 移动端响应式布局正常

### 5. 安全检查
- [ ] HTTPS 已启用（Vercel 自动提供）
- [ ] 安全响应头已生效（检查 Network 标签页）
- [ ] 无敏感信息暴露在客户端代码中
- [ ] CORS 配置正确

### 6. 错误监控
- [ ] 错误边界正常工作
- [ ] 错误日志正常记录
- [ ] （如配置）错误追踪服务正常接收错误

## 常见问题排查

### 构建失败
- 检查 `package.json` 中的依赖是否正确
- 检查 TypeScript 类型错误
- 查看 Vercel 构建日志

### 环境变量未生效
- 确认环境变量名称正确（Vite 变量需要 `VITE_` 前缀）
- 确认环境变量已保存
- 重新部署以应用新的环境变量

### 功能不工作
- 检查浏览器控制台错误
- 检查 Supabase 连接状态
- 验证 RLS 策略是否正确
- 检查网络请求是否成功

### 实时同步不工作
- 确认 Supabase Realtime 已启用
- 检查表是否启用了 Replication
- 验证 WebSocket 连接是否正常

## 回滚流程

如果部署后发现问题：

1. **快速回滚**
   - 在 Vercel Dashboard 中，进入 Deployments
   - 找到上一个正常工作的部署
   - 点击 "..." > "Promote to Production"

2. **代码回滚**
   - 在 Git 中回退到上一个稳定版本
   - 推送到仓库
   - 触发新的部署

## 后续维护

- [ ] 定期检查部署状态
- [ ] 监控错误日志
- [ ] 定期更新依赖
- [ ] 备份数据库（Supabase 自动备份）
- [ ] 定期审查安全配置

## 联系与支持

如遇到问题，请参考：
- `README.md` - 项目文档
- `TROUBLESHOOTING.md` - 故障排除指南
- `supabase/TESTING_GUIDE.md` - 测试指南


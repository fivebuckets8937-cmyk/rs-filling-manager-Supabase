# 快速部署指南

## 前置条件检查

在开始部署前，请确认：

- [x] Supabase 项目已创建
- [x] 数据库迁移脚本已执行
- [x] 至少有一个测试用户
- [ ] 代码已提交到 GitHub
- [ ] 环境变量值已准备好

## 部署步骤（5 分钟）

### 1. 准备环境变量

从 Supabase Dashboard > Settings > API 获取：
- `VITE_SUPABASE_URL`: https://your-project.supabase.co
- `VITE_SUPABASE_ANON_KEY`: your_anon_key_here

### 2. 部署到 Vercel

1. 访问 https://vercel.com 并登录
2. 点击 "Add New Project"
3. 选择您的 GitHub 仓库
4. 配置环境变量（在部署前或部署后都可以）
5. 点击 "Deploy"

### 3. 验证部署

部署完成后：
1. 访问 Vercel 提供的 URL
2. 测试登录功能
3. 创建测试任务
4. 检查控制台是否有错误

## 本地构建测试（可选）

如果 PowerShell 执行策略阻止 npm 运行，使用以下方法：

```cmd
# 使用 cmd
cmd /c "npm run build"

# 或使用 npx
npx tsc --noEmit
npx vite build
```

## 常见问题

**Q: 构建失败？**
A: 检查 Vercel 构建日志，通常是 TypeScript 类型错误或依赖问题。

**Q: 环境变量未生效？**
A: 确保变量名以 `VITE_` 开头，并重新部署。

**Q: 功能不工作？**
A: 检查浏览器控制台，确认 Supabase 连接正常。

## 详细文档

- `DEPLOYMENT_TEST_GUIDE.md` - 完整测试指南
- `DEPLOYMENT_CHECKLIST.md` - 详细检查清单
- `README.md` - 项目文档


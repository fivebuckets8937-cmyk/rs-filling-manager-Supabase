# 故障排查指南 - 页面无限加载问题

## 问题症状
页面启动后一直显示加载状态，无法正常显示内容。

## 可能的原因和解决方案

### 1. Supabase 环境变量问题
**检查方法：**
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页
- 查找以 `[Supabase]` 开头的日志

**解决方案：**
- 确认 `.env.local` 文件存在且包含：
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- 重启开发服务器（修改 `.env.local` 后需要重启）

### 2. 网络连接问题
**检查方法：**
- 打开浏览器开发者工具（F12）
- 查看 Network 标签页
- 查找对 Supabase 的请求（URL 包含 `supabase.co`）
- 检查请求状态是否为 `pending` 或失败

**解决方案：**
- 检查网络连接
- 检查防火墙设置
- 确认 Supabase 项目是否正常运行
- 尝试在浏览器中直接访问 Supabase URL

### 3. Supabase 数据库配置问题
**检查方法：**
- 查看 Console 中的错误信息
- 查找 `[App]` 开头的日志，查看初始化步骤

**解决方案：**
- 确认数据库表已创建（运行迁移脚本）
- 确认 RLS（Row Level Security）策略已配置
- 检查 Supabase Dashboard 中的数据库状态

### 4. 认证状态问题
**检查方法：**
- 查看 Console 中 `[App] 认证状态:` 的日志
- 检查是否有认证相关的错误

**解决方案：**
- 清除浏览器本地存储（Local Storage）
- 重新登录
- 检查 Supabase Auth 配置

### 5. 超时问题
**已添加的改进：**
- 所有初始化操作都有 10 秒超时保护
- 如果超时，会显示明确的错误信息

**如果遇到超时：**
- 检查网络速度
- 检查 Supabase 服务状态
- 查看 Console 中的超时错误信息

## 调试步骤

1. **打开浏览器开发者工具**
   - 按 F12 或右键点击页面选择"检查"
   - 切换到 Console 标签页

2. **查看初始化日志**
   - 查找以下日志：
     - `[Supabase] 初始化客户端...`
     - `[App] 开始初始化应用...`
     - `[App] 检查认证状态...`
     - `[App] 加载团队成员和任务数据...`

3. **检查错误信息**
   - 查找红色错误信息
   - 注意错误发生的步骤
   - 记录完整的错误堆栈

4. **检查网络请求**
   - 切换到 Network 标签页
   - 刷新页面
   - 查找失败的请求（红色）
   - 查看请求的响应内容

5. **检查 Supabase Dashboard**
   - 登录 Supabase Dashboard
   - 检查项目状态
   - 查看数据库表是否存在
   - 检查 API 日志

## 常见错误和解决方案

### 错误：`Missing Supabase environment variables`
**原因：** 环境变量未正确配置
**解决：** 检查 `.env.local` 文件，确保变量名正确（必须以 `VITE_` 开头）

### 错误：`初始化超时：请检查网络连接和 Supabase 配置`
**原因：** 网络请求超过 10 秒未响应
**解决：**
- 检查网络连接
- 检查 Supabase 服务状态
- 检查防火墙/代理设置

### 错误：`User team member not found`
**原因：** 用户没有关联的团队成员记录
**解决：** 在数据库中为用户创建 `team_members` 记录

### 错误：`Failed to get current user`
**原因：** 无法获取当前用户信息
**解决：** 检查 Supabase Auth 配置和用户状态

## 快速修复

如果问题持续存在，可以尝试：

1. **清除浏览器缓存和本地存储**
   ```javascript
   // 在浏览器 Console 中运行
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **重启开发服务器**
   ```bash
   # 停止当前服务器（Ctrl+C）
   npm run dev
   ```

3. **检查 Supabase 项目状态**
   - 登录 Supabase Dashboard
   - 确认项目处于活跃状态
   - 检查 API 使用量是否超限

4. **验证环境变量**
   ```bash
   # 在项目根目录运行
   node -e "console.log(process.env.VITE_SUPABASE_URL)"
   ```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：
- 浏览器 Console 的完整日志
- Network 标签页中的失败请求详情
- `.env.local` 文件内容（隐藏敏感信息）
- Supabase 项目 ID


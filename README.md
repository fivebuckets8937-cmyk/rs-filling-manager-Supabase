<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1X5Pv_CWg38ioEx2EWhSTTBZ7HQnVVVsR

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) For AI features, set up Ollama:
   ```bash
   ollama run qwen3
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## 多用户登录功能

### 默认账户
系统会自动为每个团队成员创建默认登录账户：
- **用户名**: 团队成员名称的小写（如：`yaohua`, `flora`, `shuman` 等）
- **默认密码**: `123456`

### 功能特性
- ✅ **用户认证**: 每个用户需要登录才能访问系统
- ✅ **数据隔离**: 每个用户的任务数据完全独立存储
- ✅ **历史记录**: 系统自动保存最近30天的任务历史快照
- ✅ **会话管理**: 支持登出功能，保护用户数据安全

### 数据存储
- 任务数据按用户ID隔离存储在 `localStorage`
- 格式：`rs_tasks_{userId}` 和 `rs_task_history_{userId}`
- 每个用户的数据互不干扰

### 使用说明
1. 首次访问会显示登录页面
2. 使用团队成员的用户名和默认密码登录
3. 登录后可以查看和管理自己的任务数据
4. 点击侧边栏的"登出"按钮可以安全退出

# 同步项目到 GitHub 指南

## 前提条件
1. 已安装 Git
2. 拥有 GitHub 账号
3. 已配置 Git 用户信息（如果未配置，请先运行以下命令）：
   ```bash
   git config --global user.name "你的用户名"
   git config --global user.email "你的邮箱"
   ```

## 步骤 1: 完成当前提交
如果还有未提交的更改，请先完成提交：
```bash
git add .
git commit -m "初始提交：RS填表管理系统"
```

## 步骤 2: 在 GitHub 上创建新仓库
1. 访问 https://github.com/new
2. 输入仓库名称（如：`rs-filling-manager`）
3. **不要**勾选"Initialize this repository with a README"
4. 点击"Create repository"

## 步骤 3: 添加远程仓库并推送
在项目目录下执行以下命令（将 `YOUR_USERNAME` 和 `REPO_NAME` 替换为你的实际值）：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 或者如果使用 SSH（需要配置 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

## 步骤 4: 验证同步
访问你的 GitHub 仓库页面，确认所有文件已成功上传。

## 后续更新

### 方法一：使用自动化脚本（推荐）

运行提交并推送脚本：
```powershell
.\commit-and-push.ps1
```

或者直接传入提交信息：
```powershell
.\commit-and-push.ps1 -CommitMessage "修复登录bug"
```

脚本会自动：
1. 检查有哪些文件被修改
2. 添加所有更改到暂存区
3. 提示你输入提交信息
4. 提交更改
5. 推送到GitHub（可选）

### 方法二：手动执行命令

#### 完整流程（3步）

```bash
# 1. 查看更改状态
git status

# 2. 添加所有更改（或指定文件）
git add .                    # 添加所有更改
# 或
git add 文件名               # 只添加特定文件

# 3. 提交更改（必须包含有意义的提交信息）
git commit -m "提交说明，描述你做了什么改动"

# 4. 推送到GitHub
git push
```

#### 常用命令详解

**查看状态：**
```bash
git status                  # 查看哪些文件被修改、添加或删除
git status --short          # 简洁模式显示
git diff                    # 查看具体修改内容
```

**选择性提交：**
```bash
git add 文件路径            # 只添加特定文件
git add components/         # 添加整个目录
git add *.ts               # 添加所有.ts文件
```

**提交信息规范：**
- ✅ 好的提交信息：`git commit -m "修复用户登录时的认证问题"`
- ✅ 好的提交信息：`git commit -m "添加任务删除功能"`
- ❌ 不好的：`git commit -m "更新"` 或 `git commit -m "修复bug"`

**推送相关：**
```bash
git push                    # 推送到远程仓库（默认分支）
git push origin main        # 推送到main分支
git push -u origin main     # 首次推送时设置上游分支
```

### 方法三：使用 VS Code/Cursor 的图形界面

1. **查看更改**：点击左侧 Git 图标（源代码管理）
2. **暂存更改**：点击文件旁的 `+` 号，或点击"暂存所有更改"
3. **提交**：在输入框输入提交信息，点击"提交"
4. **推送**：点击左下角的同步按钮，或点击"推送"

### 提交信息最佳实践

好的提交信息应该：
- ✅ 清晰描述做了什么改动
- ✅ 使用中文或英文都可以
- ✅ 如果是修复bug，说明修复了什么
- ✅ 如果是新功能，说明添加了什么功能

示例：
```
git commit -m "添加用户认证功能"
git commit -m "修复任务列表不显示的bug"
git commit -m "优化性能：减少不必要的API调用"
git commit -m "更新README：添加部署说明"
```

### 常见场景

#### 场景1：只提交部分文件
```bash
git add src/components/TaskModal.tsx
git add src/App.tsx
git commit -m "更新任务模态框和主应用组件"
git push
```

#### 场景2：撤销本地修改（未提交）
```bash
git restore 文件名           # 撤销单个文件的修改
git restore .               # 撤销所有修改（危险操作）
```

#### 场景3：修改最后一次提交
```bash
# 如果忘记添加某个文件
git add 忘记的文件
git commit --amend          # 修改最后一次提交

# 如果提交信息写错了
git commit --amend -m "正确的提交信息"
```

#### 场景4：查看提交历史
```bash
git log                     # 查看提交历史
git log --oneline          # 简洁模式
git log --graph            # 图形化显示分支
```

## 注意事项
- 确保 `.env.txt` 等敏感文件已添加到 `.gitignore`
- 不要将包含密码、API密钥等敏感信息的文件提交到GitHub


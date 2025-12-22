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
之后每次更新代码，使用以下命令同步：
```bash
git add .
git commit -m "提交说明"
git push
```

## 注意事项
- 确保 `.env.txt` 等敏感文件已添加到 `.gitignore`
- 不要将包含密码、API密钥等敏感信息的文件提交到GitHub


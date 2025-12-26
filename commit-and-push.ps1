# PowerShell 脚本：提交并推送到GitHub
# 使用方法：.\commit-and-push.ps1 [提交信息]

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Git 提交并推送脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: 未找到 Git，请先安装 Git" -ForegroundColor Red
    Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 检查当前状态
Write-Host "检查当前Git状态..." -ForegroundColor Yellow
$status = git status --short

if (-not $status) {
    Write-Host "✓ 没有需要提交的更改" -ForegroundColor Green
    Write-Host ""
    
    # 检查是否有未推送的提交
    $unpushed = git log origin/main..HEAD 2>$null
    if ($unpushed) {
        Write-Host "检测到未推送的提交，是否推送？(y/n)" -ForegroundColor Yellow
        $push = Read-Host
        if ($push -eq "y" -or $push -eq "Y") {
            git push
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ 已推送到GitHub" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "所有更改已同步到GitHub" -ForegroundColor Green
    }
    exit 0
}

Write-Host ""
Write-Host "检测到以下更改：" -ForegroundColor Cyan
git status --short | ForEach-Object {
    $line = $_
    if ($line -match "^A\s") {
        Write-Host "  [+] $($line.Substring(2))" -ForegroundColor Green
    } elseif ($line -match "^M\s") {
        Write-Host "  [M] $($line.Substring(2))" -ForegroundColor Yellow
    } elseif ($line -match "^D\s") {
        Write-Host "  [-] $($line.Substring(2))" -ForegroundColor Red
    } else {
        Write-Host "  [?] $($line.Substring(2))" -ForegroundColor Gray
    }
}

Write-Host ""

# 获取提交信息
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Write-Host "请输入提交信息（描述本次更改）：" -ForegroundColor Yellow
    $CommitMessage = Read-Host
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Write-Host "✗ 提交信息不能为空，操作已取消" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在添加所有更改..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 添加文件失败" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 文件已添加到暂存区" -ForegroundColor Green
Write-Host ""

Write-Host "正在提交更改..." -ForegroundColor Yellow
Write-Host "提交信息: $CommitMessage" -ForegroundColor Gray
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 提交失败" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 更改已提交" -ForegroundColor Green
Write-Host ""

# 询问是否推送
Write-Host "是否推送到GitHub？(y/n)" -ForegroundColor Yellow
$push = Read-Host

if ($push -eq "y" -or $push -eq "Y") {
    Write-Host ""
    Write-Host "正在推送到GitHub..." -ForegroundColor Yellow
    
    # 获取当前分支名
    $currentBranch = git branch --show-current
    if ([string]::IsNullOrWhiteSpace($currentBranch)) {
        $currentBranch = "main"
    }
    
    git push -u origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓✓✓ 成功！更改已推送到GitHub ✓✓✓" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ 推送失败，可能的原因：" -ForegroundColor Red
        Write-Host "1. 需要配置远程仓库: git remote add origin <仓库地址>" -ForegroundColor Yellow
        Write-Host "2. 需要输入GitHub用户名和Token" -ForegroundColor Yellow
        Write-Host "3. 网络连接问题" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "请手动执行: git push" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "已提交但未推送，稍后可以使用以下命令推送：" -ForegroundColor Yellow
    Write-Host "  git push" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan


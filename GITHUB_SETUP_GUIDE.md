# GitHub 仓库创建指南
## arizon-sop-system

---

## 📝 Step 1: 在GitHub上创建新仓库

### 方法1：通过GitHub网页（推荐）

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `arizon-sop-system`
   - **Description**: `AI-Driven SOP Management & Optimization System for Global Operations`
   - **Visibility**: 
     - ✅ **Private** (推荐 - 公司内部项目)
     - ⬜ Public
   - **Initialize this repository with**:
     - ⬜ 不要勾选"Add a README file"（我们本地已有）
     - ⬜ 不要选择.gitignore（我们会创建）
     - ⬜ 不要选择license
3. 点击 **Create repository**

---

## 💻 Step 2: 在本地连接到GitHub

### 打开PowerShell，执行以下命令：

```powershell
# 1. 进入SOP项目目录
cd "C:\Users\Roy\Desktop\Arizon Automation\SOP"

# 2. 初始化Git仓库（如果还没有）
git init

# 3. 添加所有文件
git add .

# 4. 创建第一次提交
git commit -m "Initial commit: SOP system MVP structure"

# 5. 连接到GitHub远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/arizon-sop-system.git

# 6. 推送到GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 如果推送时需要身份验证

### 选项A: 使用Personal Access Token (推荐)

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 设置：
   - **Note**: `Arizon SOP System`
   - **Expiration**: 90 days 或 No expiration
   - **Select scopes**: 勾选 `repo` (Full control of private repositories)
4. 点击 **Generate token**
5. **复制token**（只显示一次！）
6. 推送时，用户名输入你的GitHub用户名，密码输入这个token

### 选项B: 使用SSH Key

```powershell
# 1. 生成SSH Key（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 复制SSH公钥
cat ~/.ssh/id_ed25519.pub | clip

# 3. 访问 https://github.com/settings/keys
# 4. 点击 "New SSH key"，粘贴公钥

# 5. 修改远程仓库URL为SSH
git remote set-url origin git@github.com:YOUR_USERNAME/arizon-sop-system.git

# 6. 推送
git push -u origin main
```

---

## 📂 推荐的GitHub仓库结构

```
arizon-sop-system/
├── README.md                          # 项目说明
├── .gitignore                         # Git忽略文件
├── .env.example                       # 环境变量示例
├── package.json                       # 依赖管理
├── tsconfig.json                      # TypeScript配置
├── next.config.ts                     # Next.js配置
├── tailwind.config.ts                 # Tailwind配置
├── docs/                              # 文档目录
│   ├── ARCHITECTURE.md                # 架构说明
│   ├── API.md                         # API文档
│   └── INTEGRATION_PLAN.md            # 整合计划
├── app/                               # Next.js应用
├── components/                        # React组件
├── lib/                               # 工具库
├── db/                                # 数据库脚本
└── public/                            # 静态资源
```

---

## 🔄 日常开发流程

```powershell
# 1. 查看修改状态
git status

# 2. 添加修改文件
git add .

# 3. 提交修改
git commit -m "描述你的修改"

# 4. 推送到GitHub
git push

# 5. 拉取最新代码（如果有团队协作）
git pull
```

---

## 🌿 推荐的分支策略

```powershell
# 主分支
main              # 稳定版本

# 开发分支
dev               # 开发版本

# 功能分支
feature/document-upload
feature/ai-qa
feature/approval-system
```

### 创建功能分支：

```powershell
# 创建并切换到新分支
git checkout -b feature/document-upload

# 开发完成后，推送到GitHub
git push -u origin feature/document-upload

# 然后在GitHub上创建Pull Request合并到main
```

---

## 📋 Commit Message 规范

```
feat: 添加文档上传功能
fix: 修复SOP解析错误
docs: 更新API文档
style: 优化UI样式
refactor: 重构向量搜索逻辑
test: 添加问答系统测试
chore: 更新依赖包
```

---

## 🔗 与arizon-one-v3的关系

当SOP系统成熟后，整合方案：

### 选项A: 保持独立仓库
```
arizon-one-v3/           # 主系统
arizon-sop-system/       # SOP系统（独立仓库）
```
**优势**: 独立开发、独立部署、版本管理清晰

### 选项B: 合并到arizon-one-v3
```powershell
# 在arizon-one-v3中
git remote add sop-system ../SOP
git fetch sop-system
git merge --allow-unrelated-histories sop-system/main

# 然后手动调整目录结构
```
**优势**: 统一代码库、统一部署

### 推荐：选项A（保持独立）
- SOP系统可以作为独立微服务
- 通过API与arizon-one-v3通信
- 或者作为独立Hub模块（独立仓库，独立部署）

---

## 🎯 后续步骤

1. ✅ 创建GitHub仓库
2. ✅ 推送初始代码
3. ✅ 开始开发MVP功能
4. ✅ 定期commit和push
5. ✅ 测试成熟后，再整合到arizon-one-v3

---

**准备好了吗？创建完GitHub仓库后告诉我，我会帮你搭建完整的项目结构！** 🚀


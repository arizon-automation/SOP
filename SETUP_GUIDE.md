# SOP系统配置指南
## 从零开始配置完整的开发环境

---

## 📋 准备清单

在开始之前，确保你有：

- [ ] GitHub账号
- [ ] Neon账号（数据库）
- [ ] OpenAI API Key
- [ ] Node.js 18.17+ 已安装
- [ ] Git 已安装

---

## 🗄️ Step 1: 配置Neon数据库

### 1.1 创建Neon项目

1. 访问 https://neon.tech
2. 点击 **Sign In** 用GitHub账号登录
3. 点击 **New Project**
4. 填写信息：
   - **Project name**: `arizon-sop-system`
   - **PostgreSQL version**: 16（默认）
   - **Region**: 选择 **AWS us-east-1** 或 **AWS eu-central-1**
5. 点击 **Create Project**

### 1.2 启用pgvector扩展

在Neon控制台的SQL Editor中执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 复制连接字符串

在Neon项目页面：
1. 点击 **Connection Details**
2. 选择 **Connection string**
3. 复制连接字符串，格式类似：
   ```
   postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require
   ```
4. 保存备用

---

## 🤖 Step 2: 配置OpenAI API

### 选项A: 复用arizon-one-v3的API Key

如果你已经有arizon-one-v3项目的OpenAI API key，直接复制使用即可。

### 选项B: 创建新的API Key

1. 访问 https://platform.openai.com/api-keys
2. 登录OpenAI账号
3. 点击 **Create new secret key**
4. 输入名称: `Arizon SOP System`
5. 点击 **Create secret key**
6. **立即复制**（只显示一次！）格式：`sk-xxx`
7. 保存备用

### 设置使用限额（防止超支）

1. 访问 https://platform.openai.com/account/limits
2. 设置月度限额（建议MVP阶段设置$100）
3. 设置邮件提醒（80%时通知）

---

## 💻 Step 3: 本地配置项目

### 3.1 克隆项目

```powershell
cd "C:\Users\Roy\Desktop\Arizon Automation"
git clone https://github.com/arizon-automation/SOP.git
cd SOP
```

### 3.2 安装依赖

```powershell
npm install
```

这将安装所有必需的依赖包，可能需要3-5分钟。

### 3.3 配置环境变量

复制环境变量模板：

```powershell
cp env.template .env.local
```

编辑 `.env.local` 文件，填入你的配置：

```env
# 数据库配置（使用Step 1复制的连接字符串）
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require"

# OpenAI API配置（使用Step 2的API key）
OPENAI_API_KEY="sk-xxx"

# Vercel Blob存储（本地开发可以暂时不配置）
BLOB_READ_WRITE_TOKEN=""

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Session密钥（使用默认值即可）
SESSION_SECRET="change-this-in-production-please-use-random-string"
```

### 3.4 运行数据库迁移

```powershell
npm run db:migrate
```

成功后你会看到：

```
✅ 数据库连接成功
📝 执行迁移文件: 001_create_sop_tables.sql
✅ 数据库迁移完成！

📊 已创建以下表:
  - sop_users (用户表)
  - sop_sessions (会话表)
  - sop_documents (文档表)
  ...

👤 默认管理员账号:
  用户名: admin
  密码: admin123
  邮箱: admin@arizon.com.au
```

### 3.5 启动开发服务器

```powershell
npm run dev
```

看到以下信息表示成功：

```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

---

## 🎉 Step 4: 测试系统

### 4.1 访问系统

打开浏览器，访问：http://localhost:3000

### 4.2 登录测试

使用默认管理员账号登录：
- 邮箱: `admin@arizon.com.au`
- 密码: `admin123`

### 4.3 检查功能

登录成功后，你应该能看到：
- ✅ 仪表板页面
- ✅ 用户信息显示
- ✅ 功能模块卡片

---

## 🚀 Step 5: 推送到GitHub

### 5.1 查看修改状态

```powershell
git status
```

### 5.2 添加所有新文件

```powershell
git add .
```

### 5.3 提交修改

```powershell
git commit -m "feat: 完成基础架构搭建 - 认证系统、数据库配置、仪表板"
```

### 5.4 推送到GitHub

```powershell
git push
```

---

## 🔄 Step 6: 部署到Vercel（可选）

### 6.1 连接Vercel

1. 访问 https://vercel.com
2. 用GitHub账号登录
3. 点击 **Add New Project**
4. 选择 `arizon-automation/SOP` 仓库
5. 点击 **Import**

### 6.2 配置环境变量

在Vercel项目设置中添加：

```
DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require
OPENAI_API_KEY = sk-xxx
SESSION_SECRET = your-random-secret-here
```

### 6.3 部署

点击 **Deploy**，等待构建完成（约2-3分钟）

### 6.4 访问生产环境

Vercel会提供一个URL，类似：`https://sop-xxx.vercel.app`

---

## 🐛 常见问题

### 问题1: 数据库连接失败

**错误**: `connection to server failed`

**解决**:
1. 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
2. 确保连接字符串包含 `?sslmode=require`
3. 检查Neon项目是否处于活跃状态

### 问题2: npm install失败

**错误**: `ERESOLVE unable to resolve dependency tree`

**解决**:
```powershell
npm install --legacy-peer-deps
```

### 问题3: 数据库迁移失败

**错误**: `relation already exists`

**解决**: 这是正常的，表示表已经存在。可以忽略。

### 问题4: OpenAI API调用失败

**错误**: `Invalid API key`

**解决**:
1. 检查 `.env.local` 中的 `OPENAI_API_KEY` 是否正确
2. 访问 https://platform.openai.com/account/api-keys 验证key是否有效
3. 确保OpenAI账户有可用额度

---

## 📝 下一步开发

完成配置后，你可以开始开发新功能：

1. **创建功能分支**
   ```powershell
   git checkout -b feature/document-upload
   ```

2. **开发新功能**
   - 参考 `SOP_MVP_INTEGRATION_PLAN.md` 中的功能列表
   - 从Phase 1的文档上传功能开始

3. **提交并推送**
   ```powershell
   git add .
   git commit -m "feat: 添加文档上传功能"
   git push -u origin feature/document-upload
   ```

4. **创建Pull Request**
   - 在GitHub上创建PR
   - 合并到main分支

---

## 🎯 MVP开发优先级

按以下顺序开发：

1. ✅ **Phase 0: 基础架构**（已完成）
2. 🔄 **Phase 1: 文档上传** → 下一步开发
3. ⏳ **Phase 2: AI解析与SOP生成**
4. ⏳ **Phase 3: AI问答系统**
5. ⏳ **Phase 4: 审批系统**
6. ⏳ **Phase 5: 数据分析**

---

## 📞 需要帮助？

如遇到其他问题，请：
1. 检查本指南是否有解决方案
2. 查看 `README.md` 中的文档链接
3. 联系开发团队

---

**祝开发顺利！🚀**


# Arizon SOP System

> **AI驱动的全球化SOP管理与优化系统**
> 
> AI-Driven Global SOP Management & Optimization System

---

## 🎯 项目简介

Arizon SOP System是一个旨在打造企业长期运营中枢的全球AI驱动SOP管理与优化系统。它的核心目标是让公司所有的操作流程能够被智能化地读取、理解、组织、优化，并以中英文双语形式呈现给不同区域的团队。

### 核心功能

- 📄 **智能文档解析**: 上传PDF/Word文档，AI自动识别流程结构
- 🌏 **中英文双语**: 自动翻译，全球团队无缝协作
- 💬 **AI智能问答**: 员工随时提问，AI即时从SOP库检索答案
- ✅ **审批工作流**: AI提出修改建议需要人工审批
- 📊 **数据分析**: 识别高频问题和SOP盲区，持续优化

---

## 🚀 快速开始

### 1. 环境要求

- Node.js 18.17.0 或更高版本
- PostgreSQL数据库（推荐使用Neon）
- OpenAI API Key

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `env.template` 到 `.env.local`:

```bash
cp env.template .env.local
```

然后编辑 `.env.local`，填入你的配置：

```env
# 数据库（Neon PostgreSQL）
DATABASE_URL="postgresql://user:password@xxx.neon.tech/sop?sslmode=require"

# OpenAI API
OPENAI_API_KEY="sk-xxx"

# 应用URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. 创建数据库表

```bash
npm run db:migrate
```

这将创建所有必需的表并启用pgvector扩展。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 登录系统

默认管理员账号：
- 邮箱: `admin@arizon.com.au`
- 密码: `admin123`

---

## 📦 技术栈

### 前端
- **Next.js 15** - React框架（App Router）
- **React 19** - UI库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架

### 后端
- **Next.js API Routes** - 后端API
- **PostgreSQL** - 关系型数据库
- **pgvector** - 向量搜索扩展

### AI服务
- **OpenAI GPT-4** - 文档解析、问答
- **OpenAI Embeddings** - 向量化（text-embedding-3-small）

### 部署
- **Vercel** - 前端托管
- **Neon** - PostgreSQL数据库托管
- **Vercel Blob** - 文件存储

---

## 📁 项目结构

```
arizon-sop-system/
├── app/                       # Next.js应用
│   ├── api/                   # API路由
│   │   └── auth/              # 认证API
│   ├── dashboard/             # 仪表板
│   ├── documents/             # 文档管理（待开发）
│   ├── sops/                  # SOP管理（待开发）
│   ├── qa/                    # AI问答（待开发）
│   ├── approvals/             # 审批管理（待开发）
│   └── analytics/             # 数据分析（待开发）
│
├── components/                # React组件
│   └── sop/                   # SOP相关组件（待开发）
│
├── lib/                       # 工具库
│   ├── db.ts                  # 数据库连接
│   ├── auth.ts                # 认证系统
│   └── sop/                   # SOP工具（待开发）
│
├── db/                        # 数据库
│   └── migrations/            # 迁移脚本
│       └── 001_create_sop_tables.sql
│
├── scripts/                   # 脚本
│   └── migrate-database.js    # 数据库迁移
│
├── docs/                      # 文档
│   ├── SOP_MVP_INTEGRATION_PLAN.md
│   ├── TECH_STACK_DISCUSSION.md
│   └── GITHUB_SETUP_GUIDE.md
│
├── package.json               # 依赖配置
├── tsconfig.json              # TypeScript配置
├── next.config.ts             # Next.js配置
├── tailwind.config.ts         # Tailwind配置
└── README.md                  # 本文件
```

---

## 🗄️ 数据库表结构

- **sop_users** - 用户表
- **sop_sessions** - 会话表
- **sop_documents** - 上传的文档表
- **sops** - SOP主表
- **sop_content_blocks** - SOP内容块表（用于向量搜索）
- **sop_qa_history** - 问答历史表
- **sop_approvals** - 审批记录表
- **sop_analytics** - 分析统计表

---

## 🔐 权限系统

### 角色

- **admin** - 管理员：完全权限
- **manager** - 经理：可上传文档、审批、查看分析
- **user** - 普通用户：查看SOP、使用问答系统

---

## 📝 开发计划

### ✅ Phase 0: 基础架构（已完成）
- [x] Next.js 15项目搭建
- [x] 数据库表结构设计
- [x] 认证系统
- [x] 基础UI页面

### 🔄 Phase 1: 文档管理（进行中）
- [ ] 文档上传页面
- [ ] 文档列表页面
- [ ] PDF/Word解析功能
- [ ] Vercel Blob集成

### ⏳ Phase 2: SOP生成（待开发）
- [ ] AI文档解析（OpenAI GPT-4）
- [ ] 结构化SOP生成
- [ ] 中英文翻译
- [ ] SOP编辑器

### ⏳ Phase 3: AI问答（待开发）
- [ ] 向量搜索（pgvector）
- [ ] 问答API
- [ ] 聊天界面
- [ ] 问答历史记录

### ⏳ Phase 4: 审批系统（待开发）
- [ ] 审批工作流
- [ ] 修改对比界面
- [ ] 邮件通知

### ⏳ Phase 5: 数据分析（待开发）
- [ ] 统计仪表板
- [ ] 高频问题分析
- [ ] SOP盲区识别

---

## 🚢 部署

### 部署到Vercel

1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 配置环境变量（DATABASE_URL, OPENAI_API_KEY等）
4. 部署

### 配置Neon数据库

1. 访问 https://neon.tech
2. 创建新项目 `arizon-sop-system`
3. 复制连接字符串
4. 在项目根目录运行 `npm run db:migrate`

---

## 💰 成本估算

### 免费阶段（MVP）
- **数据库**: $0/月（Neon免费tier）
- **前端托管**: $0/月（Vercel免费tier）
- **文件存储**: $0/月（Vercel Blob免费tier）
- **OpenAI API**: ~$50/月（开发阶段）

**总计**: ~$50/月

### 生产环境
- **数据库**: $19/月（Neon Pro）
- **前端托管**: $0/月（Vercel免费tier足够）
- **文件存储**: ~$5/月
- **OpenAI API**: ~$150/月（100+员工使用）

**总计**: ~$174/月

---

## 🔗 相关文档

- [整合方案](./SOP_MVP_INTEGRATION_PLAN.md) - 如何整合到arizon-one-v3
- [技术选型](./TECH_STACK_DISCUSSION.md) - 技术栈详细讨论
- [GitHub指南](./GITHUB_SETUP_GUIDE.md) - Git工作流

---

## 📞 支持

如有问题，请联系开发团队。

---

## 📄 许可证

Copyright © 2025 Arizon Off Grid. All rights reserved.

---

**Built with ❤️ using Next.js 15 + OpenAI**


# SOP系统技术选型讨论
## 云端基础设施方案

---

## 🗄️ 数据库方案对比

### 方案1：Neon PostgreSQL ⭐ **推荐**

**为什么推荐：**
- ✅ arizon-one-v3已经在用Neon，你已经熟悉
- ✅ **免费tier非常慷慨**：0.5GB存储，无时间限制
- ✅ 完美支持**pgvector扩展**（向量搜索必需）
- ✅ Serverless架构，自动休眠节省成本
- ✅ 提供免费备份
- ✅ 从中国访问速度可接受

**免费额度：**
```
存储：0.5 GB
计算时间：191小时/月（超过会自动休眠）
分支：10个（用于测试环境）
```

**成本预估：**
- **MVP阶段**：$0/月（免费tier足够）
- **生产环境**：$19/月起（1GB存储 + 更多计算时间）

**配置步骤：**
1. 访问 https://neon.tech
2. 用GitHub账号登录
3. 创建新项目 `arizon-sop-system`
4. 选择区域：**AWS us-east-1** 或 **AWS eu-central-1**
5. 获取连接字符串：`postgresql://user:pass@xxx.neon.tech/sop?sslmode=require`

**启用pgvector：**
```sql
CREATE EXTENSION vector;
```

---

### 方案2：Supabase PostgreSQL

**优势：**
- ✅ 免费tier：500MB数据库 + 1GB文件存储
- ✅ 支持pgvector
- ✅ **自带文件存储**（可以存PDF/Word）
- ✅ 自带认证系统（可选用）
- ✅ 自带实时订阅功能
- ✅ 提供管理面板

**劣势：**
- ⚠️ 免费tier项目会在1周不活动后暂停
- ⚠️ 从中国访问较慢（服务器在国外）

**成本预估：**
- **MVP阶段**：$0/月
- **生产环境**：$25/月起

---

### 方案3：Vercel Postgres

**优势：**
- ✅ 与Vercel完美集成
- ✅ 边缘计算，全球加速
- ✅ 配置超级简单

**劣势：**
- ❌ **不支持pgvector扩展**（致命缺陷）
- ❌ 免费tier只有256MB
- ❌ 成本较高（$20/月起）

**结论：不适合SOP系统**（需要向量搜索）

---

### 方案4：Railway PostgreSQL

**优势：**
- ✅ 配置简单
- ✅ 支持pgvector
- ✅ 自动备份

**劣势：**
- ⚠️ 免费tier只有$5信用额度/月
- ⚠️ 超出后立即收费
- ⚠️ 成本不可预测

---

### 方案5：阿里云RDS PostgreSQL

**优势：**
- ✅ 中国访问速度快
- ✅ 稳定可靠
- ✅ 支持pgvector

**劣势：**
- ❌ 无免费tier
- ❌ 最低配置：￥300+/月
- ❌ 配置复杂（VPC、安全组）

**结论：成本太高，不适合MVP阶段**

---

## 📊 推荐方案总结

### 🏆 最佳选择：Neon PostgreSQL

**理由：**
1. ✅ 你已经在arizon-one-v3用Neon，经验复用
2. ✅ 免费tier足够MVP使用（6个月内不花钱）
3. ✅ 支持pgvector向量搜索
4. ✅ 自动备份和分支功能
5. ✅ 升级到生产环境简单（只需改plan）

---

## 📁 文件存储方案

### 问题：用户上传的PDF/Word文档存哪里？

### 方案1：Vercel Blob Storage ⭐ **推荐**

**为什么推荐：**
- ✅ 与Next.js完美集成（官方方案）
- ✅ 免费tier：1GB存储
- ✅ 全球CDN加速
- ✅ 简单的API（3行代码上传）

**免费额度：**
```
存储：1 GB
读操作：100 GB/月
写操作：1000次/月
```

**成本预估：**
- **MVP阶段**：$0/月
- **生产环境**：$0.15/GB/月

**代码示例：**
```typescript
import { put } from '@vercel/blob';

const blob = await put('document.pdf', file, {
  access: 'public',
});

console.log(blob.url); // https://xxx.vercel-storage.com/document.pdf
```

---

### 方案2：Cloudflare R2

**优势：**
- ✅ 免费tier：10GB存储
- ✅ **0出站流量费用**（比AWS S3便宜）
- ✅ S3兼容API

**劣势：**
- ⚠️ 需要额外配置
- ⚠️ 从中国访问不稳定

---

### 方案3：Supabase Storage

**优势：**
- ✅ 如果用Supabase数据库，可以一起用
- ✅ 免费tier：1GB存储

**劣势：**
- ⚠️ 与Vercel集成不如Vercel Blob

---

## 🤖 OpenAI API配置

### 使用OpenAI官方API ⭐ **推荐**

**为什么：**
- ✅ arizon-one-v3已经在用，有API key
- ✅ 最新模型支持（GPT-4, GPT-4-turbo）
- ✅ 支持Embeddings（向量搜索必需）

**成本预估（每月）：**
```
文档解析：
- GPT-4-turbo: $10/1M tokens input, $30/1M tokens output
- 假设每天解析5个文档，每个10页
- 成本：~$20/月

向量嵌入：
- text-embedding-3-small: $0.02/1M tokens
- 假设每天处理50个内容块
- 成本：~$3/月

问答系统：
- GPT-4-turbo: 假设每天100次问答
- 成本：~$40/月

翻译：
- GPT-4-turbo: 假设每天翻译3个SOP
- 成本：~$15/月

总计：~$78/月（MVP阶段可能更低）
```

**省钱技巧：**
- ✅ 开发阶段用GPT-3.5-turbo（便宜10倍）
- ✅ 缓存常见问答（避免重复调用）
- ✅ 使用较小的embedding模型（text-embedding-3-small）

---

## 🚀 部署方案

### 前端部署：Vercel ⭐ **推荐**

**为什么：**
- ✅ Next.js官方推荐
- ✅ 零配置部署（连接GitHub自动部署）
- ✅ 全球CDN加速
- ✅ 免费tier足够用

**免费额度：**
```
带宽：100 GB/月
构建：6000分钟/月
无限网站
```

---

## 📋 完整技术栈总结

```
┌─────────────────────────────────────────┐
│         SOP System Architecture         │
└─────────────────────────────────────────┘

🌐 前端：
├── Next.js 15 (App Router)
├── React 19
├── TypeScript
├── Tailwind CSS
└── 部署：Vercel (免费)

⚙️ 后端：
├── Next.js API Routes
├── 部署：Vercel (免费)

🗄️ 数据库：
├── Neon PostgreSQL (免费tier 0.5GB)
├── pgvector扩展（向量搜索）
└── 自动备份

📁 文件存储：
├── Vercel Blob (免费tier 1GB)
└── 存储PDF/Word文档

🤖 AI服务：
├── OpenAI GPT-4-turbo (文档解析、问答)
├── OpenAI text-embedding-3-small (向量化)
└── 成本：~$50-80/月（MVP阶段）

🔐 认证：
├── Session-based认证
└── 复用arizon-one-v3的认证逻辑

📊 监控：
├── Vercel Analytics (免费)
└── Sentry (错误跟踪，免费tier 5K错误/月)
```

---

## 💰 总成本估算

### MVP阶段（开发+测试，前3-6个月）

```
数据库（Neon）：          $0/月    ✅ 免费tier
文件存储（Vercel Blob）： $0/月    ✅ 免费tier
前端部署（Vercel）：      $0/月    ✅ 免费tier
OpenAI API：             ~$50/月   （开发阶段用量少）
─────────────────────────────────
总计：                   ~$50/月
```

### 生产环境（正式上线后）

```
数据库（Neon Pro）：      $19/月   (1GB存储)
文件存储（Vercel Blob）： $5/月    (超出免费tier部分)
前端部署（Vercel）：      $0/月    (免费tier足够)
OpenAI API：             ~$150/月  (100+ 员工使用)
─────────────────────────────────
总计：                   ~$174/月
```

---

## 🎯 推荐的MVP技术栈

```typescript
// 最终推荐方案

{
  "数据库": "Neon PostgreSQL (免费tier)",
  "文件存储": "Vercel Blob (免费tier)",
  "前端部署": "Vercel (免费tier)",
  "AI服务": "OpenAI API",
  "成本": "~$50/月 (MVP阶段)",
  
  "优势": [
    "零基础设施成本",
    "全部使用免费tier",
    "只为OpenAI API付费",
    "与arizon-one-v3技术栈一致",
    "后期升级简单"
  ]
}
```

---

## 🔧 下一步配置清单

### 1. 创建Neon数据库（5分钟）
```
1. 访问 https://neon.tech
2. 用GitHub登录
3. 创建项目 "arizon-sop-system"
4. 复制连接字符串
5. 启用pgvector扩展
```

### 2. 配置Vercel Blob（3分钟）
```
1. 访问 https://vercel.com
2. 进入项目（稍后创建）
3. 在Storage中创建Blob Store
4. 复制环境变量
```

### 3. 配置OpenAI API（2分钟）
```
1. 使用arizon-one-v3的OpenAI API key
   或
2. 访问 https://platform.openai.com/api-keys
3. 创建新的API key
4. 设置使用限额（防止超支）
```

### 4. 创建.env.local文件
```env
# 数据库
DATABASE_URL="postgresql://xxx@xxx.neon.tech/sop?sslmode=require"

# OpenAI
OPENAI_API_KEY="sk-xxx"

# Vercel Blob (部署到Vercel后自动配置)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxx"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## ❓ 你的决定

现在需要你确认：

**Q1: 数据库方案？**
- ✅ **Neon PostgreSQL** (推荐 - 免费tier + pgvector)
- ⬜ Supabase (如果想要自带文件存储)
- ⬜ 其他

**Q2: 文件存储方案？**
- ✅ **Vercel Blob** (推荐 - 与Next.js完美集成)
- ⬜ Supabase Storage (如果选了Supabase数据库)
- ⬜ Cloudflare R2

**Q3: 是否复用arizon-one-v3的OpenAI API key？**
- ✅ **是** (推荐 - 节省管理成本)
- ⬜ 否，创建新的key (如果想独立管理)

**告诉我你的选择，我马上开始搭建项目！** 🚀


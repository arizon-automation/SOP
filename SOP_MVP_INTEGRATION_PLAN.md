# SOP系统 MVP整合方案
## 整合到 Arizon One V3

> **目标**: 将AI驱动的SOP管理系统作为Hub的新模块整合到现有arizon-one-v3项目中

---

## 🎯 整合优势

**复用现有基础设施：**
- ✅ Next.js 15 + React 19 架构
- ✅ PostgreSQL 数据库连接
- ✅ OpenAI API 已集成
- ✅ Hub认证系统（session-based）
- ✅ Tailwind CSS UI框架
- ✅ Sentry错误跟踪

**节省开发时间：**
- ✅ 无需重新搭建前端框架
- ✅ 无需重新设计认证系统
- ✅ 无需重新配置数据库
- ✅ 无需重新设计UI风格

---

## 📁 项目结构设计

### 在 arizon-one-v3 中添加以下文件：

```
arizon-one-v3/
├── app/
│   ├── hub/
│   │   ├── sop/                           # 🆕 SOP模块（新增）
│   │   │   ├── page.tsx                   # SOP主仪表板
│   │   │   ├── documents/                 # 文档管理页面
│   │   │   │   ├── page.tsx               # 文档列表
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx           # 文档详情
│   │   │   │   └── upload/
│   │   │   │       └── page.tsx           # 文档上传
│   │   │   ├── sops/                      # SOP管理页面
│   │   │   │   ├── page.tsx               # SOP列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # SOP详情与编辑
│   │   │   ├── qa/                        # 知识问答页面
│   │   │   │   └── page.tsx               # 问答界面
│   │   │   ├── analytics/                 # 分析统计页面
│   │   │   │   └── page.tsx               # 提问统计与分析
│   │   │   └── approvals/                 # 审批管理页面
│   │   │       └── page.tsx               # 待审批列表
│   │   │
│   │   ├── leads/                         # 现有模块
│   │   ├── risk/                          # 现有模块
│   │   └── sales/                         # 现有模块
│   │
│   ├── api/
│   │   ├── hub/
│   │   │   ├── sop/                       # 🆕 SOP API路由（新增）
│   │   │   │   ├── documents/
│   │   │   │   │   ├── route.ts           # GET/POST文档
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts       # GET/PUT/DELETE单个文档
│   │   │   │   │   └── parse/
│   │   │   │   │       └── route.ts       # POST解析文档
│   │   │   │   ├── sops/
│   │   │   │   │   ├── route.ts           # GET/POST SOP
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts       # GET/PUT/DELETE单个SOP
│   │   │   │   │   └── translate/
│   │   │   │   │       └── route.ts       # POST翻译SOP
│   │   │   │   ├── qa/
│   │   │   │   │   ├── ask/
│   │   │   │   │   │   └── route.ts       # POST提问
│   │   │   │   │   └── history/
│   │   │   │   │       └── route.ts       # GET问答历史
│   │   │   │   ├── approvals/
│   │   │   │   │   ├── route.ts           # GET待审批
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts       # PUT批准/拒绝
│   │   │   │   └── analytics/
│   │   │   │       └── route.ts           # GET统计数据
│   │   │   │
│   │   │   ├── leads/                     # 现有API
│   │   │   ├── risk/                      # 现有API
│   │   │   └── sales/                     # 现有API
│   │
│   └── shop/                              # 现有客户门户
│
├── components/
│   ├── sop/                               # 🆕 SOP组件（新增）
│   │   ├── DocumentUploader.tsx          # 文档上传组件
│   │   ├── SOPEditor.tsx                 # SOP编辑器
│   │   ├── SOPViewer.tsx                 # SOP查看器
│   │   ├── QAChat.tsx                    # 问答聊天界面
│   │   ├── ApprovalCard.tsx              # 审批卡片
│   │   └── AnalyticsChart.tsx            # 分析图表
│   │
│   ├── leads/                            # 现有组件
│   ├── risk/                             # 现有组件
│   └── sales/                            # 现有组件
│
├── lib/
│   ├── sop/                              # 🆕 SOP工具库（新增）
│   │   ├── document-parser.ts           # 文档解析工具
│   │   ├── sop-generator.ts             # SOP生成工具
│   │   ├── translator.ts                # 翻译工具
│   │   ├── qa-engine.ts                 # 问答引擎
│   │   └── vector-search.ts             # 向量搜索
│   │
│   ├── db.ts                            # 现有数据库工具
│   ├── auth.ts                          # 现有认证工具
│   └── openai-helper.ts                 # 🆕 OpenAI封装（可选新增）
│
└── db/
    └── migrations/
        └── 006_create_sop_tables.sql     # 🆕 SOP数据表迁移（新增）
```

---

## 🗄️ 数据库设计

### 新增数据表（在现有PostgreSQL中）

```sql
-- 1. 上传的文档表
CREATE TABLE sop_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,  -- 'pdf', 'docx', 'notion'
  file_url TEXT NOT NULL,           -- Vercel Blob存储URL
  file_size INTEGER,
  raw_content TEXT,                 -- 原始文本内容
  parsed_content JSONB,             -- 结构化解析结果
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'uploaded',  -- 'uploaded', 'parsing', 'parsed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. SOP主表
CREATE TABLE sops (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES sop_documents(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  department VARCHAR(100),           -- '销售部', '仓库部', '客服部'
  category VARCHAR(100),             -- '订单处理', '退货流程', '客户咨询'
  version VARCHAR(50) DEFAULT '1.0',
  language VARCHAR(10) DEFAULT 'zh', -- 'zh', 'en'
  translation_pair_id INTEGER,       -- 关联的翻译版本ID
  content JSONB NOT NULL,            -- 结构化SOP内容
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'archived'
  created_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. SOP内容块表（用于向量搜索）
CREATE TABLE sop_content_blocks (
  id SERIAL PRIMARY KEY,
  sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
  block_type VARCHAR(50),            -- 'step', 'note', 'condition', 'responsibility'
  content TEXT NOT NULL,
  content_zh TEXT,                   -- 中文内容
  content_en TEXT,                   -- 英文内容
  embedding VECTOR(1536),            -- OpenAI embedding向量
  block_order INTEGER,
  metadata JSONB,                    -- 额外元数据
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 问答历史表
CREATE TABLE sop_qa_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  username VARCHAR(100),
  user_language VARCHAR(10),         -- 'zh', 'en'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  matched_sop_ids INTEGER[],         -- 匹配到的SOP ID数组
  confidence_score FLOAT,            -- 匹配置信度
  feedback VARCHAR(50),              -- 'helpful', 'not_helpful'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 审批记录表
CREATE TABLE sop_approvals (
  id SERIAL PRIMARY KEY,
  sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
  change_type VARCHAR(50),           -- 'new', 'update', 'delete'
  old_content JSONB,                 -- 修改前内容
  new_content JSONB,                 -- 修改后内容
  ai_suggestions JSONB,              -- AI建议
  requested_by VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by VARCHAR(100),
  review_comment TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 分析统计表（缓存）
CREATE TABLE sop_analytics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(100),          -- 'top_questions', 'department_usage', 'missing_topics'
  metric_data JSONB NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX idx_sop_documents_status ON sop_documents(status);
CREATE INDEX idx_sops_status ON sops(status);
CREATE INDEX idx_sops_department ON sops(department);
CREATE INDEX idx_sops_language ON sops(language);
CREATE INDEX idx_sop_qa_history_user ON sop_qa_history(user_id);
CREATE INDEX idx_sop_qa_history_date ON sop_qa_history(created_at);
CREATE INDEX idx_sop_approvals_status ON sop_approvals(status);

-- 启用pgvector扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🎨 MVP核心功能

### ✅ Phase 1: 文档解析与SOP生成（第1-2周）

**前端页面：**
- `/hub/sop` - SOP仪表板（显示统计、最近SOP）
- `/hub/sop/documents/upload` - 文档上传页面
- `/hub/sop/sops` - SOP列表页面
- `/hub/sop/sops/[id]` - SOP详情页面

**后端API：**
- `POST /api/hub/sop/documents/parse` - 上传并解析文档
  - 使用`pdf-parse`或`@upstash/ratelimit`处理PDF
  - 使用`mammoth`处理Word文档
  - 使用OpenAI GPT-4提取流程结构
  
- `POST /api/hub/sop/sops/translate` - 翻译SOP
  - 使用OpenAI翻译中英文
  - 保持格式一致性

**核心功能：**
1. 上传PDF/Word文档
2. AI自动解析流程步骤、角色、条件
3. 生成结构化SOP（JSON格式）
4. 自动翻译成中英文双语
5. 保存SOP到数据库

---

### ✅ Phase 2: AI知识问答（第3周）

**前端页面：**
- `/hub/sop/qa` - 问答界面（类似ChatWidget）

**后端API：**
- `POST /api/hub/sop/qa/ask` - 提交问题
  - 使用OpenAI Embeddings将问题转为向量
  - 在`sop_content_blocks`中进行向量相似度搜索
  - 使用GPT-4生成回答
  - 记录问答历史

**核心功能：**
1. 员工用中文或英文提问
2. AI从SOP库中检索相关内容
3. 生成准确的回答并显示来源
4. 记录所有问答历史

---

### ✅ Phase 3: 审批系统（第4周）

**前端页面：**
- `/hub/sop/approvals` - 待审批列表
- `/hub/sop/sops/[id]` - 添加审批按钮

**后端API：**
- `GET /api/hub/sop/approvals` - 获取待审批列表
- `PUT /api/hub/sop/approvals/[id]` - 批准/拒绝

**核心功能：**
1. AI修改SOP时创建审批请求
2. 显示修改前后对比
3. 管理员批准/拒绝
4. 批准后自动更新SOP

---

### ✅ Phase 4: 分析统计（第5周）

**前端页面：**
- `/hub/sop/analytics` - 统计仪表板

**后端API：**
- `GET /api/hub/sop/analytics` - 获取统计数据
  - 高频问题Top 10
  - 各部门使用率
  - 识别薄弱环节

**核心功能：**
1. 显示员工提问统计
2. 识别高频问题
3. 发现SOP盲区
4. 生成优化建议

---

## 🔧 技术实现细节

### 1. 文档解析工具 (`lib/sop/document-parser.ts`)

```typescript
import OpenAI from 'openai';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function parseDocument(fileUrl: string, fileType: string) {
  // 1. 提取文本内容
  let rawText = '';
  
  if (fileType === 'pdf') {
    rawText = await extractPDFText(fileUrl);
  } else if (fileType === 'docx') {
    rawText = await extractWordText(fileUrl);
  }
  
  // 2. 使用OpenAI结构化解析
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `你是一个SOP分析专家。请分析以下文档，提取所有操作流程。
        
        返回JSON格式：
        {
          "title": "流程标题",
          "department": "部门",
          "steps": [
            {
              "order": 1,
              "title": "步骤标题",
              "description": "详细描述",
              "responsible": "负责人/角色",
              "conditions": ["触发条件"],
              "notes": ["注意事项"]
            }
          ]
        }`
      },
      { role: "user", content: rawText }
    ],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content);
}
```

---

### 2. 向量搜索引擎 (`lib/sop/vector-search.ts`)

```typescript
import OpenAI from 'openai';
import { query } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function searchSOP(question: string, language: 'zh' | 'en') {
  // 1. 将问题转为向量
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  
  const vector = embedding.data[0].embedding;
  
  // 2. 在数据库中进行向量相似度搜索
  const result = await query(`
    SELECT 
      scb.id,
      scb.sop_id,
      scb.content_zh,
      scb.content_en,
      s.title,
      s.department,
      (scb.embedding <-> $1::vector) AS distance
    FROM sop_content_blocks scb
    JOIN sops s ON scb.sop_id = s.id
    WHERE s.status = 'approved'
    ORDER BY scb.embedding <-> $1::vector
    LIMIT 5
  `, [JSON.stringify(vector)]);
  
  return result.rows;
}
```

---

### 3. 问答引擎 (`lib/sop/qa-engine.ts`)

```typescript
import OpenAI from 'openai';
import { searchSOP } from './vector-search';
import { query } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function answerQuestion(
  question: string, 
  language: 'zh' | 'en',
  userId: string
) {
  // 1. 搜索相关SOP内容
  const relevantBlocks = await searchSOP(question, language);
  
  if (relevantBlocks.length === 0) {
    return {
      answer: language === 'zh' 
        ? '抱歉，我在现有SOP中找不到相关答案。请联系管理员。'
        : 'Sorry, I could not find relevant information in the existing SOPs.',
      sources: [],
      confidence: 0
    };
  }
  
  // 2. 构建上下文
  const context = relevantBlocks
    .map(b => language === 'zh' ? b.content_zh : b.content_en)
    .join('\n\n');
  
  // 3. 使用GPT-4生成回答
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: language === 'zh'
          ? `你是Arizon公司的AI助手。根据以下SOP内容回答员工问题。
             要求：1) 准确引用SOP内容 2) 简洁明了 3) 指出负责人`
          : `You are Arizon's AI assistant. Answer employee questions based on the following SOPs.
             Requirements: 1) Quote SOPs accurately 2) Be concise 3) Mention responsible parties`
      },
      {
        role: "user",
        content: `SOP内容：\n${context}\n\n问题：${question}`
      }
    ]
  });
  
  const answer = completion.choices[0].message.content;
  
  // 4. 记录问答历史
  await query(`
    INSERT INTO sop_qa_history 
    (user_id, user_language, question, answer, matched_sop_ids, confidence_score)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    userId,
    language,
    question,
    answer,
    relevantBlocks.map(b => b.sop_id),
    1 - relevantBlocks[0].distance  // 转为置信度分数
  ]);
  
  return {
    answer,
    sources: relevantBlocks.map(b => ({
      sopId: b.sop_id,
      title: b.title,
      department: b.department
    })),
    confidence: 1 - relevantBlocks[0].distance
  };
}
```

---

## 🚀 开发计划

### Week 1-2: 基础架构与文档解析
- [ ] 创建数据库表
- [ ] 搭建前端页面结构
- [ ] 实现文档上传功能
- [ ] 集成OpenAI文档解析
- [ ] 实现SOP列表与详情页

### Week 3: AI问答系统
- [ ] 创建向量搜索功能
- [ ] 实现问答API
- [ ] 构建问答聊天界面
- [ ] 测试问答准确性

### Week 4: 审批系统
- [ ] 实现审批工作流
- [ ] 构建审批界面
- [ ] 添加版本对比功能
- [ ] 测试审批流程

### Week 5: 分析统计
- [ ] 实现统计数据收集
- [ ] 构建分析仪表板
- [ ] 添加图表展示
- [ ] 生成优化建议

---

## 📦 需要安装的新依赖

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "pgvector": "^0.1.8"
  }
}
```

**注意**: OpenAI已安装在arizon-one-v3中，无需重复安装。

---

## 🎯 MVP完成标准

### ✅ 功能验收标准

1. **文档解析**
   - ✅ 能上传PDF和Word文档
   - ✅ AI能正确识别流程步骤
   - ✅ 生成结构化SOP
   - ✅ 自动翻译中英文

2. **知识问答**
   - ✅ 支持中英文提问
   - ✅ 回答准确率>80%
   - ✅ 显示答案来源
   - ✅ 记录问答历史

3. **审批系统**
   - ✅ AI修改需要审批
   - ✅ 显示修改前后对比
   - ✅ 管理员能批准/拒绝

4. **分析统计**
   - ✅ 显示高频问题
   - ✅ 显示各部门使用率
   - ✅ 识别SOP盲区

---

## 💰 成本估算

### OpenAI API成本（每月）
- **文档解析**: ~$20 (假设每天解析5个文档)
- **问答系统**: ~$50 (假设每天100次问答)
- **翻译**: ~$10 (假设每天翻译3个SOP)
- **向量嵌入**: ~$5 (假设每天处理20个内容块)

**总计**: ~$85/月 (MVP阶段)

### 基础设施成本
- **数据库**: $0 (使用现有Neon PostgreSQL)
- **存储**: ~$5/月 (Vercel Blob存储文档)
- **托管**: $0 (使用现有Vercel Pro)

**总计**: ~$90/月

---

## 🔐 权限设计

### 角色权限
- **super_admin**: 全部权限
- **admin**: 
  - 上传文档
  - 审批SOP修改
  - 查看所有分析
- **manager**: 
  - 上传文档
  - 查看所在部门SOP
  - 查看部门分析
- **user**: 
  - 查看相关SOP
  - 使用问答系统

复用现有的`hub_users`表和`requireAuth()`函数。

---

## 📝 下一步行动

### 立即开始：

1. **创建数据库表**
   ```bash
   cd C:\Users\Roy\Desktop\Arizon Automation\arizon-one-v3
   # 执行SQL脚本创建表
   ```

2. **创建基础文件结构**
   ```bash
   mkdir -p app/hub/sop
   mkdir -p app/api/hub/sop
   mkdir -p components/sop
   mkdir -p lib/sop
   ```

3. **安装新依赖**
   ```bash
   npm install pdf-parse mammoth pgvector
   ```

4. **开始编码**
   - 从文档上传页面开始
   - 然后实现解析API
   - 逐步完成其他功能

---

## 🎉 总结

这个方案将SOP系统完美整合到arizon-one-v3中：
- ✅ **零基础设施成本** - 复用现有架构
- ✅ **开发效率高** - 复用认证、数据库、UI
- ✅ **用户体验一致** - 与现有Hub模块风格统一
- ✅ **可扩展性强** - 易于添加新功能
- ✅ **部署简单** - 随arizon-one-v3一起部署

**预计开发时间**: 5周（1名全栈工程师）

**预计成本**: ~$90/月（MVP阶段）

---

**准备好开始了吗？我可以立即帮你创建第一批文件！** 🚀


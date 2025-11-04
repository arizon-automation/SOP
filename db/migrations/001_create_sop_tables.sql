-- SOP系统数据库表结构
-- 创建日期: 2025-11-04
-- 数据库: PostgreSQL 16+ with pgvector

-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 用户表（简化版认证系统）
CREATE TABLE IF NOT EXISTS sop_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',  -- 'admin', 'manager', 'user'
  department VARCHAR(100),
  language VARCHAR(10) DEFAULT 'zh', -- 'zh', 'en'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 会话表
CREATE TABLE IF NOT EXISTS sop_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES sop_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 上传的文档表
CREATE TABLE IF NOT EXISTS sop_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,  -- 'pdf', 'docx', 'notion'
  file_url TEXT NOT NULL,           -- Vercel Blob存储URL
  file_size INTEGER,
  raw_content TEXT,                 -- 原始文本内容
  parsed_content JSONB,             -- 结构化解析结果
  uploaded_by INTEGER REFERENCES sop_users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'uploaded',  -- 'uploaded', 'parsing', 'parsed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. SOP主表
CREATE TABLE IF NOT EXISTS sops (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES sop_documents(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  department VARCHAR(100),           -- '销售部', '仓库部', '客服部'
  category VARCHAR(100),             -- '订单处理', '退货流程', '客户咨询'
  version VARCHAR(50) DEFAULT '1.0',
  language VARCHAR(10) DEFAULT 'zh', -- 'zh', 'en'
  translation_pair_id INTEGER,       -- 关联的翻译版本ID
  content JSONB NOT NULL,            -- 结构化SOP内容
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'archived'
  created_by INTEGER REFERENCES sop_users(id),
  approved_by INTEGER REFERENCES sop_users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. SOP内容块表（用于向量搜索）
CREATE TABLE IF NOT EXISTS sop_content_blocks (
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

-- 6. 问答历史表
CREATE TABLE IF NOT EXISTS sop_qa_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES sop_users(id),
  username VARCHAR(100),
  user_language VARCHAR(10),         -- 'zh', 'en'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  matched_sop_ids INTEGER[],         -- 匹配到的SOP ID数组
  confidence_score FLOAT,            -- 匹配置信度
  feedback VARCHAR(50),              -- 'helpful', 'not_helpful', null
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. 审批记录表
CREATE TABLE IF NOT EXISTS sop_approvals (
  id SERIAL PRIMARY KEY,
  sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
  change_type VARCHAR(50),           -- 'new', 'update', 'delete'
  old_content JSONB,                 -- 修改前内容
  new_content JSONB,                 -- 修改后内容
  ai_suggestions JSONB,              -- AI建议
  requested_by INTEGER REFERENCES sop_users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by INTEGER REFERENCES sop_users(id),
  review_comment TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. 分析统计表（缓存）
CREATE TABLE IF NOT EXISTS sop_analytics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(100),          -- 'top_questions', 'department_usage', 'missing_topics'
  metric_data JSONB NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_sop_documents_status ON sop_documents(status);
CREATE INDEX IF NOT EXISTS idx_sop_documents_uploaded_by ON sop_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_sops_status ON sops(status);
CREATE INDEX IF NOT EXISTS idx_sops_department ON sops(department);
CREATE INDEX IF NOT EXISTS idx_sops_language ON sops(language);
CREATE INDEX IF NOT EXISTS idx_sops_created_by ON sops(created_by);

CREATE INDEX IF NOT EXISTS idx_sop_content_blocks_sop_id ON sop_content_blocks(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_content_blocks_embedding ON sop_content_blocks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_sop_qa_history_user ON sop_qa_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_qa_history_date ON sop_qa_history(created_at);

CREATE INDEX IF NOT EXISTS idx_sop_approvals_status ON sop_approvals(status);
CREATE INDEX IF NOT EXISTS idx_sop_approvals_requested_by ON sop_approvals(requested_by);

CREATE INDEX IF NOT EXISTS idx_sop_sessions_token ON sop_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sop_sessions_expires ON sop_sessions(expires_at);

-- 插入默认管理员账号（密码: admin123）
INSERT INTO sop_users (username, email, password_hash, role, department, language)
VALUES (
  'admin',
  'admin@arizon.com.au',
  '$2b$10$rKZqZ8vZ5xQxZ5xZ5xZ5xO7Z5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x',  -- admin123
  'admin',
  'IT',
  'zh'
) ON CONFLICT (username) DO NOTHING;

-- 完成提示
SELECT 'SOP数据库表创建完成！' AS message;


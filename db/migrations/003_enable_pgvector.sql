-- 启用pgvector扩展
-- 注意：Neon数据库需要在控制台中先启用pgvector扩展

-- 如果扩展已经启用，这个命令会成功
-- 如果没有启用，需要在Neon控制台操作
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证扩展已安装
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 确保embedding列存在且使用正确的维度
-- text-embedding-ada-002 使用 1536 维度
-- text-embedding-3-small 使用 1536 维度
-- text-embedding-3-large 使用 3072 维度

-- 如果需要修改现有列的维度
ALTER TABLE sop_content_blocks 
  ALTER COLUMN embedding TYPE vector(1536);

-- 创建向量索引以加速搜索
-- HNSW索引比IVFFlat更快更准确
DROP INDEX IF EXISTS idx_sop_content_blocks_embedding;
CREATE INDEX idx_sop_content_blocks_embedding 
  ON sop_content_blocks 
  USING hnsw (embedding vector_cosine_ops);

-- 添加一个标记列，标识哪些内容块已经生成了嵌入
ALTER TABLE sop_content_blocks 
  ADD COLUMN IF NOT EXISTS embedding_generated BOOLEAN DEFAULT FALSE;

-- 添加嵌入生成时间戳
ALTER TABLE sop_content_blocks 
  ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP;

COMMENT ON COLUMN sop_content_blocks.embedding IS 'OpenAI text-embedding-ada-002 生成的1536维向量';
COMMENT ON COLUMN sop_content_blocks.embedding_generated IS '标记是否已生成向量嵌入';
COMMENT ON INDEX idx_sop_content_blocks_embedding IS 'HNSW索引用于快速向量相似度搜索';


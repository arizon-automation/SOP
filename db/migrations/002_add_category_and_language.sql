-- 添加分类树和语言切换支持

-- 添加category_id字段到sops表
ALTER TABLE sops ADD COLUMN IF NOT EXISTS category_id VARCHAR(100);

-- 添加supervisor_analysis字段（存储AI监督者的分析结果）
ALTER TABLE sops ADD COLUMN IF NOT EXISTS supervisor_analysis JSONB;

-- 添加approval_status字段
ALTER TABLE sops ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
-- 可选值: pending, approved, rejected

-- 添加approved_notes字段（批准/拒绝时的备注）
ALTER TABLE sops ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- 为sop_documents添加supervisor_analysis字段
ALTER TABLE sop_documents ADD COLUMN IF NOT EXISTS supervisor_analysis JSONB;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sops_category_id ON sops(category_id);
CREATE INDEX IF NOT EXISTS idx_sops_approval_status ON sops(approval_status);
CREATE INDEX IF NOT EXISTS idx_sops_language ON sops(language);
CREATE INDEX IF NOT EXISTS idx_sops_department_category ON sops(department, category);

-- 创建分类统计视图
CREATE OR REPLACE VIEW sop_category_stats AS
SELECT 
  category_id,
  department,
  category,
  language,
  COUNT(*) as sop_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_count
FROM sops
WHERE category_id IS NOT NULL
GROUP BY category_id, department, category, language;

-- 添加注释
COMMENT ON COLUMN sops.category_id IS 'Category tree node ID (e.g., warehouse-receiving)';
COMMENT ON COLUMN sops.supervisor_analysis IS 'AI supervisor analysis result (JSON)';
COMMENT ON COLUMN sops.approval_status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN sops.approval_notes IS 'Notes from approver when approving/rejecting';


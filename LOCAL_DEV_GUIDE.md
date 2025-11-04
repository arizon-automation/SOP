# 本地开发指南
## 如何在本地测试文档上传功能

---

## 🎯 本地 vs Vercel 的区别

### 本地开发环境
- ✅ **文件存储**：保存在本地 `uploads/` 文件夹
- ✅ **无需配置Vercel Blob**：直接可用
- ✅ **文件访问**：通过 `/uploads/filename` 路径访问
- ✅ **快速测试**：不依赖外部服务

### Vercel生产环境
- ✅ **文件存储**：自动使用Vercel Blob云存储
- ✅ **自动检测**：系统自动检测环境并切换
- ✅ **全球CDN**：文件通过CDN加速访问
- ✅ **无需代码修改**：同一套代码自动适配

---

## 🚀 快速开始（本地测试）

### Step 1: 安装依赖

```powershell
cd "C:\Users\Roy\Desktop\Arizon Automation\SOP"
npm install
```

### Step 2: 配置环境变量

创建 `.env.local` 文件（如果还没有）：

```env
# 数据库（必需）
DATABASE_URL="postgresql://user:pass@xxx.neon.tech/main?sslmode=require"

# OpenAI API（暂时可以不配置，文档上传功能用不到）
OPENAI_API_KEY="sk-xxx"

# 本地开发不需要配置 BLOB_READ_WRITE_TOKEN
```

### Step 3: 运行数据库迁移

```powershell
npm run db:migrate
```

### Step 4: 启动开发服务器

```powershell
npm run dev
```

### Step 5: 测试文档上传

1. 打开浏览器：http://localhost:3000
2. 登录：`admin@arizon.com.au` / `admin123`
3. 点击"文档管理"
4. 点击"上传文档"
5. 拖放或选择PDF/Word文件
6. 点击"开始上传"

---

## 📁 本地文件存储

### 文件保存位置

上传的文件保存在：
```
C:\Users\Roy\Desktop\Arizon Automation\SOP\uploads\
```

### 文件命名规则

```
{timestamp}-{random}-{原文件名}.{扩展名}

示例：
1730736000000-a1b2c3-company-sop.pdf
```

### 查看上传的文件

```powershell
# 在项目根目录
ls uploads/
```

---

## 🔄 环境自动检测逻辑

### 检测代码（lib/storage.ts）

```typescript
function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.BLOB_READ_WRITE_TOKEN;
}
```

### 行为说明

| 环境 | 检测方式 | 存储方式 | URL格式 |
|------|---------|---------|---------|
| 本地 | 无 `VERCEL` 或 `BLOB_READ_WRITE_TOKEN` | 本地文件系统 | `/uploads/filename` |
| Vercel | 有 `VERCEL` 或 `BLOB_READ_WRITE_TOKEN` | Vercel Blob | `https://xxx.vercel-storage.com/...` |

---

## 🧪 测试场景

### 场景1：上传PDF文件

1. 准备一个测试PDF（小于10MB）
2. 访问 http://localhost:3000/documents/upload
3. 拖放PDF文件
4. 填写文档标题（可选）
5. 点击"开始上传"
6. 查看 `uploads/` 文件夹，应该有新文件

### 场景2：上传Word文件

1. 准备一个Word文档（.doc或.docx）
2. 重复上传步骤
3. 验证文件保存成功

### 场景3：查看文档列表

1. 访问 http://localhost:3000/documents
2. 应该看到刚上传的文档
3. 点击"查看详情"

### 场景4：下载文件

1. 在文档详情页
2. 点击"预览文档"或"下载文档"
3. 应该能正常打开/下载文件

### 场景5：删除文档

1. 在文档详情页
2. 点击"删除文档"
3. 确认删除
4. 验证数据库记录已删除
5. 本地文件可能仍存在（需要手动清理）

---

## 🐛 常见问题

### 问题1: 上传后看不到文件

**原因**: 本地 `uploads/` 目录未创建

**解决**: 
```powershell
mkdir uploads
```

或者系统会自动创建

### 问题2: 文件无法访问

**原因**: Next.js配置问题

**解决**: 检查 `next.config.ts` 中的 `rewrites` 配置：
```typescript
async rewrites() {
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  }
  return [];
}
```

### 问题3: 数据库连接失败

**原因**: `DATABASE_URL` 未配置或错误

**解决**: 
1. 检查 `.env.local` 文件
2. 验证Neon数据库连接字符串
3. 确保包含 `?sslmode=require`

### 问题4: 上传大文件失败

**原因**: 文件超过10MB限制

**解决**: 
在 `next.config.ts` 中调整：
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '20mb', // 调整为20MB
  },
},
```

---

## 📊 数据库检查

### 查看已上传文档

在Neon SQL Editor中执行：

```sql
SELECT 
  id,
  title,
  file_type,
  file_size,
  status,
  uploaded_at
FROM sop_documents
ORDER BY uploaded_at DESC;
```

### 清空测试数据

```sql
-- 谨慎操作！
DELETE FROM sop_documents;
```

---

## 🚢 部署到Vercel

### Step 1: 配置Vercel Blob

1. 访问 https://vercel.com
2. 进入你的项目
3. 点击 **Storage** → **Create Database** → **Blob**
4. 创建Blob Store
5. 复制 `BLOB_READ_WRITE_TOKEN`

### Step 2: 添加环境变量

在Vercel项目设置中添加：

```
DATABASE_URL = postgresql://...
OPENAI_API_KEY = sk-...
BLOB_READ_WRITE_TOKEN = vercel_blob_...
SESSION_SECRET = your-random-secret
```

### Step 3: 部署

```powershell
git add .
git commit -m "feat: add document upload feature"
git push
```

Vercel会自动部署，文件将自动保存到Vercel Blob！

---

## 🎉 功能特性总结

### ✅ 已实现

- [x] 文件拖放上传
- [x] 文件类型验证（PDF, Word）
- [x] 文件大小限制（10MB）
- [x] 上传进度显示
- [x] 文档列表展示
- [x] 文档详情查看
- [x] 文件预览/下载
- [x] 文档删除
- [x] 本地/Vercel自动切换
- [x] 数据库存储

### ⏳ 待开发（Phase 2）

- [ ] PDF文本提取
- [ ] Word文本提取
- [ ] AI流程识别
- [ ] 生成结构化SOP
- [ ] 中英文翻译

---

## 📝 开发建议

### 调试技巧

1. **查看控制台日志**
   - 浏览器控制台（F12）
   - 服务器终端输出

2. **检查网络请求**
   - F12 → Network 标签
   - 查看 `/api/documents/upload` 请求

3. **验证文件保存**
   ```powershell
   ls uploads/
   ```

4. **查看数据库记录**
   - 在Neon控制台执行SQL查询

---

**准备好测试了吗？** 

执行 `npm run dev` 然后访问 http://localhost:3000 开始测试！🚀


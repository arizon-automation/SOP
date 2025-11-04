# 图片提取问题修复说明

## 问题描述
用户上传PDF文档后，最终生成的SOP中没有显示图片。

## 根本原因
虽然已经在 `lib/sop/image-extractor.ts` 中实现了PDF图片提取功能，但在文档分析流程中，图片提取步骤被遗漏了：

1. **冲突分析流程** (`app/api/documents/[id]/analyze-conflicts/route.ts`)
   - 只调用了 `parseDocument` 和 `analyzeDocument`
   - **没有调用 `extractImages`**
   - 导致图片信息没有被保存到 `parsed_content` 中

2. **合并流程** (`app/api/documents/[id]/merge/route.ts`)
   - 从 `parsed_content` 中读取图片
   - 但如果冲突分析时没有提取图片，这里就拿不到图片数据

## 修复内容

### 1. 修复冲突分析流程 (`analyze-conflicts/route.ts`)
```typescript
// 添加导入
import { extractImages } from '@/lib/sop/image-extractor';
import { analyzeDocumentWithChunking } from '@/lib/sop/content-chunker';

// 在文档解析前提取图片
const { images, textWithPlaceholders } = await extractImages(
  document.file_url, 
  document.file_type
);

// 使用带占位符的文本（如果有）
let rawContent: string;
if (textWithPlaceholders) {
  rawContent = textWithPlaceholders;
} else {
  rawContent = await parseDocument(document.file_url, document.file_type);
}

// 使用分块处理支持长文档
const parsedSOP = await analyzeDocumentWithChunking(cleanedContent);

// 保存图片信息到数据库
await query(
  `UPDATE sop_documents 
   SET parsed_content = $1, raw_content = $2 
   WHERE id = $3`,
  [JSON.stringify({
    sop: parsedSOP,
    images, // 保存图片数组
    conflicts: conflictAnalysis,
  }), cleanedContent, documentId]
);
```

### 2. 修复合并流程 (`merge/route.ts`)
```typescript
// 从新文档和现有SOP中获取图片
const newImages = document.parsed_content?.images || [];
const existingImages = existingSOP.content.images || [];

// 合并图片列表
const allImages = [...existingImages, ...newImages];

// 更新描述
if (allImages.length > 0) {
  mergedSOP.description = (mergedSOP.description || '').replace(
    /\n\n📷 本流程包含 \d+ 张指导图片/g, 
    ''
  );
  mergedSOP.description += `\n\n📷 本流程包含 ${allImages.length} 张指导图片`;
}

// 保存时包含图片
const sopContentZh = {
  ...mergedSOP,
  images: allImages,
};

const sopContentEn = {
  ...mergedSOPEn,
  images: allImages,
};
```

## 完整的文档处理流程

现在整个流程是这样的：

1. **用户上传文档**
   - 文档保存到 `sop_documents` 表
   - 状态：`uploaded`

2. **点击"智能分析 & 生成SOP"**
   - 调用 `/api/documents/[id]/analyze-conflicts`
   - 提取图片（Word或PDF）✅
   - 解析文档内容（使用带占位符的文本）✅
   - AI分析文档结构 ✅
   - 检测与现有SOP的冲突 ✅
   - **保存图片信息到 `parsed_content`** ✅

3. **如果有冲突 - 选择合并**
   - 调用 `/api/documents/[id]/merge`
   - 读取新文档和现有SOP的图片 ✅
   - 合并图片列表 ✅
   - 合并SOP内容 ✅
   - 保存合并后的SOP（包含图片）✅

4. **如果没有冲突 - 创建新SOP**
   - 调用 `/api/documents/[id]/parse`
   - 调用 `generateSOPFromDocument`
   - 提取图片 ✅
   - 生成中英文SOP（包含图片）✅

## 测试步骤

1. 上传一个包含图片的PDF文档
2. 点击"智能分析 & 生成SOP"
3. 查看控制台日志，应该显示：
   ```
   🖼️ 提取文档图片...
   🔍 正在分析PDF图片...
   📄 找到 X 个图片对象
   ✅ 从PDF提取了 X 张图片
      找到 X 张图片
   ```
4. 生成的SOP详情页应该显示图片（在对应的步骤中）
5. 描述中应该显示："📷 本流程包含 X 张指导图片"

## 相关文件
- `app/api/documents/[id]/analyze-conflicts/route.ts` - 修复图片提取
- `app/api/documents/[id]/merge/route.ts` - 修复图片合并
- `lib/sop/image-extractor.ts` - 图片提取工具（已有PDF支持）
- `lib/sop/sop-generator.ts` - SOP生成器（已有图片提取）

## 注意事项
- PDF图片提取使用 `pdf-lib` 库
- Word图片提取使用 `mammoth` 库内置功能
- 图片会自动上传到Vercel Blob存储（生产环境）或本地存储（开发环境）
- 每张图片都有唯一的文件名和索引
- 图片通过 `imageIndices` 数组关联到具体的SOP步骤


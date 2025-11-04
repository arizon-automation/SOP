/**
 * 分析文档冲突API
 * 检测新文档与现有SOP的重复和冲突
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { parseDocument, cleanText } from '@/lib/sop/document-parser';
import { analyzeDocument } from '@/lib/sop/ai-analyzer';
import { detectConflicts } from '@/lib/sop/conflict-detector';
import { extractImages } from '@/lib/sop/image-extractor';
import { analyzeDocumentWithChunking } from '@/lib/sop/content-chunker';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const documentId = parseInt(params.id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: '无效的文档ID' },
        { status: 400 }
      );
    }

    // 1. 获取文档信息
    const docResult = await query(
      `SELECT * FROM sop_documents WHERE id = $1`,
      [documentId]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    const document = docResult.rows[0];

    console.log(`🔍 分析文档 ${documentId} 的冲突...`);

    // 2. 提取图片
    console.log('🖼️ 提取文档图片...');
    const { images, textWithPlaceholders } = await extractImages(document.file_url, document.file_type);
    console.log(`   找到 ${images.length} 张图片`);

    // 3. 解析新文档
    let rawContent: string;
    if (textWithPlaceholders) {
      rawContent = textWithPlaceholders;
      console.log('   使用带图片占位符的文本');
    } else {
      rawContent = await parseDocument(document.file_url, document.file_type);
    }
    const cleanedContent = cleanText(rawContent);

    // 4. AI分析文档结构（使用分块处理支持长文档）
    const parsedSOP = await analyzeDocumentWithChunking(cleanedContent);
    
    // 将图片信息添加到SOP元数据
    if (images.length > 0) {
      parsedSOP.description = (parsedSOP.description || '') + 
        `\n\n📷 本流程包含 ${images.length} 张指导图片`;
    }

    // 5. 检测冲突
    const conflictAnalysis = await detectConflicts(parsedSOP, user.id);

    // 6. 保存分析结果到文档（包含图片信息）
    await query(
      `UPDATE sop_documents 
       SET parsed_content = $1, raw_content = $2, updated_at = NOW() 
       WHERE id = $3`,
      [JSON.stringify({
        sop: parsedSOP,
        images, // 保存图片数组
        conflicts: conflictAnalysis,
      }), cleanedContent, documentId]
    );

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
      },
      parsedSOP,
      images, // 返回图片信息
      conflictAnalysis,
    });
  } catch (error: any) {
    console.error('冲突分析错误:', error);

    return NextResponse.json(
      { error: error.message || '冲突分析失败' },
      { status: 500 }
    );
  }
}


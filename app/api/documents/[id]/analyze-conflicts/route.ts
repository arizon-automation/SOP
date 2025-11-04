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

    // 2. 解析新文档
    const rawContent = await parseDocument(document.file_url, document.file_type);
    const cleanedContent = cleanText(rawContent);

    // 3. AI分析文档结构
    const parsedSOP = await analyzeDocument(cleanedContent);

    // 4. 检测冲突
    const conflictAnalysis = await detectConflicts(parsedSOP, user.id);

    // 5. 保存分析结果到文档
    await query(
      `UPDATE sop_documents 
       SET parsed_content = $1, updated_at = NOW() 
       WHERE id = $2`,
      [JSON.stringify({
        sop: parsedSOP,
        conflicts: conflictAnalysis,
      }), documentId]
    );

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
      },
      parsedSOP,
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


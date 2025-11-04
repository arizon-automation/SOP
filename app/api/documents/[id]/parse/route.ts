/**
 * 文档解析API
 * 触发AI分析并生成SOP
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateSOPFromDocument } from '@/lib/sop/sop-generator';

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

    console.log(`📄 开始解析文档 ${documentId}...`);

    // 生成SOP（这个过程可能需要30-60秒）
    const result = await generateSOPFromDocument(documentId, user.id);

    return NextResponse.json({
      success: true,
      message: 'SOP生成成功',
      sop: {
        zh: {
          id: result.sopZh.id,
          title: result.sopZh.title,
          department: result.sopZh.department,
          category: result.sopZh.category,
        },
        en: {
          id: result.sopEn.id,
          title: result.sopEn.title,
          department: result.sopEn.department,
          category: result.sopEn.category,
        },
      },
      steps: result.parsedContent.steps.length,
    });
  } catch (error: any) {
    console.error('文档解析错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '解析失败: ' + error.message },
      { status: 500 }
    );
  }
}


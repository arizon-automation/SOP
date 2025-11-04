/**
 * 单个SOP API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const sopId = parseInt(params.id);

    if (isNaN(sopId)) {
      return NextResponse.json(
        { error: '无效的SOP ID' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        s.*,
        u.username as created_by_name,
        a.username as approved_by_name,
        d.title as document_title,
        d.file_url as document_url
       FROM sops s
       LEFT JOIN sop_users u ON s.created_by = u.id
       LEFT JOIN sop_users a ON s.approved_by = a.id
       LEFT JOIN sop_documents d ON s.document_id = d.id
       WHERE s.id = $1`,
      [sopId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'SOP不存在' },
        { status: 404 }
      );
    }

    const sop = result.rows[0];

    // 获取翻译版本
    let translationPair = null;
    if (sop.translation_pair_id) {
      const pairResult = await query(
        `SELECT id, title, language FROM sops WHERE id = $1`,
        [sop.translation_pair_id]
      );
      if (pairResult.rows.length > 0) {
        translationPair = pairResult.rows[0];
      }
    }

    return NextResponse.json({
      sop,
      translationPair,
    });
  } catch (error: any) {
    console.error('获取SOP详情错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '获取SOP详情失败' },
      { status: 500 }
    );
  }
}


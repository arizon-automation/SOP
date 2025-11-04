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

    // 获取SOP详情
    const sopResult = await query(
      `SELECT 
        s.*,
        u.username as created_by_name,
        d.title as document_title,
        d.file_url as document_url
       FROM sops s
       LEFT JOIN sop_users u ON s.created_by = u.id
       LEFT JOIN sop_documents d ON s.document_id = d.id
       WHERE s.id = $1`,
      [sopId]
    );

    if (sopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'SOP不存在' },
        { status: 404 }
      );
    }

    const sop = sopResult.rows[0];

    // 获取对应的翻译版本
    let translationPair = null;
    if (sop.translation_pair_id) {
      const translationResult = await query(
        `SELECT id, title, language FROM sops WHERE id = $1`,
        [sop.translation_pair_id]
      );
      if (translationResult.rows.length > 0) {
        translationPair = translationResult.rows[0];
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

export async function DELETE(
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

    // 检查SOP是否存在，并获取翻译对
    const checkResult = await query(
      `SELECT id, translation_pair_id FROM sops WHERE id = $1`,
      [sopId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'SOP不存在' },
        { status: 404 }
      );
    }

    const sop = checkResult.rows[0];
    const translationPairId = sop.translation_pair_id;

    // 删除当前SOP
    await query(`DELETE FROM sops WHERE id = $1`, [sopId]);

    // 如果有翻译对，也删除翻译对（可选，或者只删除关联）
    if (translationPairId) {
      await query(
        `UPDATE sops SET translation_pair_id = NULL WHERE id = $1`,
        [translationPairId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SOP删除成功',
      deletedPairId: translationPairId,
    });
  } catch (error: any) {
    console.error('删除SOP错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '删除SOP失败' },
      { status: 500 }
    );
  }
}

/**
 * 单个文档API
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
    const documentId = parseInt(params.id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: '无效的文档ID' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        d.*,
        u.username as uploaded_by_name
       FROM sop_documents d
       LEFT JOIN sop_users u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      document: result.rows[0],
    });
  } catch (error: any) {
    console.error('获取文档详情错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '获取文档详情失败' },
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
    const documentId = parseInt(params.id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: '无效的文档ID' },
        { status: 400 }
      );
    }

    // 检查文档是否存在
    const checkResult = await query(
      `SELECT * FROM sop_documents WHERE id = $1`,
      [documentId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 先删除关联的SOP（因为数据库设置的是ON DELETE SET NULL，不是CASCADE）
    await query(
      `DELETE FROM sops WHERE document_id = $1`,
      [documentId]
    );

    // 再删除文档本身
    await query(
      `DELETE FROM sop_documents WHERE id = $1`,
      [documentId]
    );

    return NextResponse.json({
      success: true,
      message: '文档及其关联的SOP删除成功',
    });
  } catch (error: any) {
    console.error('删除文档错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '删除文档失败' },
      { status: 500 }
    );
  }
}


/**
 * 文档列表API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询
    let sql = `
      SELECT 
        d.*,
        u.username as uploaded_by_name
      FROM sop_documents d
      LEFT JOIN sop_users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY d.uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // 执行查询
    const result = await query(sql, params);

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM sop_documents WHERE 1=1 ${
        status ? 'AND status = $1' : ''
      }`,
      status ? [status] : []
    );

    return NextResponse.json({
      documents: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('获取文档列表错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    );
  }
}


/**
 * SOP列表API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || 'approved';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询
    let sql = `
      SELECT 
        s.*,
        u.username as created_by_name,
        d.title as document_title
      FROM sops s
      LEFT JOIN sop_users u ON s.created_by = u.id
      LEFT JOIN sop_documents d ON s.document_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (language) {
      sql += ` AND s.language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    if (department) {
      sql += ` AND s.department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (status) {
      sql += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM sops WHERE status = $1 ${
        language ? 'AND language = $2' : ''
      } ${department ? `AND department = $${language ? 3 : 2}` : ''}`,
      language && department ? [status, language, department] : 
      language ? [status, language] :
      department ? [status, department] :
      [status]
    );

    return NextResponse.json({
      sops: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('获取SOP列表错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '获取SOP列表失败' },
      { status: 500 }
    );
  }
}


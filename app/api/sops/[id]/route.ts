/**
 * SOP详情API - 支持GET, PATCH, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { translateSOP } from '@/lib/sop/ai-analyzer';
import type { PoolClient } from 'pg';

// GET - 获取SOP详情
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
        d.title as document_title,
        d.file_url as document_url
       FROM sops s
       LEFT JOIN sop_users u ON s.created_by = u.id
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

    // 获取翻译版本（如果有）
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

// PATCH - 更新SOP
export async function PATCH(
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

    const body = await request.json();
    const { title, description, department, category, steps } = body;

    // 验证必填字段
    if (!title || !department || !category || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    console.log(`📝 更新SOP ${sopId}...`);

    // 获取当前SOP信息
    const currentSOPResult = await query(
      `SELECT * FROM sops WHERE id = $1`,
      [sopId]
    );

    if (currentSOPResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'SOP不存在' },
        { status: 404 }
      );
    }

    const currentSOP = currentSOPResult.rows[0];
    
    // 构建更新后的内容
    const updatedContent = {
      ...currentSOP.content,
      title,
      description,
      department,
      category,
      steps,
    };

    // 计算新版本号
    const newVersion = (parseFloat(currentSOP.version) + 0.1).toFixed(1);

    // 在事务中更新
    const result = await transaction(async (client: PoolClient) => {
      // 更新当前SOP
      const updateResult = await client.query(
        `UPDATE sops 
         SET title = $1,
             description = $2,
             department = $3,
             category = $4,
             content = $5,
             version = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          title,
          description || '',
          department,
          category,
          JSON.stringify(updatedContent),
          newVersion,
          sopId,
        ]
      );

      const updatedSOP = updateResult.rows[0];

      // 如果有翻译版本，也需要更新（使用AI翻译）
      if (currentSOP.translation_pair_id) {
        console.log(`🌏 翻译更新后的SOP...`);
        const targetLang = currentSOP.language === 'zh' ? 'en' : 'zh';
        const translatedSOP = await translateSOP({
          title,
          description,
          department,
          category,
          steps,
        }, targetLang);

        const translatedContent = {
          ...translatedSOP,
          images: currentSOP.content.images || [],
        };

        await client.query(
          `UPDATE sops 
           SET title = $1,
               description = $2,
               department = $3,
               category = $4,
               content = $5,
               version = $6,
               updated_at = NOW()
           WHERE id = $7`,
          [
            translatedSOP.title,
            translatedSOP.description || '',
            translatedSOP.department,
            translatedSOP.category,
            JSON.stringify(translatedContent),
            newVersion,
            currentSOP.translation_pair_id,
          ]
        );
      }

      // 删除旧的内容块
      await client.query(
        `DELETE FROM sop_content_blocks WHERE sop_id = $1`,
        [sopId]
      );

      // 重新创建内容块
      for (const step of steps) {
        const contentText = `${step.title}\n${step.description}`;
        
        await client.query(
          `INSERT INTO sop_content_blocks 
           (sop_id, block_type, content, content_zh, content_en, block_order, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sopId,
            'step',
            contentText,
            currentSOP.language === 'zh' ? contentText : '',
            currentSOP.language === 'en' ? contentText : '',
            step.order,
            JSON.stringify({
              responsible: step.responsible,
              conditions: step.conditions,
              notes: step.notes,
            }),
          ]
        );
      }

      return updatedSOP;
    });

    console.log(`✅ SOP更新完成！新版本: ${newVersion}`);

    return NextResponse.json({
      success: true,
      sop: result,
      message: 'SOP更新成功',
    });
  } catch (error: any) {
    console.error('更新SOP错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '更新SOP失败: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - 删除SOP
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

    console.log(`🗑️ 删除SOP ${sopId}...`);

    // 获取SOP信息（用于清除translation_pair_id）
    const sopResult = await query(
      `SELECT translation_pair_id FROM sops WHERE id = $1`,
      [sopId]
    );

    if (sopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'SOP不存在' },
        { status: 404 }
      );
    }

    const sop = sopResult.rows[0];

    // 在事务中执行删除操作
    await transaction(async (client: PoolClient) => {
      // 如果有翻译对，清除对方的translation_pair_id
      if (sop.translation_pair_id) {
        await client.query(
          `UPDATE sops SET translation_pair_id = NULL WHERE id = $1`,
          [sop.translation_pair_id]
        );
      }

      // 删除内容块
      await client.query(
        `DELETE FROM sop_content_blocks WHERE sop_id = $1`,
        [sopId]
      );

      // 删除SOP
      await client.query(
        `DELETE FROM sops WHERE id = $1`,
        [sopId]
      );
    });

    console.log(`✅ SOP ${sopId} 已删除`);

    return NextResponse.json({
      success: true,
      message: 'SOP删除成功',
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

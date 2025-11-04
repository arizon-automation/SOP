/**
 * 合并SOP API
 * 将新文档与现有SOP合并
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { mergeSOPs } from '@/lib/sop/sop-merger';
import { translateSOP, type ParsedSOP } from '@/lib/sop/ai-analyzer';
import type { PoolClient } from 'pg';

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

    const body = await request.json();
    const { targetSOPId, mergeStrategy } = body;

    if (!targetSOPId) {
      return NextResponse.json(
        { error: '缺少目标SOP ID' },
        { status: 400 }
      );
    }

    console.log(`🔀 开始合并: 文档${documentId} → SOP${targetSOPId}`);

    // 1. 获取新文档的解析结果
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
    const newSOP: ParsedSOP = document.parsed_content?.sop;

    if (!newSOP) {
      return NextResponse.json(
        { error: '文档尚未解析，请先分析文档' },
        { status: 400 }
      );
    }

    // 2. 获取现有SOP
    const existingSOPResult = await query(
      `SELECT * FROM sops WHERE id = $1 AND language = 'zh'`,
      [targetSOPId]
    );

    if (existingSOPResult.rows.length === 0) {
      return NextResponse.json(
        { error: '目标SOP不存在' },
        { status: 404 }
      );
    }

    const existingSOP = existingSOPResult.rows[0];
    const existingContent: ParsedSOP = {
      title: existingSOP.title,
      department: existingSOP.department,
      category: existingSOP.category,
      description: existingSOP.description,
      steps: existingSOP.content.steps || [],
    };

    // 3. 合并SOP
    const mergedSOP = await mergeSOPs(newSOP, existingContent, {
      strategy: mergeStrategy || 'smart_combine',
      resolveConflicts: true,
      preserveAllSteps: true,
    });

    // 4. 翻译成英文
    console.log('🌏 翻译合并后的SOP...');
    const mergedSOPEn = await translateSOP(mergedSOP, 'en');

    // 5. 更新数据库（使用事务）
    console.log('💾 保存合并后的SOP...');
    const result = await transaction(async (client: PoolClient) => {
      // 更新中文版SOP
      const updateZhResult = await client.query(
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
          mergedSOP.title,
          mergedSOP.description || '',
          mergedSOP.department,
          mergedSOP.category,
          JSON.stringify(mergedSOP),
          `${parseFloat(existingSOP.version) + 0.1}`, // 版本号递增
          targetSOPId,
        ]
      );

      const updatedZh = updateZhResult.rows[0];

      // 更新英文版SOP（如果存在）
      if (existingSOP.translation_pair_id) {
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
            mergedSOPEn.title,
            mergedSOPEn.description || '',
            mergedSOPEn.department,
            mergedSOPEn.category,
            JSON.stringify(mergedSOPEn),
            `${parseFloat(existingSOP.version) + 0.1}`,
            existingSOP.translation_pair_id,
          ]
        );
      }

      // 删除旧的内容块
      await client.query(
        `DELETE FROM sop_content_blocks WHERE sop_id = $1`,
        [targetSOPId]
      );

      // 创建新的内容块
      for (const step of mergedSOP.steps) {
        const contentZh = `${step.title}\n${step.description}`;
        const stepEn = mergedSOPEn.steps[step.order - 1];
        const contentEn = stepEn ? `${stepEn.title}\n${stepEn.description}` : contentZh;

        await client.query(
          `INSERT INTO sop_content_blocks 
           (sop_id, block_type, content, content_zh, content_en, block_order, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            targetSOPId,
            'step',
            contentZh,
            contentZh,
            contentEn,
            step.order,
            JSON.stringify({
              responsible: step.responsible,
              conditions: step.conditions,
              notes: step.notes,
            }),
          ]
        );
      }

      return { updatedZh };
    });

    // 6. 更新文档状态
    await query(
      `UPDATE sop_documents 
       SET status = 'parsed', updated_at = NOW() 
       WHERE id = $1`,
      [documentId]
    );

    console.log('✅ SOP合并完成！');

    return NextResponse.json({
      success: true,
      message: 'SOP合并成功',
      sop: result.updatedZh,
      mergedSteps: mergedSOP.steps.length,
      mergeNotes: (mergedSOP as any).mergeNotes,
    });
  } catch (error: any) {
    console.error('合并SOP错误:', error);

    return NextResponse.json(
      { error: error.message || '合并失败' },
      { status: 500 }
    );
  }
}


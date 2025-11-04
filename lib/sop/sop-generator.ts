/**
 * SOP生成工具
 * 整合文档解析、AI分析和翻译功能
 */

import { parseDocument, cleanText } from './document-parser';
import { analyzeDocument, translateSOP, type ParsedSOP } from './ai-analyzer';
import { query, transaction } from '@/lib/db';
import type { PoolClient } from 'pg';

export interface GenerateSOPResult {
  sopZh: any; // 中文版SOP
  sopEn: any; // 英文版SOP
  rawContent: string;
  parsedContent: ParsedSOP;
}

/**
 * 从文档生成SOP（包含中英文双语版本）
 */
export async function generateSOPFromDocument(
  documentId: number,
  userId: number
): Promise<GenerateSOPResult> {
  console.log(`🚀 开始为文档 ${documentId} 生成SOP...`);

  try {
    // 1. 获取文档信息
    const docResult = await query(
      `SELECT * FROM sop_documents WHERE id = $1`,
      [documentId]
    );

    if (docResult.rows.length === 0) {
      throw new Error('文档不存在');
    }

    const document = docResult.rows[0];

    // 更新状态为"解析中"
    await query(
      `UPDATE sop_documents SET status = 'parsing', updated_at = NOW() WHERE id = $1`,
      [documentId]
    );

    // 2. 解析文档内容
    console.log('📄 Step 1: 解析文档...');
    const rawContent = await parseDocument(document.file_url, document.file_type);
    const cleanedContent = cleanText(rawContent);

    // 保存原始内容到数据库
    await query(
      `UPDATE sop_documents SET raw_content = $1 WHERE id = $2`,
      [cleanedContent, documentId]
    );

    // 3. AI分析文档结构
    console.log('🤖 Step 2: AI分析...');
    const parsedSOP = await analyzeDocument(cleanedContent);

    // 保存解析结果到数据库
    await query(
      `UPDATE sop_documents SET parsed_content = $1 WHERE id = $2`,
      [JSON.stringify(parsedSOP), documentId]
    );

    // 4. 翻译成英文
    console.log('🌏 Step 3: 翻译成英文...');
    const sopEn = await translateSOP(parsedSOP, 'en');

    // 5. 在事务中创建中英文双语SOP
    console.log('💾 Step 4: 保存SOP到数据库...');
    const result = await transaction(async (client: PoolClient) => {
      // 创建中文版SOP
      const sopZhResult = await client.query(
        `INSERT INTO sops 
         (document_id, title, description, department, category, version, language, content, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          documentId,
          parsedSOP.title,
          parsedSOP.description || '',
          parsedSOP.department,
          parsedSOP.category,
          '1.0',
          'zh',
          JSON.stringify(parsedSOP),
          'approved', // 自动批准
          userId,
        ]
      );

      const sopZh = sopZhResult.rows[0];

      // 创建英文版SOP
      const sopEnResult = await client.query(
        `INSERT INTO sops 
         (document_id, title, description, department, category, version, language, content, status, created_by, translation_pair_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          documentId,
          sopEn.title,
          sopEn.description || '',
          sopEn.department,
          sopEn.category,
          '1.0',
          'en',
          JSON.stringify(sopEn),
          'approved',
          userId,
          sopZh.id, // 关联到中文版
        ]
      );

      const sopEnRow = sopEnResult.rows[0];

      // 更新中文版的translation_pair_id
      await client.query(
        `UPDATE sops SET translation_pair_id = $1 WHERE id = $2`,
        [sopEnRow.id, sopZh.id]
      );

      // 为每个步骤创建内容块（用于向量搜索）
      for (const step of parsedSOP.steps) {
        const contentZh = `${step.title}\n${step.description}`;
        const stepEn = sopEn.steps[step.order - 1];
        const contentEn = stepEn ? `${stepEn.title}\n${stepEn.description}` : contentZh;

        await client.query(
          `INSERT INTO sop_content_blocks 
           (sop_id, block_type, content, content_zh, content_en, block_order, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sopZh.id,
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

      return { sopZh, sopEn: sopEnRow };
    });

    // 6. 更新文档状态为"已解析"
    await query(
      `UPDATE sop_documents SET status = 'parsed', updated_at = NOW() WHERE id = $1`,
      [documentId]
    );

    console.log('✅ SOP生成完成！');
    console.log(`   中文版ID: ${result.sopZh.id}`);
    console.log(`   英文版ID: ${result.sopEn.id}`);

    return {
      sopZh: result.sopZh,
      sopEn: result.sopEn,
      rawContent: cleanedContent,
      parsedContent: parsedSOP,
    };
  } catch (error: any) {
    console.error('❌ SOP生成失败:', error);

    // 更新文档状态为"失败"
    await query(
      `UPDATE sop_documents 
       SET status = 'failed', error_message = $1, updated_at = NOW() 
       WHERE id = $2`,
      [error.message, documentId]
    );

    throw error;
  }
}

export default {
  generateSOPFromDocument,
};


/**
 * 向量语义搜索工具
 * 使用OpenAI embeddings + pgvector实现真正的语义理解
 */

import OpenAI from 'openai';
import { query } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SearchResult {
  sopId: number;
  title: string;
  department: string;
  category: string;
  content: string;
  similarity: number;
  blockOrder: number;
}

/**
 * 使用向量搜索找到语义相关的SOP内容
 * @param question 用户问题
 * @param language 语言 ('zh' | 'en')
 * @param limit 返回结果数量
 * @returns 相关的SOP内容块
 */
export async function vectorSearch(
  question: string,
  language: 'zh' | 'en' = 'zh',
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 向量搜索: "${question}"`);
    
    // 1. 生成问题的向量嵌入
    console.log('   生成问题向量...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
    });

    const questionEmbedding = embeddingResponse.data[0].embedding;
    console.log(`   ✅ 问题向量生成完成 (${questionEmbedding.length}维)`);

    // 2. 在数据库中进行向量相似度搜索
    // 使用余弦相似度（cosine similarity）
    console.log('   搜索相似内容...');
    const searchResult = await query(
      `SELECT 
        cb.sop_id,
        cb.content,
        cb.block_order,
        s.title,
        s.department,
        s.category,
        s.language,
        1 - (cb.embedding <=> $1::vector) as similarity
       FROM sop_content_blocks cb
       JOIN sops s ON cb.sop_id = s.id
       WHERE 
        s.language = $2
        AND cb.embedding IS NOT NULL
       ORDER BY cb.embedding <=> $1::vector
       LIMIT $3`,
      [`[${questionEmbedding.join(',')}]`, language, limit]
    );

    const results: SearchResult[] = searchResult.rows.map(row => ({
      sopId: row.sop_id,
      title: row.title,
      department: row.department,
      category: row.category,
      content: row.content,
      similarity: parseFloat(row.similarity),
      blockOrder: row.block_order,
    }));

    console.log(`   ✅ 找到 ${results.length} 个相关内容块`);
    results.forEach((r, i) => {
      console.log(`      ${i + 1}. ${r.title} (相似度: ${(r.similarity * 100).toFixed(1)}%)`);
    });

    return results;
  } catch (error: any) {
    console.error('❌ 向量搜索失败:', error.message);
    
    // 如果向量搜索失败，抛出错误
    throw new Error(`向量搜索失败: ${error.message}`);
  }
}

/**
 * 检查向量搜索是否可用
 * @returns 是否可以使用向量搜索
 */
export async function isVectorSearchAvailable(): Promise<boolean> {
  try {
    // 检查是否有任何内容块有嵌入
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM sop_content_blocks 
       WHERE embedding IS NOT NULL`
    );

    const count = parseInt(result.rows[0].count);
    return count > 0;
  } catch (error) {
    return false;
  }
}

export default {
  vectorSearch,
  isVectorSearchAvailable,
};


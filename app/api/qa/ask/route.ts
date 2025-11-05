/**
 * AI问答API
 * 使用向量搜索找到相关SOP并生成答案
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { question, language = 'zh' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: '请提供问题' },
        { status: 400 }
      );
    }

    console.log(`💬 用户问题 (${language}): ${question}`);

    // TODO: 未来可以使用向量嵌入进行更精确的语义搜索
    // const embeddingResponse = await openai.embeddings.create({
    //   model: 'text-embedding-ada-002',
    //   input: question,
    // });

    // 1. 从数据库中搜索相关的SOP（使用文本搜索）
    // 首先尝试从content_blocks搜索，如果没有则直接从SOPs表搜索
    let searchResult = await query(
      `SELECT 
        cb.sop_id,
        cb.content,
        cb.block_order,
        s.title,
        s.department,
        s.category,
        s.language,
        s.content as sop_content
       FROM sop_content_blocks cb
       JOIN sops s ON cb.sop_id = s.id
       WHERE 
        s.language = $1
        AND (
          cb.content ILIKE $2
          OR s.title ILIKE $2
          OR s.description ILIKE $2
        )
       ORDER BY 
        CASE 
          WHEN cb.content ILIKE $2 THEN 1
          WHEN s.title ILIKE $2 THEN 2
          ELSE 3
        END
       LIMIT 5`,
      [language, `%${question}%`]
    );

    console.log(`   找到 ${searchResult.rows.length} 个内容块`);

    // 如果没有找到content blocks，直接从SOPs表搜索
    if (searchResult.rows.length === 0) {
      console.log('   尝试直接从SOPs表搜索...');
      searchResult = await query(
        `SELECT 
          s.id as sop_id,
          s.title,
          s.description,
          s.department,
          s.category,
          s.language,
          s.content as sop_content
         FROM sops s
         WHERE 
          s.language = $1
          AND (
            s.title ILIKE $2
            OR s.description ILIKE $2
            OR s.content::text ILIKE $2
          )
         ORDER BY 
          CASE 
            WHEN s.title ILIKE $2 THEN 1
            WHEN s.description ILIKE $2 THEN 2
            ELSE 3
          END
         LIMIT 5`,
        [language, `%${question}%`]
      );
      console.log(`   从SOPs表找到 ${searchResult.rows.length} 个相关SOP`);
    }

    // 3. 如果没有找到相关内容，返回通用回复
    if (searchResult.rows.length === 0) {
      const noResultAnswer = language === 'zh'
        ? `抱歉，我在现有的SOP中没有找到与"${question}"相关的信息。\n\n可能的原因：\n1. 这个流程还没有被记录到SOP中\n2. 可以尝试用不同的关键词提问\n3. 查看SOP列表，看是否有类似的流程\n\n需要帮助创建新的SOP吗？`
        : `Sorry, I couldn't find information related to "${question}" in the existing SOPs.\n\nPossible reasons:\n1. This process hasn't been documented in an SOP yet\n2. Try asking with different keywords\n3. Check the SOP list for similar processes\n\nWould you like help creating a new SOP?`;

      // 记录到问答历史
      await query(
        `INSERT INTO sop_qa_history 
         (user_id, question, answer, language, found_results)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, question, noResultAnswer, language, false]
      );

      return NextResponse.json({
        answer: noResultAnswer,
        relatedSOPs: [],
        foundResults: false,
      });
    }

    // 4. 整理相关的SOP
    const relatedSOPsMap = new Map();
    const contextChunks: string[] = [];

    for (const row of searchResult.rows) {
      if (!relatedSOPsMap.has(row.sop_id)) {
        relatedSOPsMap.set(row.sop_id, {
          id: row.sop_id,
          title: row.title,
          department: row.department,
          category: row.category,
          similarity: 0.85, // 临时固定值，真正的向量搜索会返回相似度
        });
      }

      // 添加到上下文
      if (row.content) {
        // 来自content_blocks
        contextChunks.push(`【${row.title} - ${row.department}】\n${row.content}\n`);
      } else if (row.sop_content) {
        // 来自sops表，提取步骤信息
        try {
          const sopData = typeof row.sop_content === 'string' 
            ? JSON.parse(row.sop_content) 
            : row.sop_content;
          
          const stepsText = sopData.steps?.map((step: any, index: number) => 
            `步骤${index + 1}: ${step.title}\n${step.description}`
          ).join('\n\n') || '';
          
          contextChunks.push(`【${row.title} - ${row.department}】\n${row.description || ''}\n\n${stepsText}\n`);
        } catch (e) {
          console.error('解析SOP内容失败:', e);
          contextChunks.push(`【${row.title} - ${row.department}】\n${row.description || ''}\n`);
        }
      }
    }

    const relatedSOPs = Array.from(relatedSOPsMap.values());
    const context = contextChunks.join('\n---\n\n');

    console.log(`   整理了 ${relatedSOPs.length} 个相关SOP`);

    // 5. 使用GPT生成答案
    const systemPrompt = language === 'zh'
      ? `你是一个专业的SOP助手，帮助员工理解和执行标准操作流程。

基于提供的SOP内容回答用户的问题：
- 准确引用SOP中的信息
- 使用清晰简洁的语言
- 如果涉及多个步骤，使用编号列出
- 指出负责人和关键注意事项
- 如果信息不够完整，诚实说明

回答要专业、友好、易懂。`
      : `You are a professional SOP assistant helping employees understand and execute standard operating procedures.

Answer user questions based on the provided SOP content:
- Accurately cite information from SOPs
- Use clear and concise language
- If multiple steps are involved, list them with numbers
- Point out responsible parties and key notes
- If information is incomplete, be honest about it

Answers should be professional, friendly, and easy to understand.`;

    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `基于以下SOP内容回答问题。

SOP内容：
${context}

用户问题：${question}

请基于上述SOP内容，用${language === 'zh' ? '中文' : '英文'}详细回答。`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = completionResponse.choices[0].message.content || 
      (language === 'zh' ? '抱歉，我无法生成回答。' : 'Sorry, I cannot generate an answer.');

    console.log(`✅ 生成答案完成`);

    // 6. 记录到问答历史
    await query(
      `INSERT INTO sop_qa_history 
       (user_id, question, answer, language, found_results, related_sop_ids)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        question,
        answer,
        language,
        true,
        JSON.stringify(relatedSOPs.map(sop => sop.id)),
      ]
    );

    // 7. 更新分析统计
    await query(
      `INSERT INTO sop_analytics (metric_name, metric_value, metadata)
       VALUES ('qa_question', 1, $1)`,
      [JSON.stringify({
        user_id: user.id,
        question,
        language,
        found_results: true,
        timestamp: new Date().toISOString(),
      })]
    );

    return NextResponse.json({
      answer,
      relatedSOPs,
      foundResults: true,
    });
  } catch (error: any) {
    console.error('AI问答错误:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'AI问答失败: ' + error.message },
      { status: 500 }
    );
  }
}


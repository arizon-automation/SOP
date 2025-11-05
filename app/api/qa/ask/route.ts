/**
 * AI问答API
 * 使用向量搜索找到相关SOP并生成答案
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';
import { vectorSearch, isVectorSearchAvailable } from '@/lib/sop/vector-search';

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

    // 1. 检查向量搜索是否可用
    const vectorSearchEnabled = await isVectorSearchAvailable();
    console.log(`   向量搜索状态: ${vectorSearchEnabled ? '✅ 已启用' : '⚠️  未启用（使用关键词搜索）'}`);

    let searchResults: any[] = [];

    if (vectorSearchEnabled) {
      // 使用向量语义搜索（终极方案！）
      console.log('   🚀 使用向量语义搜索...');
      try {
        const vectorResults = await vectorSearch(question, language, 10);
        searchResults = vectorResults.map(r => ({
          sop_id: r.sopId,
          content: r.content,
          block_order: r.blockOrder,
          title: r.title,
          department: r.department,
          category: r.category,
          similarity: r.similarity,
        }));
      } catch (error: any) {
        console.error('   ⚠️  向量搜索失败，回退到关键词搜索:', error.message);
        // 回退到关键词搜索
      }
    }

    // 如果向量搜索失败或未启用，使用关键词搜索作为备选
    if (searchResults.length === 0) {
      console.log('   📝 使用关键词搜索...');
      
      // 提取关键词
      const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '什么', '怎么', '为什么', '哪里', '谁', '需要'];
      const keywords = question
        .split(/[\s,，。！？、]+/)
        .filter(word => word.length > 1 && !stopWords.includes(word))
        .slice(0, 5);

      console.log(`   关键词: ${keywords.join(', ')}`);

      if (keywords.length > 0) {
        const searchPattern = keywords.map(kw => `%${kw}%`);
        const searchConditions = keywords.map((_, index) => 
          `(cb.content ILIKE $${index + 2} OR s.title ILIKE $${index + 2} OR s.description ILIKE $${index + 2})`
        ).join(' OR ');

        const keywordResult = await query(
          `SELECT 
            cb.sop_id,
            cb.content,
            cb.block_order,
            s.title,
            s.department,
            s.category
           FROM sop_content_blocks cb
           JOIN sops s ON cb.sop_id = s.id
           WHERE 
            s.language = $1
            AND (${searchConditions})
           ORDER BY s.created_at DESC
           LIMIT 10`,
          [language, ...searchPattern]
        );

        searchResults = keywordResult.rows;
      }

      // 如果还是没找到，从SOPs表搜索
      if (searchResults.length === 0 && keywords.length > 0) {
        const sopSearchConditions = keywords.map((_, index) => 
          `(s.title ILIKE $${index + 2} OR s.description ILIKE $${index + 2} OR s.content::text ILIKE $${index + 2})`
        ).join(' OR ');
        const searchPattern = keywords.map(kw => `%${kw}%`);
        
        const sopResult = await query(
          `SELECT 
            s.id as sop_id,
            s.title,
            s.description,
            s.department,
            s.category,
            s.content as sop_content
           FROM sops s
           WHERE 
            s.language = $1
            AND (${sopSearchConditions})
           ORDER BY s.created_at DESC
           LIMIT 10`,
          [language, ...searchPattern]
        );

        searchResults = sopResult.rows;
      }
    }

    console.log(`   找到 ${searchResults.length} 个相关内容`);

    // 2. 如果没有找到相关内容，返回通用回复
    if (searchResults.length === 0) {
      const noResultAnswer = language === 'zh'
        ? `抱歉，我在现有的SOP中没有找到与"${question}"相关的信息。\n\n可能的原因：\n1. 这个流程还没有被记录到SOP中\n2. 可以尝试用不同的关键词提问\n3. 查看SOP列表，看是否有类似的流程\n\n需要帮助创建新的SOP吗？`
        : `Sorry, I couldn't find information related to "${question}" in the existing SOPs.\n\nPossible reasons:\n1. This process hasn't been documented in an SOP yet\n2. Try asking with different keywords\n3. Check the SOP list for similar processes\n\nWould you like help creating a new SOP?`;

      // 记录到问答历史
      await query(
        `INSERT INTO sop_qa_history 
         (user_id, username, user_language, question, answer, matched_sop_ids)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.username, language, question, noResultAnswer, []]
      );

      return NextResponse.json({
        answer: noResultAnswer,
        relatedSOPs: [],
        foundResults: false,
      });
    }

    // 3. 整理相关的SOP
    const relatedSOPsMap = new Map();
    const contextChunks: string[] = [];

    for (const row of searchResults) {
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
       (user_id, username, user_language, question, answer, matched_sop_ids, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        user.username,
        language,
        question,
        answer,
        relatedSOPs.map(sop => sop.id),
        0.85, // 临时固定置信度
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


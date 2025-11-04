/**
 * AI分析引擎
 * 使用OpenAI GPT-4分析文档内容并提取SOP结构
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SOPStep {
  order: number;
  title: string;
  description: string;
  responsible?: string;
  conditions?: string[];
  notes?: string[];
}

export interface ParsedSOP {
  title: string;
  department: string;
  category: string;
  description?: string;
  steps: SOPStep[];
}

/**
 * 使用GPT-4分析文档并提取SOP结构
 */
export async function analyzeDocument(content: string): Promise<ParsedSOP> {
  console.log('🤖 开始AI分析...');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 使用更快更便宜的模型，效果也很好
      messages: [
        {
          role: "system",
          content: `你是一个专业的SOP（标准操作流程）分析专家。你的任务是分析文档内容，提取所有操作流程和步骤。

要求：
1. 识别文档中的所有操作流程
2. 按照逻辑顺序提取每个步骤
3. 识别每个步骤的负责人/角色
4. 提取触发条件和注意事项
5. 归类到合适的部门和类别

返回JSON格式：
{
  "title": "流程标题",
  "department": "所属部门（如：销售部、仓库部、客服部）",
  "category": "流程类别（如：订单处理、退货流程、客户咨询）",
  "description": "流程简介",
  "steps": [
    {
      "order": 1,
      "title": "步骤标题",
      "description": "详细描述",
      "responsible": "负责人或角色",
      "conditions": ["触发条件1", "触发条件2"],
      "notes": ["注意事项1", "注意事项2"]
    }
  ]
}

注意：
- 如果文档中有多个流程，选择最主要或最完整的一个
- 步骤描述要清晰具体
- 如果无法确定某个字段，可以留空或使用合理推测
- 所有内容使用中文`
        },
        {
          role: "user",
          content: `请分析以下文档内容并提取SOP结构：\n\n${content.substring(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // 较低的temperature使输出更稳定
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('AI返回结果为空');
    }

    const parsed = JSON.parse(result) as ParsedSOP;
    
    console.log('✅ AI分析完成');
    console.log(`   标题: ${parsed.title}`);
    console.log(`   部门: ${parsed.department}`);
    console.log(`   步骤数: ${parsed.steps.length}`);

    return parsed;
  } catch (error: any) {
    console.error('❌ AI分析失败:', error);
    throw new Error(`AI分析失败: ${error.message}`);
  }
}

/**
 * 翻译SOP内容（中文→英文 或 英文→中文）
 */
export async function translateSOP(
  sop: ParsedSOP,
  targetLanguage: 'zh' | 'en'
): Promise<ParsedSOP> {
  console.log(`🌏 开始翻译到${targetLanguage === 'zh' ? '中文' : '英文'}...`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  try {
    const systemPrompt = targetLanguage === 'en'
      ? `You are a professional translator. Translate the following SOP (Standard Operating Procedure) from Chinese to English. Maintain the JSON structure and keep all field names in English. Translate only the values.`
      : `你是一个专业的翻译员。将以下SOP（标准操作流程）从英文翻译成中文。保持JSON结构，字段名称保持英文，只翻译值的内容。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(sop, null, 2) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('翻译结果为空');
    }

    const translated = JSON.parse(result) as ParsedSOP;
    console.log('✅ 翻译完成');

    return translated;
  } catch (error: any) {
    console.error('❌ 翻译失败:', error);
    throw new Error(`翻译失败: ${error.message}`);
  }
}

export default {
  analyzeDocument,
  translateSOP,
};


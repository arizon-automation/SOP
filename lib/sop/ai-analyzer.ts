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
          content: `你是一个专业的SOP（标准操作流程）分析专家。你的任务是将文档内容**完整保留**并重新组织成结构化的SOP。

🚨 重要原则：
1. **保留所有细节** - 不要遗漏、不要总结、不要删减任何信息
2. **完整复制原文** - 步骤描述要包含原文档中的所有细节
3. **保留专业术语** - 不要改写技术术语或专有名词
4. **保留所有数字** - 数量、时间、金额等必须精确保留
5. **保留所有示例** - 如果原文有例子，必须包含在描述中

你的工作是**组织结构**，不是**精简内容**：
- 识别文档中的所有操作流程和步骤
- 按照逻辑顺序组织这些步骤
- 将详细内容完整地放入每个步骤的description字段
- 识别每个步骤的负责人/角色
- 提取触发条件和注意事项（完整保留原文）
- 归类到合适的部门和类别

返回JSON格式：
{
  "title": "流程标题",
  "department": "所属部门（如：销售部、仓库部、客服部）",
  "category": "流程类别（如：订单处理、退货流程、客户咨询）",
  "description": "流程简介（完整保留原文档的概述部分）",
  "steps": [
    {
      "order": 1,
      "title": "步骤标题（简短）",
      "description": "详细描述（必须包含原文档中这个步骤的所有细节、所有句子、所有说明）",
      "responsible": "负责人或角色",
      "conditions": ["触发条件1（完整原文）", "触发条件2（完整原文）"],
      "notes": ["注意事项1（完整原文）", "注意事项2（完整原文）"]
    }
  ]
}

特别注意：
- description字段要详尽，包含原文档中该步骤的**所有段落、所有细节、所有说明**
- 如果原文有多个段落，在description中用换行符分隔保留
- 如果有列表、要点，全部保留在description或notes中
- 如果原文有示例说明，必须包含在description中
- 宁可写得太详细，也不要遗漏任何信息
- 所有内容使用中文`
        },
        {
          role: "user",
          content: `请将以下文档内容完整地组织成结构化的SOP。记住：保留所有细节，不要遗漏任何信息，不要总结或精简内容。\n\n文档内容：\n\n${content.substring(0, 12000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // 极低的temperature确保精确保留内容
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


/**
 * SOP合并工具
 * 智能合并多个SOP，解决冲突，创建统一的最终版本
 */

import OpenAI from 'openai';
import type { ParsedSOP } from './ai-analyzer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MergeOptions {
  strategy: 'merge_all' | 'prefer_new' | 'prefer_existing' | 'smart_combine';
  resolveConflicts: boolean;
  preserveAllSteps: boolean;
}

/**
 * 合并两个SOP
 */
export async function mergeSOPs(
  newSOP: ParsedSOP,
  existingSOP: ParsedSOP,
  options: MergeOptions = {
    strategy: 'smart_combine',
    resolveConflicts: true,
    preserveAllSteps: true,
  }
): Promise<ParsedSOP> {
  console.log('🔀 开始合并SOP...');
  console.log(`   新SOP: ${newSOP.title}`);
  console.log(`   现有SOP: ${existingSOP.title}`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  try {
    const prompt = `你是一个专业的SOP合并专家。你的任务是将两个SOP智能合并成一个统一的、完整的、逻辑清晰的最终版本。

🎯 合并原则：
1. **保留所有有价值的信息** - 不要丢失任何重要的步骤、细节或说明
2. **解决冲突** - 如果两个SOP对同一步骤有不同描述，找出最准确、最完整的版本
3. **消除重复** - 合并重复的步骤，但保留独特的细节
4. **优化顺序** - 确保步骤的逻辑顺序合理
5. **统一格式** - 使用一致的语言风格和描述方式

📄 SOP A (新文档):
标题: ${newSOP.title}
部门: ${newSOP.department}
类别: ${newSOP.category}
描述: ${newSOP.description || ''}
步骤:
${newSOP.steps.map((s, i) => `${i + 1}. ${s.title}
   描述: ${s.description}
   负责人: ${s.responsible || '未指定'}
   ${s.conditions?.length ? `条件: ${s.conditions.join('; ')}` : ''}
   ${s.notes?.length ? `注意: ${s.notes.join('; ')}` : ''}`).join('\n\n')}

📄 SOP B (现有文档):
标题: ${existingSOP.title}
部门: ${existingSOP.department}
类别: ${existingSOP.category}
描述: ${existingSOP.description || ''}
步骤:
${existingSOP.steps.map((s, i) => `${i + 1}. ${s.title}
   描述: ${s.description}
   负责人: ${s.responsible || '未指定'}
   ${s.conditions?.length ? `条件: ${s.conditions.join('; ')}` : ''}
   ${s.notes?.length ? `注意: ${s.notes.join('; ')}` : ''}`).join('\n\n')}

🔀 合并策略: ${options.strategy}
- merge_all: 包含两个SOP的所有步骤
- prefer_new: 冲突时优先使用新SOP的描述
- prefer_existing: 冲突时优先使用现有SOP的描述
- smart_combine: 智能判断，选择最完整准确的描述

请创建一个合并后的SOP，返回JSON格式：
{
  "title": "合并后的标题（简洁明确）",
  "department": "部门",
  "category": "类别",
  "description": "完整的流程描述（包含所有重要信息）",
  "steps": [
    {
      "order": 1,
      "title": "步骤标题",
      "description": "合并后的详细描述（包含两个SOP的所有重要细节）",
      "responsible": "负责人",
      "conditions": ["条件1", "条件2"],
      "notes": ["注意事项1", "注意事项2"],
      "mergeInfo": "说明这个步骤如何合并的（如：来自SOP A的步骤2和SOP B的步骤3）"
    }
  ],
  "mergeNotes": "合并过程中的重要说明（如：解决了哪些冲突、做了哪些调整）"
}

⚠️ 特别注意：
- 如果两个SOP描述同一个步骤但细节不同，将两者的细节都包含进去
- 如果有明显的冲突（如：不同的负责人、不同的条件），在notes中说明
- 确保最终的SOP逻辑清晰、步骤完整、可以直接使用
- 所有内容使用中文

返回JSON:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // 使用更强大的模型处理复杂的合并任务
      messages: [
        {
          role: 'system',
          content: '你是专业的SOP合并专家，擅长整合多个文档，解决冲突，创建统一的标准操作流程。'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('AI返回结果为空');
    }

    const mergedSOP = JSON.parse(result);

    console.log('✅ SOP合并完成');
    console.log(`   最终标题: ${mergedSOP.title}`);
    console.log(`   最终步骤数: ${mergedSOP.steps.length}`);
    console.log(`   合并说明: ${mergedSOP.mergeNotes || '无'}`);

    return mergedSOP;
  } catch (error: any) {
    console.error('❌ SOP合并失败:', error);
    throw new Error(`SOP合并失败: ${error.message}`);
  }
}

/**
 * 合并多个SOP（3个或更多）
 */
export async function mergeMultipleSOPs(
  sops: ParsedSOP[],
  options?: MergeOptions
): Promise<ParsedSOP> {
  if (sops.length < 2) {
    throw new Error('至少需要2个SOP才能合并');
  }

  if (sops.length === 2) {
    return await mergeSOPs(sops[0], sops[1], options);
  }

  console.log(`🔀 开始合并 ${sops.length} 个SOP...`);

  // 逐步合并：先合并前两个，然后将结果与第三个合并，以此类推
  let merged = await mergeSOPs(sops[0], sops[1], options);

  for (let i = 2; i < sops.length; i++) {
    console.log(`🔀 合并第 ${i + 1} 个SOP...`);
    merged = await mergeSOPs(merged, sops[i], options);
  }

  console.log(`✅ 完成合并 ${sops.length} 个SOP`);
  return merged;
}

export default {
  mergeSOPs,
  mergeMultipleSOPs,
};


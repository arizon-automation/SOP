/**
 * 冲突检测工具
 * 检测新文档与现有SOP之间的重复和冲突
 */

import OpenAI from 'openai';
import { query } from '@/lib/db';
import type { ParsedSOP } from './ai-analyzer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConflictAnalysis {
  hasConflicts: boolean;
  hasDuplicates: boolean;
  relatedSOPs: RelatedSOP[];
  suggestions: MergeSuggestion[];
}

export interface RelatedSOP {
  id: number;
  title: string;
  department: string;
  category: string;
  similarity: number; // 0-1, 相似度
  conflictType: 'duplicate' | 'partial_overlap' | 'conflicting' | 'complementary';
  conflictDetails: string;
}

export interface MergeSuggestion {
  action: 'merge' | 'replace' | 'keep_both' | 'update_existing';
  targetSOPId?: number;
  reason: string;
  details: string;
}

/**
 * 检测新SOP与现有SOP的冲突
 */
export async function detectConflicts(
  newSOP: ParsedSOP,
  userId: number
): Promise<ConflictAnalysis> {
  console.log('🔍 开始检测SOP冲突...');

  try {
    // 1. 查找相关的现有SOP（同部门或同类别）
    const existingSOPs = await query(
      `SELECT 
        id, title, description, department, category, content, language
       FROM sops 
       WHERE (department = $1 OR category = $2)
       AND status = 'approved'
       AND language = 'zh'
       ORDER BY created_at DESC
       LIMIT 10`,
      [newSOP.department, newSOP.category]
    );

    if (existingSOPs.rows.length === 0) {
      console.log('✅ 没有发现相关的现有SOP，无冲突');
      return {
        hasConflicts: false,
        hasDuplicates: false,
        relatedSOPs: [],
        suggestions: [{
          action: 'keep_both',
          reason: '这是该部门/类别的第一个SOP',
          details: '建议直接创建新SOP',
        }],
      };
    }

    console.log(`📊 发现 ${existingSOPs.rows.length} 个相关SOP，开始AI分析...`);

    // 2. 使用AI比较新SOP与每个现有SOP
    const relatedSOPs: RelatedSOP[] = [];

    for (const existingSOP of existingSOPs.rows) {
      const comparison = await compareSOPs(newSOP, existingSOP.content.steps || []);
      
      if (comparison.similarity > 0.3) { // 相似度超过30%才认为相关
        relatedSOPs.push({
          id: existingSOP.id,
          title: existingSOP.title,
          department: existingSOP.department,
          category: existingSOP.category,
          similarity: comparison.similarity,
          conflictType: comparison.conflictType,
          conflictDetails: comparison.details,
        });
      }
    }

    if (relatedSOPs.length === 0) {
      console.log('✅ 虽然有同部门/类别的SOP，但内容不相关，无冲突');
      return {
        hasConflicts: false,
        hasDuplicates: false,
        relatedSOPs: [],
        suggestions: [{
          action: 'keep_both',
          reason: '内容不重复，可以共存',
          details: '建议创建新SOP',
        }],
      };
    }

    // 3. 生成合并建议
    const suggestions = await generateMergeSuggestions(newSOP, relatedSOPs);

    // 4. 判断是否有冲突
    const hasConflicts = relatedSOPs.some(sop => 
      sop.conflictType === 'conflicting'
    );
    const hasDuplicates = relatedSOPs.some(sop => 
      sop.conflictType === 'duplicate' || sop.similarity > 0.8
    );

    console.log(`✅ 冲突检测完成:`);
    console.log(`   相关SOP数量: ${relatedSOPs.length}`);
    console.log(`   是否有冲突: ${hasConflicts}`);
    console.log(`   是否有重复: ${hasDuplicates}`);

    return {
      hasConflicts,
      hasDuplicates,
      relatedSOPs,
      suggestions,
    };
  } catch (error: any) {
    console.error('❌ 冲突检测失败:', error);
    // 如果检测失败，返回安全的默认值
    return {
      hasConflicts: false,
      hasDuplicates: false,
      relatedSOPs: [],
      suggestions: [{
        action: 'keep_both',
        reason: '冲突检测失败，建议手动审核',
        details: error.message,
      }],
    };
  }
}

/**
 * 使用AI比较两个SOP
 */
async function compareSOPs(
  newSOP: ParsedSOP,
  existingSteps: any[]
): Promise<{
  similarity: number;
  conflictType: 'duplicate' | 'partial_overlap' | 'conflicting' | 'complementary';
  details: string;
}> {
  const prompt = `你是一个专业的SOP分析专家。请比较以下两个SOP，判断它们的关系。

新SOP:
标题: ${newSOP.title}
部门: ${newSOP.department}
类别: ${newSOP.category}
步骤数: ${newSOP.steps.length}
步骤摘要: ${newSOP.steps.map(s => s.title).join('; ')}

现有SOP:
步骤数: ${existingSteps.length}
步骤摘要: ${existingSteps.map((s: any) => s.title).join('; ')}

请分析并返回JSON格式：
{
  "similarity": 0.85,  // 0-1之间的相似度
  "conflictType": "duplicate",  // 可选: duplicate(重复), partial_overlap(部分重叠), conflicting(冲突), complementary(互补)
  "details": "详细说明两个SOP的关系"
}

判断标准：
- duplicate: 内容高度重复（相似度>80%），描述同一个流程
- partial_overlap: 部分步骤重叠（相似度40-80%），但有不同的部分
- conflicting: 描述相同的事情，但步骤或要求有明显冲突
- complementary: 描述相关但不同的流程，可以共存

返回JSON:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是SOP分析专家，擅长识别流程的重复和冲突。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('AI返回结果为空');
    }

    return JSON.parse(result);
  } catch (error: any) {
    console.error('SOP比较失败:', error);
    return {
      similarity: 0,
      conflictType: 'complementary',
      details: '比较失败',
    };
  }
}

/**
 * 生成合并建议
 */
async function generateMergeSuggestions(
  newSOP: ParsedSOP,
  relatedSOPs: RelatedSOP[]
): Promise<MergeSuggestion[]> {
  const suggestions: MergeSuggestion[] = [];

  // 找出最相似的SOP
  const mostSimilar = relatedSOPs.reduce((prev, current) => 
    current.similarity > prev.similarity ? current : prev
  );

  if (mostSimilar.conflictType === 'duplicate' || mostSimilar.similarity > 0.8) {
    // 高度重复 - 建议替换或合并
    suggestions.push({
      action: 'replace',
      targetSOPId: mostSimilar.id,
      reason: `新文档与"${mostSimilar.title}"高度重复（相似度${Math.round(mostSimilar.similarity * 100)}%）`,
      details: '建议使用新文档替换旧SOP，或者合并两者的内容以保留所有细节。',
    });

    suggestions.push({
      action: 'merge',
      targetSOPId: mostSimilar.id,
      reason: '合并两个版本的优点',
      details: '将新旧两个SOP的内容合并，保留两者的所有细节和差异，创建一个更完整的版本。',
    });
  } else if (mostSimilar.conflictType === 'conflicting') {
    // 有冲突 - 需要解决冲突
    suggestions.push({
      action: 'merge',
      targetSOPId: mostSimilar.id,
      reason: `与"${mostSimilar.title}"存在冲突`,
      details: `${mostSimilar.conflictDetails}。建议合并并解决冲突，统一流程标准。`,
    });

    suggestions.push({
      action: 'keep_both',
      reason: '保留两个版本（如果是不同场景）',
      details: '如果这两个SOP适用于不同的场景或条件，可以同时保留，但需要明确各自的适用范围。',
    });
  } else if (mostSimilar.conflictType === 'partial_overlap') {
    // 部分重叠 - 可以合并或更新
    suggestions.push({
      action: 'update_existing',
      targetSOPId: mostSimilar.id,
      reason: `补充"${mostSimilar.title}"的内容`,
      details: '新文档包含一些额外的步骤或细节，建议更新现有SOP以包含这些新信息。',
    });

    suggestions.push({
      action: 'merge',
      targetSOPId: mostSimilar.id,
      reason: '合并为更完整的流程',
      details: '将两个SOP合并，创建一个涵盖所有步骤的完整流程。',
    });
  } else {
    // 互补关系 - 可以共存
    suggestions.push({
      action: 'keep_both',
      reason: '流程互补，可以共存',
      details: `新SOP与"${mostSimilar.title}"描述不同但相关的流程，建议同时保留。`,
    });
  }

  return suggestions;
}

export default {
  detectConflicts,
};


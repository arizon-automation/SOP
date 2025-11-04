/**
 * AI监督者系统
 * 作为系统的总监督，分析新信息，解释整合方案，征求批准
 */

import OpenAI from 'openai';
import type { ParsedSOP } from './ai-analyzer';
import type { ConflictAnalysis } from './conflict-detector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SupervisorAnalysis {
  summary: string;              // 总体分析摘要
  summaryEn: string;
  summaryCn: string;
  keyFindings: string[];         // 关键发现（中英文）
  keyFindingsEn: string[];
  keyFindingsCn: string[];
  classification: {              // 智能分类建议
    suggestedDepartment: string;
    suggestedDepartmentEn: string;
    suggestedDepartmentCn: string;
    suggestedCategory: string;
    suggestedCategoryEn: string;
    suggestedCategoryCn: string;
    confidence: number;          // 置信度 0-1
    reasoning: string;           // 分类理由
    reasoningEn: string;
    reasoningCn: string;
  };
  integrationPlan: {             // 整合计划
    action: 'create_new' | 'merge' | 'update' | 'replace';
    targetSOPId?: number;
    targetSOPTitle?: string;
    reasoning: string;
    reasoningEn: string;
    reasoningCn: string;
    expectedOutcome: string;     // 预期结果
    expectedOutcomeEn: string;
    expectedOutcomeCn: string;
    risks: string[];             // 潜在风险
    risksEn: string[];
    risksCn: string[];
  };
  recommendations: string[];      // AI建议（中英文）
  recommendationsEn: string[];
  recommendationsCn: string[];
  requiresApproval: boolean;      // 是否需要人工批准
  approvalReason: string;         // 需要批准的原因
  approvalReasonEn: string;
  approvalReasonCn: string;
}

/**
 * AI监督者分析新文档
 */
export async function supervisorAnalysis(
  newSOP: ParsedSOP,
  conflictAnalysis?: ConflictAnalysis
): Promise<SupervisorAnalysis> {
  console.log('🤖 AI监督者开始分析...');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  try {
    const prompt = `你是一个专业的SOP系统监督者。你的职责是分析新文档，理解其内容，决定如何最佳地整合到现有系统中，并清晰地向管理者解释你的分析和建议。

🔍 新文档信息:
标题: ${newSOP.title}
部门: ${newSOP.department}
类别: ${newSOP.category}
描述: ${newSOP.description || ''}
步骤数: ${newSOP.steps.length}
步骤概览: ${newSOP.steps.map(s => s.title).join(', ')}

${conflictAnalysis ? `
⚠️ 冲突分析结果:
- 发现相关SOP数量: ${conflictAnalysis.relatedSOPs.length}
- 是否有冲突: ${conflictAnalysis.hasConflicts ? '是' : '否'}
- 是否有重复: ${conflictAnalysis.hasDuplicates ? '是' : '否'}

相关SOP详情:
${conflictAnalysis.relatedSOPs.map(sop => 
  `- ${sop.title} (${sop.department} / ${sop.category})
   相似度: ${Math.round(sop.similarity * 100)}%
   关系: ${sop.conflictType}
   详情: ${sop.conflictDetails}`
).join('\n')}
` : '没有发现相关的现有SOP'}

🎯 请你作为系统监督者，进行全面分析并提供建议。返回JSON格式：

{
  "summary": "总体分析摘要（中文）",
  "summaryEn": "Overall analysis summary (English)",
  "summaryCn": "总体分析摘要（中文）",
  
  "keyFindings": [
    "关键发现1（中英文）",
    "关键发现2（中英文）"
  ],
  "keyFindingsEn": ["Key finding 1", "Key finding 2"],
  "keyFindingsCn": ["关键发现1", "关键发现2"],
  
  "classification": {
    "suggestedDepartment": "建议的部门（英文）",
    "suggestedDepartmentEn": "Suggested department (English)",
    "suggestedDepartmentCn": "建议的部门（中文）",
    "suggestedCategory": "建议的类别（英文ID，如：warehouse-receiving）",
    "suggestedCategoryEn": "Suggested category (English)",
    "suggestedCategoryCn": "建议的类别（中文）",
    "confidence": 0.95,
    "reasoning": "分类理由（中文）",
    "reasoningEn": "Classification reasoning (English)",
    "reasoningCn": "分类理由（中文）"
  },
  
  "integrationPlan": {
    "action": "create_new",  // 或 merge, update, replace
    "targetSOPId": null,     // 如果是merge/update/replace，提供目标SOP ID
    "targetSOPTitle": null,
    "reasoning": "整合计划的理由（中文，详细说明为什么选择这个方案）",
    "reasoningEn": "Integration plan reasoning (English)",
    "reasoningCn": "整合计划的理由（中文）",
    "expectedOutcome": "预期结果（中文，描述整合后的效果）",
    "expectedOutcomeEn": "Expected outcome (English)",
    "expectedOutcomeCn": "预期结果（中文）",
    "risks": ["潜在风险1", "潜在风险2"],
    "risksEn": ["Potential risk 1", "Potential risk 2"],
    "risksCn": ["潜在风险1", "潜在风险2"]
  },
  
  "recommendations": [
    "建议1（中英文）",
    "建议2（中英文）"
  ],
  "recommendationsEn": ["Recommendation 1", "Recommendation 2"],
  "recommendationsCn": ["建议1", "建议2"],
  
  "requiresApproval": true,  // 是否需要人工批准
  "approvalReason": "需要批准的原因（中文）",
  "approvalReasonEn": "Approval reason (English)",
  "approvalReasonCn": "需要批准的原因（中文）"
}

📋 分析要点:
1. **深入理解内容** - 这个SOP的核心目的是什么？它解决什么问题？
2. **智能分类** - 应该归类到哪个部门和类别？为什么？
3. **冲突处理** - 如果有相关SOP，如何最佳整合？是否需要合并、更新或保留？
4. **风险评估** - 这个整合方案有什么潜在风险？如何规避？
5. **建议提供** - 给管理者什么建议？需要注意什么？

⚠️ 需要批准的情况:
- 检测到高度重复或冲突
- 涉及关键业务流程的修改
- 不确定最佳分类方案
- 整合可能影响多个部门

🎯 分类参考（categoryId）:
- accounts: 财务部
  - accounts-invoice: 发票管理
  - accounts-payment: 付款处理
  - accounts-reconciliation: 账目核对
- warehouse: 仓库部
  - warehouse-receiving: 收货入库
  - warehouse-picking: 拣货出库
  - warehouse-inventory: 库存管理
  - warehouse-quality: 质量检验
- sales: 销售部
  - sales-inquiry: 客户咨询
  - sales-quotation: 报价流程
  - sales-order: 订单处理
- customer-service: 客服部
  - cs-complaint: 投诉处理
  - cs-return: 退货退款
  - cs-after-sales: 售后服务
- operations: 运营部
  - ops-hr: 人力资源
  - ops-admin: 行政管理
  - ops-it: IT支持

返回JSON:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的企业运营系统监督者，精通流程管理、业务分析和系统整合。你能深入理解业务流程，做出明智的决策，并清晰地解释你的思考过程。'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('AI监督者返回结果为空');
    }

    const analysis = JSON.parse(result) as SupervisorAnalysis;

    console.log('✅ AI监督者分析完成');
    console.log(`   建议分类: ${analysis.classification.suggestedCategoryCn}`);
    console.log(`   整合方案: ${analysis.integrationPlan.action}`);
    console.log(`   需要批准: ${analysis.requiresApproval ? '是' : '否'}`);

    return analysis;
  } catch (error: any) {
    console.error('❌ AI监督者分析失败:', error);
    throw new Error(`AI监督者分析失败: ${error.message}`);
  }
}

export default {
  supervisorAnalysis,
};


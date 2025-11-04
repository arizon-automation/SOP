/**
 * 内容分块工具
 * 处理超长文档，分块解析后合并
 */

import { analyzeDocument, type ParsedSOP } from './ai-analyzer';

const MAX_CHUNK_SIZE = 12000; // 每块最大字符数

/**
 * 将长文档分成多个块
 */
function splitIntoChunks(content: string, maxSize: number = MAX_CHUNK_SIZE): string[] {
  if (content.length <= maxSize) {
    return [content];
  }

  const chunks: string[] = [];
  const paragraphs = content.split('\n\n');
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        // 单个段落太长，强制切分
        chunks.push(para.substring(0, maxSize));
        currentChunk = para.substring(maxSize);
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * 合并多个解析结果
 */
function mergeSOPs(sops: ParsedSOP[]): ParsedSOP {
  if (sops.length === 1) {
    return sops[0];
  }

  // 使用第一个SOP的基本信息
  const merged: ParsedSOP = {
    title: sops[0].title,
    department: sops[0].department,
    category: sops[0].category,
    description: sops.map(s => s.description).filter(d => d).join('\n\n'),
    steps: [],
  };

  // 合并所有步骤，重新编号
  let stepOrder = 1;
  for (const sop of sops) {
    for (const step of sop.steps) {
      merged.steps.push({
        ...step,
        order: stepOrder++,
      });
    }
  }

  return merged;
}

/**
 * 分块解析长文档
 */
export async function analyzeDocumentWithChunking(content: string): Promise<ParsedSOP> {
  console.log(`📄 文档长度: ${content.length} 字符`);

  // 如果文档不长，直接解析
  if (content.length <= MAX_CHUNK_SIZE) {
    console.log('📝 文档较短，直接解析');
    return await analyzeDocument(content);
  }

  // 分块解析
  console.log('📚 文档较长，开始分块解析...');
  const chunks = splitIntoChunks(content, MAX_CHUNK_SIZE);
  console.log(`📑 已分成 ${chunks.length} 块`);

  const sops: ParsedSOP[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`🔍 解析第 ${i + 1}/${chunks.length} 块...`);
    try {
      const sop = await analyzeDocument(chunks[i]);
      sops.push(sop);
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 块解析失败:`, error);
      // 继续处理其他块
    }
  }

  if (sops.length === 0) {
    throw new Error('所有块都解析失败');
  }

  console.log('🔗 合并解析结果...');
  const merged = mergeSOPs(sops);
  console.log(`✅ 合并完成: ${merged.steps.length} 个步骤`);

  return merged;
}

export default {
  analyzeDocumentWithChunking,
  splitIntoChunks,
  mergeSOPs,
};


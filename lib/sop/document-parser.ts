/**
 * 文档解析工具
 * 从PDF和Word文档中提取文本内容
 */

import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

/**
 * 从URL下载文件到buffer
 */
async function downloadFile(fileUrl: string): Promise<Buffer> {
  // 如果是本地文件路径
  if (fileUrl.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), 'uploads', path.basename(fileUrl));
    return await fs.readFile(localPath);
  }
  
  // 如果是Vercel Blob URL
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 解析PDF文档
 */
export async function parsePDF(fileUrl: string): Promise<string> {
  try {
    console.log('📕 开始解析PDF:', fileUrl);
    
    const buffer = await downloadFile(fileUrl);
    const data = await pdf(buffer);
    
    const text = data.text;
    console.log(`✅ PDF解析成功: ${text.length} 字符`);
    
    return text;
  } catch (error: any) {
    console.error('❌ PDF解析失败:', error);
    throw new Error(`PDF解析失败: ${error.message}`);
  }
}

/**
 * 解析Word文档
 */
export async function parseWord(fileUrl: string): Promise<string> {
  try {
    console.log('📘 开始解析Word:', fileUrl);
    
    const buffer = await downloadFile(fileUrl);
    const result = await mammoth.extractRawText({ buffer });
    
    const text = result.value;
    console.log(`✅ Word解析成功: ${text.length} 字符`);
    
    // 检查是否有警告
    if (result.messages.length > 0) {
      console.warn('⚠️ Word解析警告:', result.messages);
    }
    
    return text;
  } catch (error: any) {
    console.error('❌ Word解析失败:', error);
    throw new Error(`Word解析失败: ${error.message}`);
  }
}

/**
 * 根据文件类型自动选择解析方法
 */
export async function parseDocument(fileUrl: string, fileType: string): Promise<string> {
  console.log(`🔍 开始解析文档: ${fileType}`);
  
  if (fileType === 'pdf') {
    return await parsePDF(fileUrl);
  } else if (fileType === 'docx') {
    return await parseWord(fileUrl);
  } else {
    throw new Error(`不支持的文件类型: ${fileType}`);
  }
}

/**
 * 清理和格式化文本
 */
export function cleanText(text: string): string {
  return text
    // 移除多余的空白行
    .replace(/\n{3,}/g, '\n\n')
    // 移除多余的空格
    .replace(/ {2,}/g, ' ')
    // 修剪首尾空白
    .trim();
}

export default {
  parseDocument,
  parsePDF,
  parseWord,
  cleanText,
};


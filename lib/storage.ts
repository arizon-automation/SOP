/**
 * 文件存储工具
 * 智能环境检测：
 * - Vercel环境：使用Vercel Blob
 * - 本地环境：使用本地文件系统
 */

import { put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * 检测是否在Vercel环境
 */
function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * 确保本地上传目录存在
 */
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('✅ 创建本地上传目录:', UPLOAD_DIR);
  }
}

/**
 * 上传文件
 * 自动选择存储方式（Vercel Blob 或本地文件系统）
 */
export async function uploadFile(
  file: File,
  filename: string
): Promise<{ url: string; size: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isVercel()) {
    // Vercel环境：使用Vercel Blob
    console.log('🚀 使用Vercel Blob上传:', filename);
    
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    });

    return {
      url: blob.url,
      size: buffer.length,
    };
  } else {
    // 本地环境：保存到本地文件系统
    await ensureUploadDir();
    
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, buffer);
    
    console.log('💾 本地文件保存成功:', filePath);
    
    // 返回本地URL（开发服务器可访问）
    return {
      url: `/uploads/${filename}`,
      size: buffer.length,
    };
  }
}

/**
 * 删除文件
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (isVercel()) {
    // Vercel Blob: 目前不支持删除，可以忽略
    // 或使用 @vercel/blob 的 del 方法
    console.log('⚠️ Vercel Blob删除功能未实现');
  } else {
    // 本地文件系统：删除文件
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOAD_DIR, filename);
    
    try {
      await fs.unlink(filePath);
      console.log('🗑️ 本地文件删除成功:', filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  
  // 清理文件名（移除特殊字符）
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50);
  
  return `${timestamp}-${random}-${cleanName}${ext}`;
}

/**
 * 验证文件类型
 */
export function isValidFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const validExtensions = ['.pdf', '.doc', '.docx'];
  return validExtensions.includes(ext);
}

/**
 * 获取文件MIME类型
 */
export function getFileMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export default {
  uploadFile,
  deleteFile,
  generateUniqueFilename,
  isValidFileType,
  getFileMimeType,
};


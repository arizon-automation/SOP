/**
 * 本地开发文件服务
 * 仅在开发环境使用，生产环境使用Vercel Blob
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 仅在开发环境允许访问
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      'uploads',
      ...params.path
    );

    // 安全检查：确保路径在uploads目录内
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 设置正确的Content-Type
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('文件读取错误:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}


/**
 * 文档上传API
 * 支持PDF和Word文档
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  uploadFile,
  generateUniqueFilename,
  isValidFileType,
} from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const user = await requireAuth();

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json(
        { error: '请选择文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: '只支持PDF和Word文档（.pdf, .doc, .docx）' },
        { status: 400 }
      );
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过10MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const filename = generateUniqueFilename(file.name);
    
    // 上传文件（自动选择Vercel Blob或本地存储）
    console.log('📤 开始上传文件:', filename);
    const { url, size } = await uploadFile(file, filename);
    console.log('✅ 文件上传成功:', url);

    // 确定文件类型
    const ext = file.name.toLowerCase();
    let fileType = 'unknown';
    if (ext.endsWith('.pdf')) fileType = 'pdf';
    else if (ext.endsWith('.doc') || ext.endsWith('.docx')) fileType = 'docx';

    // 保存到数据库
    const result = await query(
      `INSERT INTO sop_documents 
       (title, file_type, file_url, file_size, uploaded_by, status)
       VALUES ($1, $2, $3, $4, $5, 'uploaded')
       RETURNING *`,
      [
        title || file.name,
        fileType,
        url,
        size,
        user.id,
      ]
    );

    const document = result.rows[0];

    console.log('✅ 文档信息已保存到数据库:', document.id);

    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      document: {
        id: document.id,
        title: document.title,
        fileType: document.file_type,
        fileUrl: document.file_url,
        fileSize: document.file_size,
        status: document.status,
        uploadedAt: document.uploaded_at,
      },
    });
  } catch (error: any) {
    console.error('文件上传错误:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '文件上传失败: ' + error.message },
      { status: 500 }
    );
  }
}


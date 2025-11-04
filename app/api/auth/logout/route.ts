/**
 * 登出API
 */

import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  try {
    await logoutUser();
    
    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error: any) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}


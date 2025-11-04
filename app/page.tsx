/**
 * SOP系统主页 - 登录/跳转页
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  // 检查是否已登录
  const user = await getCurrentUser();
  
  if (user) {
    // 已登录，跳转到仪表板
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-700 to-primary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-6">
            <span className="text-5xl">📋</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Arizon SOP</h1>
          <p className="text-xl text-blue-100">AI驱动的全球化SOP管理系统</p>
          <p className="text-sm text-blue-200 mt-2">
            AI-Driven Global SOP Management System
          </p>
        </div>

        {/* Features Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            系统功能
          </h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="font-semibold text-gray-900">智能文档解析</h3>
                <p className="text-sm text-gray-600">上传PDF/Word，AI自动提取流程结构</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌏</span>
              <div>
                <h3 className="font-semibold text-gray-900">中英文双语</h3>
                <p className="text-sm text-gray-600">自动翻译，全球团队无缝协作</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="font-semibold text-gray-900">AI智能问答</h3>
                <p className="text-sm text-gray-600">员工随时提问，AI即时解答</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-900">数据分析优化</h3>
                <p className="text-sm text-gray-600">识别高频问题，持续优化流程</p>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            登录系统 / Sign In
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm">
          &copy; {new Date().getFullYear()} Arizon Off Grid. All rights reserved.
        </p>
      </div>
    </div>
  );
}


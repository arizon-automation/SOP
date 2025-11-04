/**
 * SOP系统主仪表板
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department?: string;
  language: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error('认证失败:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Arizon SOP System</h1>
              <p className="text-sm text-gray-600">欢迎回来, {user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">{user.role} · {user.department}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">欢迎使用 SOP 管理系统</h2>
          <p className="text-blue-100">AI驱动的全球化标准操作流程管理平台</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 文档管理 */}
          <Link
            href="/documents"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📄
              </div>
              <h3 className="text-lg font-bold text-gray-900">文档管理</h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              上传和管理PDF、Word文档，AI自动解析流程结构
            </p>
            <div className="text-primary-500 text-sm font-medium">
              查看文档 →
            </div>
          </Link>

          {/* SOP管理 */}
          <Link
            href="/sops"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-gray-900">SOP管理</h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              查看、编辑和管理所有标准操作流程（中英文双语）
            </p>
            <div className="text-primary-500 text-sm font-medium">
              查看SOP →
            </div>
          </Link>

          {/* AI问答 */}
          <Link
            href="/qa"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI智能问答</h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              用中文或英文提问，AI从SOP库中检索准确答案
            </p>
            <div className="text-primary-500 text-sm font-medium">
              开始提问 →
            </div>
          </Link>

          {/* 审批管理 */}
          {(user.role === 'admin' || user.role === 'manager') && (
            <Link
              href="/approvals"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
                <h3 className="text-lg font-bold text-gray-900">审批管理</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                审批AI提出的SOP修改建议，查看修改对比
              </p>
              <div className="text-primary-500 text-sm font-medium">
                查看待审批 →
              </div>
            </Link>
          )}

          {/* 数据分析 */}
          {(user.role === 'admin' || user.role === 'manager') && (
            <Link
              href="/analytics"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
                <h3 className="text-lg font-bold text-gray-900">数据分析</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                查看员工提问统计，识别高频问题和SOP盲区
              </p>
              <div className="text-primary-500 text-sm font-medium">
                查看分析 →
              </div>
            </Link>
          )}

          {/* 用户管理 */}
          {user.role === 'admin' && (
            <Link
              href="/admin/users"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  👥
                </div>
                <h3 className="text-lg font-bold text-gray-900">用户管理</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                管理系统用户、角色和权限
              </p>
              <div className="text-primary-500 text-sm font-medium">
                管理用户 →
              </div>
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600 mt-1">文档总数</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600 mt-1">SOP总数</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600 mt-1">今日提问</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600 mt-1">待审批</div>
          </div>
        </div>
      </main>
    </div>
  );
}


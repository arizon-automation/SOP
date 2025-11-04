/**
 * SOP列表页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface SOP {
  id: number;
  title: string;
  description: string;
  department: string;
  category: string;
  language: string;
  version: string;
  status: string;
  created_at: string;
  created_by_name: string;
  document_title?: string;
}

export default function SOPsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadSOPs();
  }, [language, departmentFilter]);

  const loadSOPs = async () => {
    try {
      const params = new URLSearchParams();
      // 根据全局语言设置自动过滤
      params.set('language', language);
      if (departmentFilter) params.set('department', departmentFilter);

      const res = await fetch(`/api/sops?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('加载失败');
      }

      const data = await res.json();
      setSOPs(data.sops);
    } catch (error) {
      console.error('加载SOP列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getLanguageBadge = (language: string) => {
    return language === 'zh' ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
        中文
      </span>
    ) : (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
        English
      </span>
    );
  };

  const handleDelete = async (sopId: number, sopTitle: string, e: React.MouseEvent) => {
    e.preventDefault(); // 阻止Link跳转
    e.stopPropagation();

    if (!confirm(`确定要删除 "${sopTitle}" 吗？此操作无法撤销。`)) {
      return;
    }

    setDeletingId(sopId);

    try {
      const res = await fetch(`/api/sops/${sopId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 成功后重新加载列表
      await loadSOPs();
    } catch (error: any) {
      console.error('删除SOP失败:', error);
      alert(`删除失败：${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('sops.title')}</h1>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '显示中文版SOP' : 'Showing English SOPs'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                ← {t('common.back')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder={language === 'zh' ? '按部门筛选...' : 'Filter by department...'}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 w-64"
          />
          
          <div className="flex-1 text-sm text-gray-600 flex items-center">
            {language === 'zh' ? (
              <>
                💡 切换到<span className="mx-1 px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">English</span>查看英文版SOP
              </>
            ) : (
              <>
                💡 Switch to <span className="mx-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">中文</span> to view Chinese SOPs
              </>
            )}
          </div>
        </div>

        {/* SOP List */}
        {sops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'zh' ? '还没有中文SOP' : 'No English SOPs yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'zh' 
                ? '上传文档并使用AI解析功能来创建SOP' 
                : 'Upload documents and use AI parsing to create SOPs'}
            </p>
            <Link
              href="/documents/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'zh' ? '上传文档' : 'Upload Document'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sops.map((sop) => (
              <div
                key={sop.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative"
              >
                <Link href={`/sops/${sop.id}`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-12">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{sop.title}</h3>
                      </div>
                      {sop.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{sop.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {sop.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {sop.category}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {sop.created_by_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(sop.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-primary-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  {sop.document_title && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      来源文档: {sop.document_title}
                    </div>
                  )}
                </Link>
                {/* 删除按钮 - 绝对定位在右上角 */}
                <button
                  onClick={(e) => handleDelete(sop.id, sop.title, e)}
                  disabled={deletingId === sop.id}
                  className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="删除SOP"
                >
                  {deletingId === sop.id ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


/**
 * SOP详情页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SOP {
  id: number;
  title: string;
  description: string;
  department: string;
  category: string;
  language: string;
  version: string;
  content: any;
  status: string;
  created_at: string;
  created_by_name: string;
  document_title?: string;
  document_url?: string;
}

interface Step {
  order: number;
  title: string;
  description: string;
  responsible?: string;
  conditions?: string[];
  notes?: string[];
  imageIndices?: number[];
}

interface SOPImage {
  index: number;
  filename: string;
  url: string;
  contentType: string;
}

export default function SOPDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sop, setSOP] = useState<SOP | null>(null);
  const [translationPair, setTranslationPair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSOP();
  }, [params.id]);

  const loadSOP = async () => {
    try {
      const res = await fetch(`/api/sops/${params.id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          router.push('/sops');
          return;
        }
        throw new Error('加载失败');
      }

      const data = await res.json();
      setSOP(data.sop);
      setTranslationPair(data.translationPair);
    } catch (error) {
      console.error('加载SOP详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个SOP吗？此操作无法撤销。\n\n注意：如果有对应的翻译版本，翻译版本不会被删除，但关联会被清除。')) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/sops/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 成功后跳转到SOP列表
      router.push('/sops');
    } catch (error: any) {
      console.error('删除SOP失败:', error);
      alert(`删除失败：${error.message}`);
      setDeleting(false);
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

  if (!sop) {
    return null;
  }

  const steps: Step[] = sop.content.steps || [];
  const images: SOPImage[] = sop.content.images || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{sop.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sop.language === 'zh' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {sop.language === 'zh' ? '中文' : 'English'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">SOP详情 · {sop.department} · {sop.category}</p>
              </div>
            </div>
            <Link
              href="/sops"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              ← 返回列表
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SOP Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 图片说明 - 只在有图片时显示提示 */}
            {images.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-900">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold">
                    📷 本流程包含 {images.length} 张指导图片，已在相关步骤中展示
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {sop.description && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-3">流程说明</h2>
                <p className="text-gray-700 whitespace-pre-line">{sop.description}</p>
              </div>
            )}

            {/* Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">操作步骤</h2>
              <div className="space-y-6">
                {steps.map((step, index) => {
                  // 获取该步骤相关的图片
                  const stepImages = step.imageIndices 
                    ? images.filter(img => step.imageIndices!.includes(img.index))
                    : [];

                  return (
                    <div key={index} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                          {step.order}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                          {step.responsible && (
                            <p className="text-sm text-primary-600 mt-1">
                              👤 负责人: {step.responsible}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 ml-11 mb-3 whitespace-pre-line">{step.description}</p>

                      {/* 步骤相关的图片 */}
                      {stepImages.length > 0 && (
                        <div className="ml-11 mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stepImages.map((img) => (
                              <div key={img.index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <img 
                                  src={img.url} 
                                  alt={`步骤${step.order}图片${img.index + 1}`}
                                  className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(img.url, '_blank')}
                                />
                                <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">
                                  🖼️ 图片 {img.index + 1} - 点击查看大图
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.conditions && step.conditions.length > 0 && (
                        <div className="ml-11 mb-2">
                          <p className="text-sm font-semibold text-gray-700 mb-1">触发条件:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {step.conditions.map((condition, i) => (
                              <li key={i}>{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.notes && step.notes.length > 0 && (
                        <div className="ml-11 bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-sm font-semibold text-yellow-900 mb-1">⚠️ 注意事项:</p>
                          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                            {step.notes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            {/* Translation */}
            {translationPair && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  多语言版本
                </h3>
                <Link
                  href={`/sops/${translationPair.id}`}
                  className="block text-blue-700 hover:text-blue-800 font-medium"
                >
                  查看{translationPair.language === 'zh' ? '中文' : 'English'}版本 →
                </Link>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">版本:</span>
                  <span className="ml-2 font-semibold">{sop.version}</span>
                </div>
                <div>
                  <span className="text-gray-600">部门:</span>
                  <span className="ml-2 font-semibold">{sop.department}</span>
                </div>
                <div>
                  <span className="text-gray-600">类别:</span>
                  <span className="ml-2 font-semibold">{sop.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">创建人:</span>
                  <span className="ml-2 font-semibold">{sop.created_by_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">步骤数:</span>
                  <span className="ml-2 font-semibold">{steps.length}</span>
                </div>
              </div>
            </div>

            {/* Source Document */}
            {sop.document_title && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">来源文档</h2>
                <p className="text-sm text-gray-700 mb-3">{sop.document_title}</p>
                {sop.document_url && (
                  <a
                    href={sop.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    查看原文档
                  </a>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">操作</h2>
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑（开发中）
                </button>

                <button
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  导出PDF（开发中）
                </button>

                <hr className="my-4" />

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? '删除中...' : '删除SOP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


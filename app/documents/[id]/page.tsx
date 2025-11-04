/**
 * 文档详情页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Document {
  id: number;
  title: string;
  file_type: string;
  file_url: string;
  file_size: number;
  status: string;
  raw_content?: string;
  parsed_content?: any;
  error_message?: string;
  uploaded_at: string;
  uploaded_by_name: string;
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [params.id]);

  const loadDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          router.push('/documents');
          return;
        }
        throw new Error('加载失败');
      }

      const data = await res.json();
      setDocument(data.document);
    } catch (error) {
      console.error('加载文档详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个文档吗？此操作无法撤销。')) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('删除失败');
      }

      router.push('/documents');
    } catch (error) {
      console.error('删除文档失败:', error);
      alert('删除失败，请重试');
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      uploaded: { text: '已上传', className: 'bg-blue-100 text-blue-800' },
      parsing: { text: '解析中', className: 'bg-yellow-100 text-yellow-800' },
      parsed: { text: '已解析', className: 'bg-green-100 text-green-800' },
      failed: { text: '失败', className: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || { text: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return '📕';
    if (fileType === 'docx') return '📘';
    return '📄';
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

  if (!document) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getFileIcon(document.file_type)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
                <p className="text-sm text-gray-600">文档详情</p>
              </div>
            </div>
            <Link
              href="/documents"
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
          {/* Left Column - Document Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">文档标题：</span>
                  <span className="font-semibold text-gray-900">{document.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">文件类型：</span>
                  <span className="font-semibold text-gray-900 uppercase">{document.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">文件大小：</span>
                  <span className="font-semibold text-gray-900">{formatFileSize(document.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">上传者：</span>
                  <span className="font-semibold text-gray-900">{document.uploaded_by_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">上传时间：</span>
                  <span className="font-semibold text-gray-900">{formatDate(document.uploaded_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">状态：</span>
                  {getStatusBadge(document.status)}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {document.error_message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  错误信息
                </h3>
                <p className="text-red-800 text-sm">{document.error_message}</p>
              </div>
            )}

            {/* Parsed Content Preview */}
            {document.parsed_content && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">解析结果（预览）</h2>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(document.parsed_content, null, 2)}
                </pre>
              </div>
            )}

            {/* Coming Soon */}
            {document.status === 'uploaded' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  开发中功能
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  AI文档解析功能正在开发中，即将支持：
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>自动提取PDF/Word文本内容</li>
                  <li>AI识别流程结构和步骤</li>
                  <li>生成结构化SOP</li>
                  <li>自动翻译成中英文</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">操作</h2>
              <div className="space-y-3">
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  预览文档
                </a>

                <a
                  href={document.file_url}
                  download
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  下载文档
                </a>

                <button
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI解析（开发中）
                </button>

                <hr className="my-4" />

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? '删除中...' : '删除文档'}
                </button>
              </div>
            </div>

            {/* Related SOPs */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">关联的SOP</h2>
              <p className="text-gray-600 text-sm">此文档还没有生成SOP</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


/**
 * 文档上传页面
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploader from '@/components/FileUploader';

export default function UploadDocumentPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUploadSuccess = (document: any) => {
    setSuccessMessage(`文档"${document.title}"上传成功！`);
    setErrorMessage('');
    
    // 3秒后跳转到文档详情页
    setTimeout(() => {
      router.push(`/documents/${document.id}`);
    }, 2000);
  };

  const handleUploadError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📤</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">上传文档</h1>
                <p className="text-sm text-gray-600">上传PDF或Word文档，AI将自动解析</p>
              </div>
            </div>
            <Link
              href="/documents"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              ← 返回
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-green-800 font-semibold">{successMessage}</p>
              <p className="text-green-600 text-sm">正在跳转到文档详情页...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">选择文档</h2>
            <p className="text-gray-600">
              支持PDF和Word文档，AI将自动识别流程结构并生成SOP
            </p>
          </div>

          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              上传提示
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>支持的文件格式：PDF (.pdf)、Word (.doc, .docx)</li>
              <li>文件大小限制：最大10MB</li>
              <li>本地开发时文件保存在本地，部署到Vercel后自动使用云存储</li>
              <li>上传后可以触发AI解析，自动提取流程步骤</li>
              <li>建议上传清晰、结构化的文档以获得更好的解析效果</li>
            </ul>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">下一步</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">上传文档</h4>
                <p className="text-sm text-gray-600">选择并上传您的PDF或Word文档</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">AI解析（开发中）</h4>
                <p className="text-sm text-gray-600">AI自动识别文档中的流程结构</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">生成SOP（开发中）</h4>
                <p className="text-sm text-gray-600">生成结构化SOP并自动翻译成中英文</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


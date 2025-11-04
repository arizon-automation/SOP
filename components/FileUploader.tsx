/**
 * 文件上传组件
 * 支持拖放上传和点击上传
 */

'use client';

import { useState, useRef, DragEvent } from 'react';

interface FileUploaderProps {
  onUploadSuccess: (document: any) => void;
  onUploadError: (error: string) => void;
}

export default function FileUploader({ onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // 验证文件类型
    const validTypes = ['.pdf', '.doc', '.docx'];
    const ext = file.name.toLowerCase();
    const isValid = validTypes.some(type => ext.endsWith(type));

    if (!isValid) {
      onUploadError('只支持PDF和Word文档（.pdf, .doc, .docx）');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError('文件大小不能超过10MB');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onUploadError('请选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title || selectedFile.name);

      setUploadProgress(30);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '上传失败');
      }

      setUploadProgress(100);
      
      // 成功回调
      onUploadSuccess(data.document);

      // 重置表单
      setSelectedFile(null);
      setTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('上传错误:', error);
      onUploadError(error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* 拖放区域 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-gray-100'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {!selectedFile ? (
            <>
              <p className="text-lg font-semibold text-gray-700">
                拖放文件到此处，或点击选择文件
              </p>
              <p className="text-sm text-gray-500">
                支持 PDF, Word (.pdf, .doc, .docx)，最大 10MB
              </p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-4xl">📄</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setTitle('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  取消选择
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 上传进度 */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">上传中...</span>
            <span className="text-sm font-semibold text-primary-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 文件标题 */}
      {selectedFile && !isUploading && (
        <div className="mt-4">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            文档标题 (可选)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="默认使用文件名"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900"
          />
        </div>
      )}

      {/* 上传按钮 */}
      {selectedFile && !isUploading && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          开始上传
        </button>
      )}
    </div>
  );
}


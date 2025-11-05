/**
 * SOP编辑页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

interface Step {
  order: number;
  title: string;
  description: string;
  responsible?: string;
  conditions?: string[];
  notes?: string[];
  imageIndices?: number[];
}

interface SOP {
  id: number;
  title: string;
  description: string;
  department: string;
  category: string;
  language: string;
  version: string;
  content: any;
}

export default function EditSOPPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [sop, setSOP] = useState<SOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);

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
      const sopData = data.sop;
      setSOP(sopData);
      
      // 填充表单
      setTitle(sopData.title);
      setDescription(sopData.description || '');
      setDepartment(sopData.department);
      setCategory(sopData.category);
      setSteps(sopData.content.steps || []);
    } catch (error) {
      console.error('加载SOP失败:', error);
      alert('加载SOP失败');
      router.push('/sops');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }

    if (steps.length === 0) {
      alert('至少需要一个步骤');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/sops/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          department,
          category,
          steps,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }

      alert('保存成功！');
      router.push(`/sops/${params.id}`);
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(`保存失败：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    const newOrder = steps.length + 1;
    setSteps([
      ...steps,
      {
        order: newOrder,
        title: '',
        description: '',
        responsible: '',
        conditions: [],
        notes: [],
      },
    ]);
  };

  const handleUpdateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleDeleteStep = (index: number) => {
    if (!confirm('确定要删除这个步骤吗？')) return;
    
    const newSteps = steps.filter((_, i) => i !== index);
    // 重新排序
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setSteps(newSteps);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 交换
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // 重新排序
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    
    setSteps(newSteps);
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

  if (!sop) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✏️</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">编辑 SOP</h1>
                <p className="text-sm text-gray-600">
                  {sop.language === 'zh' ? '中文版' : 'English Version'} · 版本 {sop.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/sops/${params.id}`}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                取消
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '💾 保存'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="输入SOP标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="输入SOP描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    部门 *
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例如：销售部"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例如：客户管理"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">操作步骤</h2>
              <button
                onClick={handleAddStep}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ➕ 添加步骤
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                        {step.order}
                      </span>
                      <span className="text-sm text-gray-600">步骤 {step.order}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="上移"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="下移"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteStep(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Step Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        标题 *
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        placeholder="步骤标题"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        详细说明 *
                      </label>
                      <textarea
                        value={step.description}
                        onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        placeholder="详细描述这个步骤的操作方法"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        负责人
                      </label>
                      <input
                        type="text"
                        value={step.responsible || ''}
                        onChange={(e) => handleUpdateStep(index, 'responsible', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                        placeholder="谁负责执行这个步骤"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">还没有步骤</p>
                  <button
                    onClick={handleAddStep}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ➕ 添加第一个步骤
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <Link
              href={`/sops/${params.id}`}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-md"
            >
              {saving ? '保存中...' : '💾 保存更改'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}


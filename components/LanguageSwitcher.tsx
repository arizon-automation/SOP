/**
 * 语言切换组件
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'zh'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        English
      </button>
    </div>
  );
}


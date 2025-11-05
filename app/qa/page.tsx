/**
 * AI智能问答页面
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedSOPs?: Array<{
    id: number;
    title: string;
    department: string;
    similarity: number;
  }>;
}

export default function QAPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      
      // 添加欢迎消息
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: language === 'zh' 
            ? '你好！我是AI助手，可以帮你查询SOP相关信息。\n\n你可以问我：\n• 如何处理退货？\n• 仓库盘点流程是什么？\n• 客户投诉由谁负责？\n• 销售订单处理步骤？\n\n请随时提问！'
            : 'Hello! I\'m your AI assistant, here to help you with SOP inquiries.\n\nYou can ask me:\n• How to process returns?\n• What is the warehouse inventory process?\n• Who is responsible for customer complaints?\n• Sales order processing steps?\n\nFeel free to ask anything!',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('认证失败:', error);
      router.push('/login');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/qa/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error('请求失败');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        relatedSOPs: data.relatedSOPs,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('提问失败:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'zh' 
          ? '抱歉，我遇到了一些问题。请稍后再试。'
          : 'Sorry, I encountered an issue. Please try again later.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm(language === 'zh' ? '确定要清空聊天记录吗？' : 'Clear chat history?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: language === 'zh' 
            ? '聊天记录已清空。有什么我可以帮你的吗？'
            : 'Chat history cleared. How can I help you?',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const exampleQuestions = language === 'zh' 
    ? [
        '如何处理客户退货？',
        '仓库盘点的步骤是什么？',
        '销售订单审批流程？',
        '库存不足时该怎么办？',
      ]
    : [
        'How to handle customer returns?',
        'What are the warehouse inventory steps?',
        'Sales order approval process?',
        'What to do when stock is low?',
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'zh' ? 'AI智能问答' : 'AI Q&A Assistant'}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '关于SOP的任何问题，随时问我' : 'Ask me anything about SOPs'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                🗑️ {language === 'zh' ? '清空历史' : 'Clear'}
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                ← {language === 'zh' ? '返回' : 'Back'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      AI
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`whitespace-pre-line ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                    </p>
                    
                    {/* Related SOPs */}
                    {message.relatedSOPs && message.relatedSOPs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">
                          📚 {language === 'zh' ? '相关SOP:' : 'Related SOPs:'}
                        </p>
                        <div className="space-y-2">
                          {message.relatedSOPs.map((sop) => (
                            <Link
                              key={sop.id}
                              href={`/sops/${sop.id}`}
                              className="block text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded border border-blue-200 transition-colors"
                            >
                              <div className="font-semibold text-blue-900">{sop.title}</div>
                              <div className="text-blue-600">{sop.department} · {Math.round(sop.similarity * 100)}% {language === 'zh' ? '相关' : 'relevant'}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-white text-primary-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-lg p-4 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    AI
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Example Questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {language === 'zh' ? '💡 试试这些问题:' : '💡 Try these questions:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-left text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-3 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'zh' ? '输入你的问题...' : 'Type your question...'}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '📤'} {language === 'zh' ? '发送' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}


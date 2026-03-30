'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardKPIs, DashboardFilters, PackageLevelSummary } from '@/types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AskTheDataProps {
  kpis: DashboardKPIs;
  filters: DashboardFilters;
  packageLevelSummaries: PackageLevelSummary[];
}

const SUGGESTED_QUESTIONS = [
  'Which package level has the lowest utilisation?',
  'What is driving the change in gross margin?',
  'How many clients are at risk of underspend?',
  'Which branch is performing best on margin?',
  'What actions should I take this week?',
];

export function AskTheData({ kpis, filters, packageLevelSummaries }: AskTheDataProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask-the-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          kpis,
          filters,
          packageLevelSummaries,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I had trouble generating a response. Please check your API key configuration and try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-brand-500" />
          <span className="text-sm font-semibold text-slate-800">Ask the Data</span>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-600">
            AI Assistant
          </span>
        </div>
        <span className="text-xs text-slate-400">{isOpen ? 'Close' : 'Open'}</span>
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="border-t border-slate-100 h-72 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-xs text-slate-400 text-center">
                  Ask any question about your dashboard data.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-brand-100 flex items-center justify-center">
                    <Bot size={12} className="text-brand-600" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
                    <User size={12} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-brand-100 flex items-center justify-center">
                  <Bot size={12} className="text-brand-600" />
                </div>
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
                placeholder="Ask about your data..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center h-9 w-9 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-40"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

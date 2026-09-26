import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Send, X, Sparkles } from 'lucide-react';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  country
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your **Smart Medicine Assistant**. I check live medicine stock, expiring medicines, and daily clinic needs across **${country}** to provide simple, clear answers.\n\nHow can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const samplePrompts = [
    "Which medicines are running low?",
    "Why is ORS demand increasing in Maharashtra?",
    "Which clinics have extra medicines to share?",
    "Which medicines will expire soon?",
    "What medicines should we order this month?",
    "What happens if patient visits increase by 25%?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || isLoading) return;

    const userMsg = { sender: 'user' as const, text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await api.askAICopilot(q, country);
      const aiMsg = {
        sender: 'ai' as const,
        text: res.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "The assistant is temporarily offline. You can view all live medicine data directly on your dashboard.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-brand-500/20 border border-blue-200 dark:border-brand-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Smart Medicine Assistant (AI)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-brand-500/10 text-blue-600 dark:text-brand-400 border border-blue-200 dark:border-brand-500/30 font-bold">
                  Active • {country}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instant answers about medicine stocks, shortages, and clinic transfers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-brand-400 p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Checking clinic inventory and records...</span>
            </div>
          )}
        </div>

        {/* Sample Prompt Chips */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">Quick Questions:</span>
          {samplePrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about medicine stocks, shortages, or transfers..."
            className="flex-1 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md transition-all disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  RefreshCw, 
  FileCode, 
  Trash2
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { chatRagApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citedFiles?: string[];
}

export function AssistantChatDrawer({ onClose }: { onClose: () => void }) {
  const { getActiveRepo, analysisResult } = useRepoStore();
  const activeRepo = getActiveRepo();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Hello! I am your RefactorAI Assistant powered by Groq Llama-3.3-70b. I have indexed ${activeRepo?.name || 'the active workspace'}. Ask me questions regarding architectural patterns, security vulnerabilities, or refactoring strategies.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const issues = analysisResult?.issues || [];

  const promptShortcuts = [
    issues.some(i => i.category === 'Architecture') 
      ? 'Explain how to decouple circular dependencies'
      : 'What is the architectural layer structure of this project?',
    issues.some(i => i.category === 'Security')
      ? 'Summarize critical security findings & fixes'
      : 'Explain how to enhance security guards',
    issues.some(i => i.type.includes('N+1'))
      ? 'How to fix N+1 sequential loop queries?'
      : 'How to reduce cyclomatic branching complexity?',
    'Recommend top 3 refactoring priorities',
  ];

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || input).trim();
    if (!text || isSending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInput('');
    setIsSending(true);

    try {
      const filesContext = Object.entries(activeRepo?.files || {}).slice(0, 15).map(([path, content]) => ({
        path,
        content: content.slice(0, 1500),
      }));

      const res = await chatRagApi({
        message: text,
        filesContext,
        repoName: activeRepo?.name || 'repository',
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'Analysis completed.',
        citedFiles: res.citedFiles || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `Error contacting AI assistant: ${err.message}. Ensure backend is running on port 3008 and GROQ_API_KEY is configured in .env.`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: 'init-reset',
        sender: 'ai',
        text: `Conversation reset. Ready to answer questions on ${activeRepo?.name || 'repository'}.`,
      },
    ]);
  };

  return (
    <div className="surface-card p-4 space-y-3 font-mono text-xs text-[#172033] bg-white border border-[#E2E8F0] shadow-2xl rounded-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#E5484D]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-[#172033] text-xs uppercase tracking-tight">AI Architect</h4>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-50 text-[#E5484D] border border-red-200 font-bold">
                RAG
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Groq Llama-3.3-70b</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1 rounded text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Repository Context Badge */}
      <div className="px-2.5 py-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs shrink-0 text-[#64748B]">
        <span className="truncate">Context: <strong className="text-[#172033]">{activeRepo?.name || 'Workspace'}</strong></span>
        <span className="text-[10px] text-[#E5484D] font-mono font-bold">{Object.keys(activeRepo?.files || {}).length} files</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col space-y-1 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed max-w-[88%] whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#FFF1F2] border border-[#FECDD3] border-l-2 border-l-[#E5484D] text-[#172033] shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] shadow-2xs font-sans'
                }`}
              >
                {m.text}
              </div>

              {m.citedFiles && m.citedFiles.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] pl-1 font-mono">
                  <FileCode className="w-3 h-3 text-[#E5484D]" />
                  <span>Cited: {m.citedFiles.join(', ')}</span>
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E5484D]" />
            <span>Consulting Groq Llama-3.3-70b inference engine...</span>
          </div>
        )}
      </div>

      {/* Prompt Shortcuts Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
        {promptShortcuts.map((ps, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(ps)}
            className="whitespace-nowrap px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[10px] text-[#475569] hover:text-[#172033] transition-all cursor-pointer"
          >
            {ps}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-1 shrink-0 border-t border-[#E2E8F0]"
      >
        <input
          type="text"
          placeholder="Ask an architectural question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isSending}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}

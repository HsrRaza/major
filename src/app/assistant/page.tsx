'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileCode, 
  Trash2, 
  RefreshCw
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { useRefactorStore } from '@/stores/refactorStore';
import { chatRagApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citedFiles?: string[];
  timestamp: string;
}

export default function AssistantPage() {
  const router = useRouter();
  const { getActiveRepo, activeRepoId, analysisResult } = useRepoStore();
  const { generateProposal } = useRefactorStore();
  const activeRepo = getActiveRepo();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your RefactorAI Principal Architect powered by Groq Llama-3.3-70b inference.
I have indexed ${Object.keys(activeRepo?.files || {}).length} source files from ${activeRepo?.name || 'Workspace'}.

You can ask me about:
• Concrete architectural decomposition strategies (e.g. breaking circular loops).
• Fixing security vulnerabilities like arbitrary dynamic code execution or SQL injection.
• Eliminating N+1 asynchronous query loops.
• Refactoring proposals with complete backwards-compatible TypeScript code.`,
      timestamp: 'Initial scan',
    },
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const suggestedQuestions = [
    'How do I decouple the circular dependency between userService and authService?',
    'What are the highest risk security vulnerabilities in this repository?',
    'How can I replace eval() dynamic execution with a safe arithmetic parser?',
    'How do I batch async queries with Promise.all to fix N+1 latency smells?',
    'Recommend top 3 refactoring priorities to raise the Code Health Index',
  ];

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || isSending) return;

    const currentTime = mounted
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Now';

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setIsSending(true);

    try {
      const filesContext = Object.entries(activeRepo?.files || {}).slice(0, 15).map(([path, content]) => ({
        path,
        content: content.slice(0, 1600),
      }));

      const res = await chatRagApi({
        message: text,
        filesContext,
        repoName: activeRepo?.name || 'repository',
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'No response returned from reasoning engine.',
        citedFiles: res.citedFiles || [],
        timestamp: mounted
          ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Now',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `Error connecting to Groq AI engine: ${err.message}. Verify that the backend server is running and GROQ_API_KEY is configured in .env.`,
          timestamp: mounted
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenRefactor = (file: string) => {
    const originalCode = activeRepo?.files[file] || '';
    generateProposal({
      filePath: file,
      originalCode,
    });
    router.push(`/refactor/${activeRepoId}`);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-4 animate-fadeIn">
      {/* Header Bar */}
      <div className="surface-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Bot className="w-5 h-5 text-[#E5484D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                AI Architect & Codebase RAG Chat
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200 font-bold">
                REDLINE ENGINE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono mt-0.5">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Groq Llama-3.3-70b
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span>Context: <strong className="text-[#172033] font-sans">{activeRepo?.name || 'Workspace'}</strong> ({Object.keys(activeRepo?.files || {}).length} files)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-[#64748B] hover:text-[#172033]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </Button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="surface-card flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col space-y-1.5 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B] px-1 font-medium">
                <span>{isUser ? 'DEVELOPER' : 'REFACTORAI // ARCHITECT'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap transition-all shadow-xs ${
                  isUser
                    ? 'bg-white border border-[#E2E8F0] border-l-4 border-l-[#E5484D] text-[#172033] font-mono'
                    : 'bg-white border border-[#E2E8F0] text-[#172033] font-sans'
                }`}
              >
                {m.text}
              </div>

              {m.citedFiles && m.citedFiles.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] pl-1 pt-1 flex-wrap">
                  <span className="text-[#E5484D] font-bold flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    Cited Files:
                  </span>
                  {m.citedFiles.map((f) => (
                    <button
                      key={f}
                      onClick={() => handleOpenRefactor(f)}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] hover:border-[#E5484D] text-[#172033] hover:text-[#E5484D] transition-colors cursor-pointer shadow-2xs font-medium"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-[#E2E8F0] text-xs font-mono text-[#E5484D] shadow-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-[#E5484D]" />
            <span>Consulting Groq Llama-3.3-70b with repository RAG context...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Strip */}
      <div className="space-y-1.5 shrink-0">
        <span className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider px-1 font-mono">
          Recommended Architectural Inquiries
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1.5 rounded-md bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] text-xs text-[#475569] hover:text-[#172033] transition-all cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Form */}
      <div className="surface-card p-3 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about architectural decoupling, security hardening, or refactoring..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-grow bg-white border border-[#E2E8F0] rounded-md px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D]"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSending || !input.trim()}
            className="shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send Query</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

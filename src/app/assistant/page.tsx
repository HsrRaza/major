'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileCode, 
  Trash2, 
  RefreshCw, 
  Cpu, 
  ArrowRight,
  Terminal,
  ShieldCheck,
  CheckCircle2
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

export function AssistantPage() {
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
      text: `Hello! I am your PatchPilot Principal Architect powered by Groq Llama-3.3-70b inference.
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
    <div className="max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-3 animate-fadeIn">
      {/* Header Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#141414] border border-[#2B2B2B] text-[#FF4D4D] flex items-center justify-center shadow-inner">
            <Bot className="w-5 h-5 text-[#FF4D4D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F5F5F5] font-mono tracking-tight uppercase">
                AI Architect & Codebase RAG
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]">
                REDLINE ENGINE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#858585] font-mono mt-0.5">
              <span className="flex items-center gap-1.5 text-[#22C55E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Groq Llama-3.3-70b
              </span>
              <span className="text-[#2B2B2B]">•</span>
              <span>Context: <span className="text-[#F5F5F5]">{activeRepo?.name || 'Workspace'}</span> ({Object.keys(activeRepo?.files || {}).length} files)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMessages([messages[0]])}
            className="font-mono text-xs text-[#858585] hover:text-[#F5F5F5]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </Button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="surface-card flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#090909]">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col space-y-1.5 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#858585] px-1">
                <span>{isUser ? 'DEVELOPER' : 'PATCHPILOT // ARCHITECT'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`p-4 rounded-lg text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap transition-all ${
                  isUser
                    ? 'bg-[#1B1B1B] border border-[#2B2B2B] border-l-2 border-l-[#E53935] text-[#F5F5F5] font-mono shadow-md'
                    : 'bg-[#141414] border border-[#2B2B2B] text-[#F5F5F5] font-sans shadow-lg'
                }`}
              >
                {m.text}
              </div>

              {m.citedFiles && m.citedFiles.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#858585] pl-1 pt-1 flex-wrap">
                  <span className="text-[#FF4D4D] font-bold flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    Cited Files:
                  </span>
                  {m.citedFiles.map((f) => (
                    <button
                      key={f}
                      onClick={() => handleOpenRefactor(f)}
                      className="px-2 py-0.5 rounded bg-[#1B1B1B] border border-[#2B2B2B] hover:border-[#E53935] text-[#B3B3B3] hover:text-[#FF4D4D] transition-colors cursor-pointer"
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
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#141414] border border-[#2B2B2B] text-xs font-mono text-[#FF4D4D]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF4D4D]" />
            <span>Consulting Groq Llama-3.3-70b with repository RAG context...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Strip */}
      <div className="space-y-1.5 shrink-0">
        <span className="text-[10px] font-mono text-[#858585] uppercase font-bold tracking-wider px-1">
          Recommended Architectural Inquiries
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1.5 rounded-md bg-[#141414] border border-[#2B2B2B] hover:border-[#E53935]/50 text-xs font-mono text-[#B3B3B3] hover:text-[#F5F5F5] transition-all cursor-pointer shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="surface-card p-2 flex items-center gap-2 shrink-0 bg-[#0D0D0D]"
      >
        <input
          type="text"
          placeholder="Ask a technical, security, or architectural question about this codebase..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-transparent border-none text-xs text-[#F5F5F5] placeholder-[#5C5C5C] font-mono px-3 py-1.5 focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isSending}
          className="font-mono text-xs px-4"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </Button>
      </form>
    </div>
  );
}

export default AssistantPage;

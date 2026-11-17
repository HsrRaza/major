import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  MessageSquareCode,
  FileCode,
  X,
  Code
} from 'lucide-react';

export default function CodebaseChat({ 
  activeRepo, 
  analysisResult, 
  onTriggerRefactor,
  onClose 
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I am your PatchPilot AI Codebase Architect powered by Groq Llama-3.3-70b. I have indexed the active repository (${activeRepo?.name || 'Workspace'}). Ask me any questions regarding architectural patterns, security vulnerabilities, or refactoring strategies.`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fileCount = activeRepo?.files ? Object.keys(activeRepo.files).length : 0;
  const issues = analysisResult?.issues || [];

  // Generate dynamic prompt shortcuts based on real detected findings
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
    'Recommend top 3 refactoring priorities'
  ];

  const handleSendMessage = async (userQuery) => {
    const textToSend = userQuery || inputMessage;
    if (!textToSend.trim() || isSending) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend.trim() };
    setMessages(prev => [...prev, userMsg]);
    if (!userQuery) setInputMessage('');
    setIsSending(true);

    try {
      // Prepare compact file context from active repo
      const filesContext = Object.entries(activeRepo?.files || {}).slice(0, 15).map(([path, content]) => ({
        path,
        content: content.slice(0, 1500)
      }));

      const res = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend.trim(),
          filesContext,
          repoName: activeRepo?.name || 'repository'
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: data.reply || 'Analysis completed.',
        citedFiles: data.citedFiles || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: `Error contacting AI assistant: ${err.message}. Please verify the backend server is running and GROQ_API_KEY is configured in your .env.`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card-linear p-4 space-y-3 font-mono text-xs text-slate-100 bg-[#090D16] border-[#818CF8]/40 shadow-2xl rounded-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center shadow-md shadow-[#6366F1]/30">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white font-mono flex items-center gap-1.5">
              <span>PatchPilot AI Architect</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            </h3>
            <span className="text-[10px] text-[#94A3B8] font-mono">
              Indexed {fileCount} repository files • Llama-3.3-70b
            </span>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#111726] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dynamic Prompt Shortcuts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {promptShortcuts.map((shortcut, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(shortcut)}
            disabled={isSending}
            className="text-[10px] font-mono px-2 py-1 rounded-full bg-[#111726] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#6366F1]/40 whitespace-nowrap transition-all"
          >
            {shortcut}
          </button>
        ))}
      </div>

      {/* Message Chat History */}
      <div className="flex-grow overflow-y-auto space-y-3 p-1">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 rounded bg-[#6366F1]/20 border border-[#6366F1]/30 text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-[#6366F1] text-white font-sans'
                : 'bg-[#111726] border border-[#1E293B] text-slate-200 font-sans'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Cited Files */}
              {msg.citedFiles && msg.citedFiles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1E293B] text-[10px] font-mono text-[#818CF8] flex items-center gap-1 flex-wrap">
                  <span className="text-[#64748B]">Context:</span>
                  {msg.citedFiles.map((file, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#090D16] border border-[#1E293B]">
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded bg-[#334155] text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-[#818CF8] font-mono p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>PatchPilot AI is analyzing codebase context...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 shrink-0 pt-2 border-t border-[#1E293B]">
        <input
          type="text"
          placeholder="Ask about architecture, security, or refactoring..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isSending}
          className="flex-grow bg-[#111726] border border-[#1E293B] rounded-[6px] px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
        />
        <button
          type="submit"
          disabled={isSending || !inputMessage.trim()}
          className="btn-primary text-xs py-2 px-3.5 font-bold"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

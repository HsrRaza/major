'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  FolderGit2, 
  SearchCode, 
  Bug, 
  Network, 
  Sparkles, 
  Terminal, 
  Bot, 
  History, 
  Settings, 
  Play, 
  RefreshCcw, 
  Upload, 
  FileCode,
  X
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImporter?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenImporter }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { repositories, activeRepoId, setActiveRepoId, runAnalysis, runTests, getActiveRepo } = useRepoStore();

  const activeRepo = getActiveRepo();
  const files = Object.keys(activeRepo?.files || {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const navCommands = [
    { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigateTo('/dashboard'), group: 'Navigation' },
    { label: 'Go to Repositories', icon: FolderGit2, action: () => navigateTo('/repositories'), group: 'Navigation' },
    { label: 'Go to Code Analysis', icon: SearchCode, action: () => navigateTo('/analysis/' + activeRepoId), group: 'Navigation' },
    { label: 'Go to Issues Explorer', icon: Bug, action: () => navigateTo('/issues'), group: 'Navigation' },
    { label: 'Go to Architecture Graph', icon: Network, action: () => navigateTo('/architecture/' + activeRepoId), group: 'Navigation' },
    { label: 'Go to Refactoring Studio', icon: Sparkles, action: () => navigateTo('/refactor/' + activeRepoId), group: 'Navigation' },
    { label: 'Go to Test Runner', icon: Terminal, action: () => navigateTo('/tests/' + activeRepoId), group: 'Navigation' },
    { label: 'Go to AI Codebase Assistant', icon: Bot, action: () => navigateTo('/assistant'), group: 'Navigation' },
    { label: 'Go to Refactor History', icon: History, action: () => navigateTo('/history'), group: 'Navigation' },
    { label: 'Go to Settings', icon: Settings, action: () => navigateTo('/settings'), group: 'Navigation' },
  ];

  const actionCommands = [
    {
      label: 'Run AST Codebase Scan',
      icon: RefreshCcw,
      action: () => {
        runAnalysis();
        onClose();
      },
      group: 'Actions',
    },
    {
      label: 'Execute Sandboxed Tests',
      icon: Play,
      action: () => {
        runTests();
        navigateTo('/tests/' + activeRepoId);
      },
      group: 'Actions',
    },
    {
      label: 'Import New Repository (ZIP or GitHub)',
      icon: Upload,
      action: () => {
        onClose();
        if (onOpenImporter) onOpenImporter();
      },
      group: 'Actions',
    },
  ];

  const fileCommands = files.slice(0, 15).map(file => ({
    label: file,
    icon: FileCode,
    action: () => {
      useRepoStore.getState().setSelectedFilePath(file);
      navigateTo('/refactor/' + activeRepoId);
    },
    group: 'Source Files',
  }));

  const allCommands = [...navCommands, ...actionCommands, ...fileCommands];

  const filtered = allCommands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden z-10 text-xs">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-white">
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#172033] placeholder-[#94A3B8] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8]">
              No commands or files matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[#172033] hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 text-[#64748B] group-hover:text-[#E5484D] shrink-0 transition-colors" />
                    <span className="truncate font-medium">{cmd.label}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0] shrink-0">
                    {cmd.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px] shadow-2xs">ESC</kbd> to close
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px] shadow-2xs">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px] shadow-2xs">↓</kbd> to navigate
          </span>
        </div>
      </div>
    </div>
  );
}

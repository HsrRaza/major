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

  const repoCommands = repositories.map(repo => ({
    label: `Switch Repo: ${repo.owner ? `${repo.owner}/${repo.name}` : repo.name}`,
    icon: FolderGit2,
    action: () => {
      setActiveRepoId(repo.id);
      onClose();
    },
    group: 'Repositories',
  }));

  const fileCommands = files.slice(0, 15).map(file => ({
    label: `Open File: ${file}`,
    icon: FileCode,
    action: () => {
      useRepoStore.getState().setSelectedFilePath(file);
      navigateTo('/refactor/' + activeRepoId);
    },
    group: 'Files',
  }));

  const allCommands = [...actionCommands, ...navCommands, ...repoCommands, ...fileCommands];

  const filteredCommands = allCommands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-xl bg-[#141414] border border-[#2B2B2B] shadow-[0_0_24px_-4px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#202020] bg-[#0D0D0D]">
          <Search className="w-4 h-4 text-[#E53935] shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, navigate, or search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-[#5C5C5C] font-mono focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#858585] bg-[#1B1B1B] border border-[#2B2B2B] rounded">
            ESC
          </kbd>
        </div>

        {/* Command List Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#858585] font-mono">
              No matching commands or files found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono text-[#B3B3B3] hover:text-[#F5F5F5] hover:bg-[#1B1B1B] hover:border-l-2 hover:border-[#E53935] transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-[#858585] group-hover:text-[#FF4D4D] transition-colors" />
                    <span>{cmd.label}</span>
                  </div>
                  <span className="text-[9px] text-[#5C5C5C] group-hover:text-[#858585] font-mono uppercase tracking-wider">
                    {cmd.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#0D0D0D] border-t border-[#202020] flex items-center justify-between text-[11px] text-[#858585] font-mono">
          <span>Use <kbd className="text-[10px] px-1 py-0.5 bg-[#1B1B1B] rounded border border-[#2B2B2B]">⌘K</kbd> anytime</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </div>
        </div>
      </div>
    </div>
  );
}


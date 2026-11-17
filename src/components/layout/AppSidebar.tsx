'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
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
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  ShieldCheck,
  Zap,
  Flame,
  X
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { useHistoryStore } from '@/stores/historyStore';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

export function AppSidebar({ isCollapsed, setIsCollapsed, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { activeRepoId, analysisResult, testResult } = useRepoStore();
  const historyLogs = useHistoryStore((state) => state.logs);

  const issuesCount = analysisResult?.counts?.totalIssues || 0;
  const circularDepsCount = analysisResult?.circularDependencies?.length || 0;
  const testSummary = testResult?.summary;
  const hasRegression = testResult?.hasRegression;

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
      shortcut: '1',
    },
    {
      label: 'Repositories',
      href: '/repositories',
      icon: FolderGit2,
      badge: null,
      shortcut: '2',
    },
    {
      label: 'Code Analysis',
      href: `/analysis/${activeRepoId}`,
      icon: SearchCode,
      badge: issuesCount > 0 ? `${issuesCount}` : null,
      badgeColor: 'bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30',
      shortcut: '3',
    },
    {
      label: 'Issues',
      href: '/issues',
      icon: Bug,
      badge: issuesCount > 0 ? `${issuesCount}` : null,
      badgeColor: 'bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30',
      shortcut: '4',
    },
    {
      label: 'Architecture',
      href: `/architecture/${activeRepoId}`,
      icon: Network,
      badge: circularDepsCount > 0 ? `${circularDepsCount} Cycle${circularDepsCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-[#E53935]/20 text-[#FF4D4D] border border-[#E53935]/40',
      shortcut: '5',
    },
    {
      label: 'Refactoring Studio',
      href: `/refactor/${activeRepoId}`,
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-[#1B1B1B] text-[#FF4D4D] border border-[#E53935]/40',
      shortcut: '6',
    },
    {
      label: 'Test Runner',
      href: `/tests/${activeRepoId}`,
      icon: Terminal,
      badge: testSummary && testSummary.total > 0 ? `${testSummary.passed}/${testSummary.total}` : 'Tests',
      badgeColor: hasRegression ? 'bg-[#E53935]/20 text-[#FF4D4D] border border-[#E53935]/40' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      shortcut: '7',
    },
    {
      label: 'AI Assistant',
      href: '/assistant',
      icon: Bot,
      badge: 'RAG',
      badgeColor: 'bg-[#1B1B1B] text-[#B3B3B3] border border-[#2B2B2B]',
      shortcut: '8',
    },
    {
      label: 'History',
      href: '/history',
      icon: History,
      badge: historyLogs.length > 0 ? `${historyLogs.length}` : null,
      badgeColor: 'bg-[#1B1B1B] text-[#858585] border border-[#2B2B2B]',
      shortcut: '9',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
      shortcut: '0',
    },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        'border-r border-[#202020] bg-[#0D0D0D] flex flex-col justify-between transition-all duration-200 shrink-0 select-none z-20 h-full',
        isCollapsed ? 'w-14' : 'w-60'
      )}
    >
      <div>
        {/* Brand Header */}
        <div className="h-14 border-b border-[#202020] px-3.5 flex items-center justify-between bg-[#090909]">
          <Link 
            href="/dashboard" 
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-8 h-8 rounded bg-[#141414] border border-[#E53935]/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_-2px_rgba(229,57,53,0.35)] group-hover:border-[#FF4D4D] transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] shadow-[0_0_6px_#E53935]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#F5F5F5] tracking-tight font-mono">
                    PATCH<span className="text-[#E53935]">PILOT</span>
                  </span>
                  <span className="text-[8px] font-mono font-black px-1 py-0.5 rounded bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30 tracking-widest uppercase">
                    REDLINE
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#5C5C5C] tracking-wider uppercase">
                  Code Intelligence
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {onCloseMobile ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#1B1B1B] transition-colors lg:hidden"
                  title="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1 rounded text-[#858585] hover:text-white hover:bg-[#1B1B1B] transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isCollapsed && (
          <div className="p-2 border-b border-[#202020] flex justify-center bg-[#090909]">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded text-[#858585] hover:text-white hover:bg-[#1B1B1B] transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4 text-[#FF4D4D]" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-mono transition-all relative group',
                  isActive
                    ? 'active-redline-nav bg-[#1B1B1B] text-[#F5F5F5] font-semibold border border-[#2B2B2B] shadow-sm'
                    : 'text-[#858585] hover:text-[#F5F5F5] hover:bg-[#141414] border border-transparent'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-[#FF4D4D]' : 'text-[#5C5C5C] group-hover:text-[#B3B3B3]'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono font-bold', item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Engine Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#202020] bg-[#090909] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#F5F5F5] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] shadow-[0_0_6px_#E53935] animate-pulse" />
              <span>PatchPilot Core</span>
            </span>
            <span className="text-[9px] text-[#858585] bg-[#141414] px-1.5 py-0.5 rounded border border-[#2B2B2B] font-mono">
              REDLINE v3.2
            </span>
          </div>
          <div className="text-[10px] text-[#858585] font-mono flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Groq LPU Engine Active</span>
          </div>
        </div>
      )}
    </aside>
  );
}


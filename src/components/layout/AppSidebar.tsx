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
  ShieldCheck,
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
      badgeColor: 'bg-red-50 text-red-600 border border-red-200',
      shortcut: '3',
    },
    {
      label: 'Issues',
      href: '/issues',
      icon: Bug,
      badge: issuesCount > 0 ? `${issuesCount}` : null,
      badgeColor: 'bg-red-50 text-red-600 border border-red-200',
      shortcut: '4',
    },
    {
      label: 'Architecture',
      href: `/architecture/${activeRepoId}`,
      icon: Network,
      badge: circularDepsCount > 0 ? `${circularDepsCount} Cycle${circularDepsCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-red-50 text-red-600 border border-red-200',
      shortcut: '5',
    },
    {
      label: 'Refactoring Studio',
      href: `/refactor/${activeRepoId}`,
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-red-50 text-[#E5484D] border border-red-200',
      shortcut: '6',
    },
    {
      label: 'Test Runner',
      href: `/tests/${activeRepoId}`,
      icon: Terminal,
      badge: testSummary && testSummary.total > 0 ? `${testSummary.passed}/${testSummary.total}` : 'Tests',
      badgeColor: hasRegression ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      shortcut: '7',
    },
    {
      label: 'AI Assistant',
      href: '/assistant',
      icon: Bot,
      badge: 'RAG',
      badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200',
      shortcut: '8',
    },
    {
      label: 'History',
      href: '/history',
      icon: History,
      badge: historyLogs.length > 0 ? `${historyLogs.length}` : null,
      badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200',
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
        'border-r border-[#E2E8F0] bg-white flex flex-col justify-between transition-all duration-200 shrink-0 select-none z-20 h-full',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div>
        {/* Brand Header */}
        <div className="h-14 border-b border-[#E2E8F0] px-4 flex items-center justify-between bg-white">
          <Link 
            href="/dashboard" 
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 group-hover:border-[#E5484D] transition-colors shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[#172033] tracking-tight font-mono">
                    Refactor<span className="text-[#E5484D]">AI</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-50 text-[#E5484D] border border-red-200 tracking-wider uppercase">
                    REDLINE
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] tracking-tight">
                  Code Intelligence Platform
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {onCloseMobile ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors lg:hidden"
                  title="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1 rounded-md text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isCollapsed && (
          <div className="p-2 border-b border-[#E2E8F0] flex justify-center bg-white">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4 text-[#E5484D]" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all relative group',
                  isActive
                    ? 'active-redline-nav bg-[#FFF1F2] text-[#E5484D] font-semibold border border-[#FECDD3] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] border border-transparent'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-[#E5484D]' : 'text-[#64748B] group-hover:text-[#172033]'
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
        <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[#172033] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-pulse" />
              <span>PatchPilot Core</span>
            </span>
            <span className="text-[10px] text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] font-mono">
              v3.2 Light
            </span>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Groq LPU Engine Active</span>
          </div>
        </div>
      )}
    </aside>
  );
}

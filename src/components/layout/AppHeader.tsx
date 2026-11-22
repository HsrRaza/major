'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FolderGit2, 
  ChevronDown, 
  GitBranch, 
  Activity, 
  RefreshCcw, 
  Upload, 
  Search, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { getHealthBadgeClass } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenImporter: () => void;
  onOpenMobileMenu?: () => void;
}

export function AppHeader({ onOpenCommandPalette, onOpenImporter, onOpenMobileMenu }: AppHeaderProps) {
  const pathname = usePathname();
  const { repositories, activeRepoId, setActiveRepoId, analysisResult, isAnalyzing, runAnalysis, getActiveRepo } = useRepoStore();

  const activeRepo = getActiveRepo();
  const healthScore = analysisResult?.healthScore || 85;
  const fileCount = Object.keys(activeRepo?.files || {}).length;

  // Compute breadcrumbs
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumbSection = pathParts[0]
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
    : 'Dashboard';

  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
      {/* Left: Mobile Toggle, Breadcrumbs & Repository Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile Drawer Trigger (visible on < lg screens) */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-[#E2E8F0] lg:hidden transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-[#64748B]">
          <Link href="/dashboard" className="text-[#64748B] hover:text-[#172033] transition-colors">
            RefactorAI
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
          <span className="text-[#172033] font-semibold">{breadcrumbSection}</span>
        </div>

        <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block"></div>

        {/* Repository Switcher Dropdown */}
        <div className="relative hidden sm:block">
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-md px-2.5 py-1 text-xs text-[#172033] transition-all cursor-pointer">
            <FolderGit2 className="w-3.5 h-3.5 text-[#E5484D]" />
            <select
              value={activeRepoId}
              onChange={(e) => setActiveRepoId(e.target.value)}
              className="bg-transparent text-xs text-[#172033] font-medium focus:outline-none appearance-none pr-5 cursor-pointer"
            >
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id} className="bg-white text-[#172033]">
                  {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Branch & File count */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#64748B]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
            <GitBranch className="w-3 h-3 text-[#E5484D]" />
            <span className="text-[#172033] font-mono">{activeRepo?.defaultBranch || 'main'}</span>
          </span>
          <span className="text-[#94A3B8]">({fileCount} files)</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden lg:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-xs text-[#64748B] hover:text-[#172033] transition-all cursor-pointer group shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5484D] transition-colors" />
          <span className="text-xs">Search workspace, commands & files...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0] rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Health Badge & Scan Actions */}
      <div className="flex items-center gap-2.5">
        {/* Health Score Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold shadow-2xs transition-all ${getHealthBadgeClass(healthScore)}`}
          title={`Code Health Index: ${healthScore}/100`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-normal">Health:</span>
          <span>{healthScore}/100</span>
        </div>

        {/* Import Repo Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenImporter}
          className="hidden sm:inline-flex text-xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#E5484D]" />
          <span>Import</span>
        </Button>

        {/* Scan Codebase Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => runAnalysis()}
          isLoading={isAnalyzing}
          className="text-xs"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAnalyzing ? 'Scanning...' : 'Scan Codebase'}</span>
        </Button>
      </div>
    </header>
  );
}

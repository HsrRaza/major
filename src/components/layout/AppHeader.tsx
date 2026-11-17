'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  ChevronDown, 
  GitBranch, 
  Activity, 
  RefreshCcw, 
  Upload, 
  Search, 
  ChevronRight,
  FolderGit2,
  Menu,
  Terminal
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
    <header className="h-14 border-b border-[#202020] bg-[#090909]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
      {/* Left: Mobile Toggle, Breadcrumbs & Repository Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Drawer Trigger (visible on < lg screens) */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-md text-[#858585] hover:text-white hover:bg-[#141414] border border-[#2B2B2B] lg:hidden transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-[#858585]">
          <Link href="/dashboard" className="text-[#858585] hover:text-[#F5F5F5] transition-colors">
            PatchPilot
          </Link>
          <ChevronRight className="w-3 h-3 text-[#5C5C5C]" />
          <span className="text-[#F5F5F5] font-semibold">{breadcrumbSection}</span>
        </div>

        <div className="h-4 w-px bg-[#202020] hidden sm:block"></div>

        {/* Repository Switcher Dropdown */}
        <div className="relative hidden sm:block">
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2B2B2B] hover:border-[#E53935]/50 rounded-[4px] px-2.5 py-1 text-xs font-mono text-[#F5F5F5] transition-all cursor-pointer">
            <FolderGit2 className="w-3.5 h-3.5 text-[#E53935]" />
            <select
              value={activeRepoId}
              onChange={(e) => setActiveRepoId(e.target.value)}
              className="bg-transparent text-xs text-[#F5F5F5] font-mono focus:outline-none appearance-none pr-5 cursor-pointer"
            >
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id} className="bg-[#141414] text-[#F5F5F5]">
                  {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#858585] absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Branch & File count */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[#858585]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#141414] border border-[#2B2B2B]">
            <GitBranch className="w-3 h-3 text-[#E53935]" />
            <span className="text-[#F5F5F5]">{activeRepo?.defaultBranch || 'main'}</span>
          </span>
          <span className="text-[#5C5C5C]">({fileCount} files)</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden lg:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#141414] border border-[#2B2B2B] hover:border-[#E53935]/50 text-xs text-[#858585] hover:text-[#F5F5F5] transition-all cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-[#858585] group-hover:text-[#FF4D4D] transition-colors" />
          <span className="font-mono text-[11px]">Search workspace, commands & files...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#858585] bg-[#1B1B1B] border border-[#2B2B2B] rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Health Badge & Scan Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Health Score Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-bold shadow-sm transition-all ${getHealthBadgeClass(healthScore)}`}
          title={`Code Health Index: ${healthScore}/100`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-normal text-[#858585]">Health:</span>
          <span>{healthScore}/100</span>
        </div>

        {/* Import Repo Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenImporter}
          className="hidden sm:inline-flex text-xs font-mono"
        >
          <Upload className="w-3.5 h-3.5 text-[#E53935]" />
          <span>Import</span>
        </Button>

        {/* Scan Codebase Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => runAnalysis()}
          isLoading={isAnalyzing}
          className="text-xs font-mono"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAnalyzing ? 'Scanning...' : 'Scan Codebase'}</span>
        </Button>
      </div>
    </header>
  );
}


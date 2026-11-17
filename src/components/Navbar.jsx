import React from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  GitBranch, 
  Activity, 
  RefreshCcw,
  Upload,
  FolderOpen,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ 
  activeRepo, 
  onSelectRepo, 
  sampleRepos = [],
  healthScore = 80, 
  onScanRepo,
  isScanning,
  onOpenImporter
}) {
  const getHealthBadgeStyle = (score) => {
    if (score >= 80) return 'bg-[#10B981]/10 border-[#10B981]/30 text-[#34D399]';
    if (score >= 60) return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FBBF24]';
    return 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#F87171]';
  };

  const fileCount = activeRepo?.files ? Object.keys(activeRepo.files).length : 0;

  return (
    <header className="h-14 border-b border-[#1E293B] bg-[#090D16] px-4 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-md">
      {/* Left Section: Brand Logo, Repository Switcher & Telemetry */}
      <div className="flex items-center gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" title="PatchPilot — AI Code Intelligence Platform">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-md shadow-[#6366F1]/25 border border-[#818CF8]/30">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-tight font-mono">
                Patch<span className="text-[#818CF8]">Pilot</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 font-bold uppercase">
                SaaS
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-[#1E293B]"></div>

        {/* Repository Switcher Dropdown */}
        <div className="relative">
          <select
            value={activeRepo?.id || ''}
            onChange={(e) => {
              const selected = sampleRepos.find(r => r.id === e.target.value);
              if (selected) onSelectRepo(selected);
            }}
            className="bg-[#111726] border border-[#1E293B] hover:border-[#6366F1]/50 text-xs text-slate-200 font-mono rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-[#6366F1] appearance-none pr-8 cursor-pointer transition-all shadow-sm"
          >
            {sampleRepos.map(repo => (
              <option key={repo.id} value={repo.id}>
                {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Branch & File Count Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#111726] text-[11px] font-mono text-slate-300 border border-[#1E293B] whitespace-nowrap shadow-sm">
            <GitBranch className="w-3.5 h-3.5 text-[#818CF8]" />
            <span className="font-semibold text-[#818CF8]">{activeRepo?.defaultBranch || 'main'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#111726] text-[11px] font-mono text-slate-300 border border-[#1E293B] whitespace-nowrap shadow-sm">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>{fileCount} files</span>
          </div>
        </div>
      </div>

      {/* Right Section: Health Pill, Importer Button, Scan Button */}
      <div className="flex items-center gap-3">
        {/* Code Health Pill */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono whitespace-nowrap font-bold shadow-sm transition-all ${getHealthBadgeStyle(healthScore)}`}
          title={`Code Health Index: ${healthScore}/100`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="text-slate-400 font-normal">Health Index:</span>
          <span>{healthScore}/100</span>
        </div>

        {/* Import Repo Button */}
        <button
          onClick={onOpenImporter}
          className="btn-secondary text-xs py-1.5 px-3 font-semibold font-mono"
          title="Import ZIP, GitHub repository, or sample codebases"
        >
          <Upload className="w-3.5 h-3.5 text-[#818CF8]" />
          <span className="hidden md:inline">Import Repo</span>
        </button>

        {/* Scan Codebase Button */}
        <button
          onClick={onScanRepo}
          disabled={isScanning}
          className="btn-primary text-xs py-1.5 px-3.5 font-semibold"
          title="Re-run AST static analysis across all files"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Analyzing AST...' : 'Scan Codebase'}</span>
        </button>
      </div>
    </header>
  );
}

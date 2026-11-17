'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  FolderGit2, 
  RefreshCcw, 
  Upload, 
  FileCode, 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  ArrowRight,
  Flame,
  Activity,
  Layers
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { HealthRadialGauge } from '@/components/dashboard/HealthRadialGauge';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { IssueDistribution } from '@/components/dashboard/IssueDistribution';
import { PriorityFindingsQueue } from '@/components/dashboard/PriorityFindingsQueue';
import { FileExplorerTable } from '@/components/dashboard/FileExplorerTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { FindingInspectorModal } from '@/components/dashboard/FindingInspectorModal';
import { RepoImporterModal } from '@/components/repository/RepoImporterModal';
import { Button } from '@/components/ui/Button';
import { CodeIssue } from '@/types/issue';

export default function DashboardPage() {
  const { getActiveRepo, analysisResult, isAnalyzing, runAnalysis } = useRepoStore();
  const [selectedIssueForReview, setSelectedIssueForReview] = useState<CodeIssue | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeRepo = getActiveRepo();

  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#FF4D4D]">
          <RefreshCcw className="w-4 h-4 animate-spin text-[#E53935]" />
          <span>Parsing AST and calculating Redline metrics...</span>
        </div>
      </div>
    );
  }

  const {
    healthScore,
    healthGrade,
    scoreExplanation,
    subScores,
    counts,
    issues,
    averageComplexity,
    totalLines,
    totalFiles,
    timestamp,
  } = analysisResult;

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Editorial Welcome Header */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#141414] via-[#111111] to-[#0D0D0D] border border-[#2B2B2B]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#E53935] uppercase px-1.5 py-0.5 rounded bg-[#E53935]/15 border border-[#E53935]/30">
              WORKSPACE
            </span>
            <h1 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2 tracking-tight">
              <FolderGit2 className="w-4 h-4 text-[#E53935]" />
              <span>{activeRepo?.owner ? `${activeRepo.owner}/${activeRepo.name}` : activeRepo?.name}</span>
            </h1>

            <span className="px-2 py-0.5 rounded bg-[#1B1B1B] text-xs font-mono text-[#F5F5F5] border border-[#2B2B2B] flex items-center gap-1.5 font-medium">
              <GitBranch className="w-3.5 h-3.5 text-[#E53935]" />
              <span>{activeRepo?.defaultBranch || 'main'}</span>
            </span>

            {activeRepo?.isCustom && (
              <span className="px-1.5 py-0.5 rounded bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30 text-[9px] font-mono uppercase font-bold">
                Custom Workspace
              </span>
            )}
          </div>

          <p className="text-xs text-[#858585] font-sans max-w-2xl">
            {activeRepo?.description || 'Repository active in PatchPilot Code Intelligence & Architectural Engine.'}
          </p>

          <div className="flex items-center gap-4 text-[11px] font-mono text-[#5C5C5C] pt-0.5">
            <span>Files: <strong className="text-[#F5F5F5]">{totalFiles}</strong></span>
            <span>Total LOC: <strong className="text-[#F5F5F5]">{totalLines}</strong></span>
            <span>Last Scan: <strong className="text-[#F5F5F5]">{mounted ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsImporterOpen(true)}
            className="font-mono text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#E53935]" />
            <span>Import</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => runAnalysis()}
            isLoading={isAnalyzing}
            className="font-mono text-xs"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing AST...' : 'Analyze Repository'}</span>
          </Button>
        </div>
      </div>

      {/* Code Health Gauge & Issue Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <HealthRadialGauge
            score={healthScore}
            grade={healthGrade}
            explanation={scoreExplanation}
            timestamp={timestamp}
          />
        </div>

        <div className="lg:col-span-5">
          <IssueDistribution counts={counts} />
        </div>
      </div>

      {/* Compact KPI Strip */}
      <MetricCards
        subScores={subScores}
        averageComplexity={averageComplexity}
        totalLines={totalLines}
      />

      {/* Priority Action Findings & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <PriorityFindingsQueue
            issues={issues}
            onSelectIssueForReview={(issue) => setSelectedIssueForReview(issue)}
          />
        </div>

        <div className="lg:col-span-4">
          <ActivityFeed />
        </div>
      </div>

      {/* Source Files Table */}
      <FileExplorerTable />

      {/* Diagnostic Finding Inspector Modal */}
      <FindingInspectorModal
        issue={selectedIssueForReview}
        onClose={() => setSelectedIssueForReview(null)}
      />

      {/* Repo Importer Modal */}
      <RepoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />
    </div>
  );
}


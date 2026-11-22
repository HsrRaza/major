'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  FolderGit2, 
  RefreshCcw, 
  Upload, 
  FileCode, 
  Sparkles,
  ArrowRight
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
        <div className="flex items-center gap-3 font-mono text-xs text-[#E5484D]">
          <RefreshCcw className="w-4 h-4 animate-spin text-[#E5484D]" />
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
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Editorial Welcome Header */}
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white border border-[#E2E8F0]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#E5484D] uppercase px-2 py-0.5 rounded bg-red-50 border border-red-200">
              WORKSPACE
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#172033] flex items-center gap-2 tracking-tight">
              <FolderGit2 className="w-5 h-5 text-[#E5484D]" />
              <span>{activeRepo?.owner ? `${activeRepo.owner}/${activeRepo.name}` : activeRepo?.name}</span>
            </h1>

            <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] text-xs font-mono text-[#172033] border border-[#E2E8F0] flex items-center gap-1.5 font-medium">
              <GitBranch className="w-3.5 h-3.5 text-[#E5484D]" />
              <span>{activeRepo?.defaultBranch || 'main'}</span>
            </span>

            {activeRepo?.isCustom && (
              <span className="px-2 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200 text-[10px] font-mono uppercase font-bold">
                Custom Workspace
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            {activeRepo?.description || 'Active repository in PatchPilot Code Intelligence & Architectural Engine.'}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-[#64748B] pt-1">
            <span>Files: <strong className="text-[#172033]">{totalFiles}</strong></span>
            <span>Total LOC: <strong className="text-[#172033]">{totalLines}</strong></span>
            <span>Last Scan: <strong className="text-[#172033]">{mounted ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsImporterOpen(true)}
            className="text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#E5484D]" />
            <span>Import</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => runAnalysis()}
            isLoading={isAnalyzing}
            className="text-xs"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing AST...' : 'Analyze Repository'}</span>
          </Button>
        </div>
      </div>

      {/* Code Health Gauge & Issue Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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

      {/* KPI Metrics Strip */}
      <MetricCards
        subScores={subScores}
        averageComplexity={averageComplexity}
        totalLines={totalLines}
      />

      {/* Priority Action Findings & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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

import React, { useState } from 'react';
import { 
  Activity, 
  Bug, 
  Folder, 
  FileCode, 
  AlertTriangle, 
  Sparkles, 
  GitBranch,
  ShieldAlert,
  Search,
  Info
} from 'lucide-react';

export default function HealthDashboard({ 
  analysisResult, 
  activeRepo,
  selectedFilePath,
  onSelectFile,
  onNavigateTab, 
  onTriggerRefactor 
}) {
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  if (!analysisResult) return null;

  const { 
    healthScore = 80, 
    scoreExplanation = '',
    subScores = {},
    counts = {}, 
    issues = [], 
    fileMetrics = {},
    circularDependencies = [],
    totalFiles = 0,
    totalLines = 0,
    averageComplexity = 1,
    maxComplexity = 1
  } = analysisResult;

  // Calculate SVG stroke offset for gauge
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Build genuine files list from active repository
  const repoFiles = activeRepo?.files || {};
  const allFileList = Object.keys(repoFiles).map(path => {
    const metrics = fileMetrics[path] || {
      lineCount: repoFiles[path]?.split('\n').length || 0,
      complexity: 1,
      layer: 'General',
      maintainabilityIndex: 85,
      issuesCount: 0
    };
    return {
      path,
      name: path.split('/').pop() || path,
      lines: metrics.lineCount,
      complexity: metrics.complexity,
      layer: metrics.layer,
      maintainabilityIndex: metrics.maintainabilityIndex,
      issuesCount: metrics.issuesCount,
      risk: metrics.complexity > 14 || metrics.issuesCount > 2 ? 'High' : (metrics.complexity > 8 || metrics.issuesCount > 0 ? 'Medium' : 'Low')
    };
  });

  const filteredFiles = allFileList.filter(f => {
    const matchesSearch = fileSearchTerm === '' || 
      f.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      f.path.toLowerCase().includes(fileSearchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || f.layer === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Top issues for quick action queue
  const urgentIssues = issues
    .filter(i => i.severity === 'Critical' || i.severity === 'High')
    .slice(0, 4);

  return (
    <div className="space-y-5 font-sans text-slate-100 animate-fadeIn">
      {/* Top Telemetry Header Bar */}
      <div className="card-linear p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090D16]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="text-base">📦</span>
            <span>{activeRepo?.owner ? `${activeRepo.owner}/${activeRepo.name}` : activeRepo?.name || 'Workspace'}</span>
          </span>
          <span className="px-2.5 py-1 rounded bg-[#111726] text-xs font-mono text-[#818CF8] border border-[#1E293B] flex items-center gap-1.5 font-semibold">
            <GitBranch className="w-3.5 h-3.5 text-[#6366F1]" /> {activeRepo?.defaultBranch || 'main'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
            healthScore >= 80 ? 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30' :
            healthScore >= 60 ? 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/30' :
            'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/30'
          }`}>
            <Activity className="w-3.5 h-3.5" /> Code Health Index: {healthScore}/100
          </span>
          {circularDependencies.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#EF4444]/10 text-[#F87171] border border-[#EF4444]/30 text-xs font-mono font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-[#EF4444]" /> {circularDependencies.length} Circular Reference{circularDependencies.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateTab('issues')}
            className="btn-secondary text-xs py-1.5 px-3 font-mono font-semibold"
          >
            <Bug className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>Explore All Findings ({issues.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Radial Health Gauge */}
        <div className="card-linear p-4 flex items-center gap-4 border-l-4 relative overflow-hidden bg-[#090D16]"
             style={{ borderLeftColor: getScoreColor(healthScore) }}>
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="#1E293B"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={getScoreColor(healthScore)}
                strokeWidth="7"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-mono tracking-tight text-white">{healthScore}</span>
              <span className="text-[9px] text-[#94A3B8] font-mono uppercase">/100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-100 font-mono">Code Health Index</div>
            <p className="text-[11px] text-[#94A3B8] leading-tight">
              {healthScore >= 80 ? 'Optimal architecture with clean boundaries' :
               healthScore >= 60 ? 'Moderate technical debt & smells detected' :
               'High-risk code smells & security debt'}
            </p>
            <button 
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="text-[10px] text-[#818CF8] hover:underline font-mono inline-flex items-center gap-1 pt-0.5"
            >
              <Info className="w-3 h-3" />
              <span>{isExplanationOpen ? 'Hide scoring formula' : 'View scoring formula'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Security & Vulnerabilities */}
        <div className="card-linear p-4 space-y-2 border-l-4 border-l-[#EF4444] bg-[#090D16]">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
            <span>Security Rating</span>
            <span className="font-bold text-[#F87171]">{subScores.security || 100}%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{counts.critical || 0}</span>
            <span className="text-xs font-sans font-normal text-[#94A3B8]">Critical Findings</span>
          </div>
          <div className="w-full bg-[#111726] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-[#EF4444] rounded-full transition-all"
              style={{ width: `${subScores.security || 100}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-[#94A3B8] font-mono">
            {counts.security || 0} security issues (eval, hardcoded secrets, SQLi)
          </div>
        </div>

        {/* Card 3: Cyclomatic Complexity & Nesting */}
        <div className="card-linear p-4 space-y-2 border-l-4 border-l-[#F59E0B] bg-[#090D16]">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
            <span>Cyclomatic Complexity</span>
            <span className="font-bold text-[#FBBF24]">Avg: {averageComplexity}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{maxComplexity}</span>
            <span className="text-xs font-sans font-normal text-[#94A3B8]">Peak Complexity</span>
          </div>
          <div className="w-full bg-[#111726] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-[#F59E0B] rounded-full transition-all"
              style={{ width: `${subScores.complexity || 80}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-[#94A3B8] font-mono">
            {counts.complexity || 0} complexity smells (deep nesting, branch explosion)
          </div>
        </div>

        {/* Card 4: Architecture & Coupling */}
        <div className="card-linear p-4 space-y-2 border-l-4 border-l-[#06B6D4] bg-[#090D16]">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
            <span>Architecture & Cycles</span>
            <span className="font-bold text-[#38BDF8]">{subScores.architecture || 100}%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{circularDependencies.length}</span>
            <span className="text-xs font-sans font-normal text-[#94A3B8]">Circular Cycles</span>
          </div>
          <div className="w-full bg-[#111726] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-[#06B6D4] rounded-full transition-all"
              style={{ width: `${subScores.architecture || 100}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-[#94A3B8] font-mono">
            {totalFiles} source files across {totalLines} lines of code
          </div>
        </div>
      </div>

      {/* Transparent Scoring Formula Expander */}
      {isExplanationOpen && (
        <div className="card-linear p-4 bg-[#111726] border-[#818CF8]/30 space-y-2 font-mono text-xs animate-slideUp">
          <div className="flex items-center gap-2 text-[#818CF8] font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Deterministic Code Health Scoring Formula Breakdown</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
            {scoreExplanation}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-[10px]">
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Maintainability:</span>
              <span className="font-bold text-white text-xs">{subScores.maintainability}%</span>
            </div>
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Complexity:</span>
              <span className="font-bold text-white text-xs">{subScores.complexity}%</span>
            </div>
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Security:</span>
              <span className="font-bold text-white text-xs">{subScores.security}%</span>
            </div>
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Architecture:</span>
              <span className="font-bold text-white text-xs">{subScores.architecture}%</span>
            </div>
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Duplication:</span>
              <span className="font-bold text-white text-xs">{subScores.duplication}%</span>
            </div>
            <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
              <span className="text-[#94A3B8] block">Testing Suite:</span>
              <span className="font-bold text-white text-xs">{subScores.testing}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Findings Queue (If Any) */}
      {urgentIssues.length > 0 && (
        <div className="card-linear p-4 space-y-3 bg-[#090D16]">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
              <h3 className="font-bold text-xs font-mono text-white">Priority Refactoring Candidates</h3>
              <span className="badge badge-critical">{urgentIssues.length} Urgent</span>
            </div>
            <button 
              onClick={() => onNavigateTab('issues')}
              className="text-[11px] text-[#818CF8] hover:underline font-mono"
            >
              View all ({issues.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentIssues.map((issue) => (
              <div 
                key={issue.id}
                className="p-3 rounded-lg bg-[#111726] border border-[#1E293B] hover:border-[#818CF8]/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className={`badge ${issue.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                      {issue.severity}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 font-mono line-clamp-1">{issue.title}</h4>
                  </div>
                  <button
                    onClick={() => onTriggerRefactor(issue)}
                    className="btn-primary text-[10px] py-1 px-2.5 font-mono shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Refactor</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8] line-clamp-2 font-sans">{issue.why}</p>
                <div className="text-[10px] text-[#64748B] font-mono flex items-center gap-2 truncate">
                  <FileCode className="w-3 h-3 text-[#818CF8] shrink-0" />
                  <span className="truncate">{issue.filePath} : line {issue.line}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genuine Repository File Explorer & Telemetry Table */}
      <div className="card-linear p-5 space-y-4 bg-[#090D16]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono">Repository File Inventory & Complexity Explorer</h3>
              <p className="text-[10px] text-[#94A3B8]">
                Real computed lines of code, cyclomatic complexity, layer classifications, and maintainability index.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter files..."
                value={fileSearchTerm}
                onChange={(e) => setFileSearchTerm(e.target.value)}
                className="bg-[#111726] border border-[#1E293B] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          </div>
        </div>

        {/* Files Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-[#94A3B8] text-[11px]">
                <th className="pb-2 font-semibold">File Path</th>
                <th className="pb-2 font-semibold">Layer</th>
                <th className="pb-2 font-semibold">LOC</th>
                <th className="pb-2 font-semibold">Complexity</th>
                <th className="pb-2 font-semibold">Maintainability</th>
                <th className="pb-2 font-semibold">Issues</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filteredFiles.map((file) => (
                <tr 
                  key={file.path} 
                  className={`hover:bg-[#111726] transition-colors ${
                    selectedFilePath === file.path ? 'bg-[#6366F1]/10' : ''
                  }`}
                >
                  <td className="py-2.5 flex items-center gap-2">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                      file.risk === 'High' ? 'text-[#F87171]' :
                      file.risk === 'Medium' ? 'text-[#FBBF24]' : 'text-[#818CF8]'
                    }`} />
                    <span 
                      onClick={() => onSelectFile(file.path)}
                      className="font-medium text-slate-200 hover:text-[#818CF8] cursor-pointer truncate max-w-xs md:max-w-md"
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#111726] border border-[#1E293B] text-[#94A3B8]">
                      {file.layer}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{file.lines}</td>
                  <td className="py-2.5">
                    <span className={`font-bold ${
                      file.complexity > 14 ? 'text-[#F87171]' :
                      file.complexity > 8 ? 'text-[#FBBF24]' : 'text-[#34D399]'
                    }`}>
                      {file.complexity}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`font-semibold ${
                      file.maintainabilityIndex < 60 ? 'text-[#F87171]' :
                      file.maintainabilityIndex < 80 ? 'text-[#FBBF24]' : 'text-[#34D399]'
                    }`}>
                      {file.maintainabilityIndex}/100
                    </span>
                  </td>
                  <td className="py-2.5">
                    {file.issuesCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30">
                        {file.issuesCount} Finding{file.issuesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#64748B]">Clean</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => {
                        const targetIssue = issues.find(i => i.filePath === file.path) || {
                          filePath: file.path,
                          title: 'Code Refactoring & Simplification',
                          why: 'Reduce cyclomatic branching and improve maintainability index.'
                        };
                        onTriggerRefactor(targetIssue);
                      }}
                      className="btn-secondary text-[10px] py-1 px-2.5 font-mono"
                    >
                      <Sparkles className="w-3 h-3 text-[#818CF8]" />
                      <span>Refactor</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

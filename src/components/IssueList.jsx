import React, { useState } from 'react';
import { 
  Bug, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Copy, 
  AlertTriangle,
  Code,
  FileCode,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export default function IssueList({ 
  issues = [], 
  onSelectIssueForReview, 
  onTriggerRefactor 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const categories = ['All', 'Security', 'Complexity', 'Performance', 'Architecture', 'Duplication'];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = searchTerm === '' || 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.why.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="card-linear p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090D16]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              Static Code Smells & Security Findings Explorer
            </h2>
            <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
              Deterministic AST violations with line/column evidence, severity rankings, and AI-assisted refactoring.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search rules, files, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111726] border border-[#1E293B] rounded-[6px] pl-9 pr-3.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
          />
        </div>
      </div>

      {/* Filter Tabs & Telemetry Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#64748B] uppercase font-bold mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-all ${
                selectedCategory === cat
                  ? 'bg-[#6366F1] text-white font-bold shadow-sm'
                  : 'bg-[#111726] text-[#94A3B8] hover:text-white border border-[#1E293B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#64748B] uppercase font-bold mr-1">Severity:</span>
          {severities.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded-[4px] text-[11px] transition-all ${
                selectedSeverity === sev
                  ? 'bg-white/20 text-white font-bold border border-white/30'
                  : 'bg-[#111726] text-[#94A3B8] hover:text-white border border-[#1E293B]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Results Counter */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono px-1">
        <span>Showing {filteredIssues.length} of {issues.length} detected code findings</span>
        {filteredIssues.length === 0 && (
          <span className="text-[#34D399]">No issues match the selected filter criteria</span>
        )}
      </div>

      {/* Issues List Cards */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="card-linear p-4 space-y-3 bg-[#090D16] border-[#1E293B] hover:border-[#818CF8]/40 transition-all"
          >
            {/* Header: Title, Category, Severity & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${getSeverityBadgeClass(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111726] text-[#818CF8] border border-[#1E293B]">
                    {issue.category} • {issue.type}
                  </span>
                  {issue.confidence && (
                    <span className="text-[10px] text-[#64748B] font-mono">
                      Confidence: {issue.confidence}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  {issue.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectIssueForReview(issue)}
                  className="btn-secondary text-xs py-1.5 px-3 font-mono font-semibold"
                  title="View detailed AI architectural audit & risk analysis"
                >
                  <Info className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span>Explain AI</span>
                </button>

                <button
                  onClick={() => onTriggerRefactor(issue)}
                  className="btn-primary text-xs py-1.5 px-3.5 font-mono font-bold"
                  title="Generate AI refactoring & view split/unified diff"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refactor with AI</span>
                </button>
              </div>
            </div>

            {/* Violation Description */}
            <p className="text-xs text-[#CBD5E1] font-sans leading-relaxed">
              {issue.why}
            </p>

            {/* File Path & Evidence Code Block */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#818CF8]">
                <FileCode className="w-3.5 h-3.5" />
                <span className="font-semibold">{issue.filePath}</span>
                <span className="text-[#64748B]">Line {issue.line} : Col {issue.column || 1}</span>
              </div>

              {issue.codeSnippet && (
                <div className="p-2.5 rounded bg-[#0D121F] border border-[#1E293B] font-mono text-xs overflow-x-auto text-[#E2E8F0] whitespace-pre-wrap">
                  {issue.codeSnippet}
                </div>
              )}
            </div>

            {/* Suggested Remediation */}
            {issue.suggestedApproach && (
              <div className="flex items-start gap-2 text-[11px] font-mono text-[#34D399] bg-[#10B981]/5 p-2 rounded border border-[#10B981]/20">
                <span className="font-bold shrink-0">Recommended Fix:</span>
                <span className="text-slate-300 font-sans">{issue.suggestedApproach}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  RefreshCw, 
  Wrench,
  Bot,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  X,
  Sparkles,
  Clock,
  ShieldCheck,
  FileCode
} from 'lucide-react';

export default function TestRunnerConsole({ 
  activeRepo,
  testResult, 
  onRunTestSuites, 
  onRollback,
  onAutoPatch,
  isRunning 
}) {
  const [activeLogFilter, setActiveLogFilter] = useState('All'); // 'All' | 'Failed' | 'Passed'
  const [expandedSuites, setExpandedSuites] = useState({});

  const toggleSuite = (fileName) => {
    setExpandedSuites(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  const summary = testResult?.summary || { total: 0, passed: 0, failed: 0, durationMs: 0 };
  const hasRegression = testResult?.hasRegression || (summary.failed > 0);
  const testSuites = testResult?.testSuites || [];
  const hasTests = testResult?.hasTests !== false && testSuites.length > 0;

  // Filter test cases
  const filteredSuites = testSuites.map(suite => {
    const matchingTests = (suite.tests || []).filter(t => {
      if (activeLogFilter === 'Failed') return !t.passed;
      if (activeLogFilter === 'Passed') return t.passed;
      return true;
    });
    return { ...suite, filteredTests: matchingTests };
  });

  return (
    <div className="space-y-4 font-mono text-xs text-slate-100 animate-fadeIn">
      {/* Top Header & Telemetry Bar */}
      <div className="card-linear p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090D16]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              Virtual Sandboxed Test Runner & Regression Guard
            </h2>
            <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
              Isolated in-memory test harness executing real unit assertions with strict timeout protection.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasRegression && (
            <button
              onClick={onRollback}
              className="btn-danger text-xs py-1.5 px-3 font-semibold"
              title="Rollback repository to pre-refactor commit state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rollback Changes</span>
            </button>
          )}

          <button
            onClick={() => onRunTestSuites(false)}
            disabled={isRunning}
            className="btn-primary text-xs py-1.5 px-4 font-bold"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Executing Tests...' : 'Run Test Suites'}</span>
          </button>
        </div>
      </div>

      {/* Regression Warning Alert Box (If Test Failed) */}
      {hasRegression && (
        <div className="p-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#FCA5A5] space-y-3 animate-slideUp shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#F87171]">
              <ShieldAlert className="w-5 h-5 text-[#EF4444] animate-pulse" />
              <span>Regression Detected: Refactoring Broke Test Assertions</span>
            </div>
            <span className="badge badge-critical">1 Failing Assertion</span>
          </div>

          <div className="p-3 bg-[#090D16] border border-[#EF4444]/30 rounded font-mono text-xs space-y-1">
            <div className="text-slate-400">
              Failed Suite: <span className="text-[#F87171] font-bold">{testResult?.failedDetails?.suite || 'userService.test.js'}</span>
            </div>
            <div className="text-slate-400">
              Test Case: <span className="text-white font-bold">{testResult?.failedDetails?.testName || 'should reject invalid email format'}</span>
            </div>
            <div className="text-[#FCA5A5] pt-1">
              Error: {testResult?.failedDetails?.error || 'Expected status 400, received 500 (TypeError: Cannot read properties of undefined)'}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onAutoPatch}
              className="btn-primary text-xs py-1.5 px-3.5 font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Patch Regression with AI</span>
            </button>
            <button
              onClick={onRollback}
              className="btn-secondary text-xs py-1.5 px-3 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Pre-Refactor Version</span>
            </button>
          </div>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] block">Total Unit Tests</span>
          <span className="text-lg font-bold text-white">{summary.total}</span>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] block">Passing Tests</span>
          <span className="text-lg font-bold text-[#34D399] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{summary.passed}</span>
          </span>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] block">Failed Tests</span>
          <span className={`text-lg font-bold flex items-center gap-1.5 ${
            summary.failed > 0 ? 'text-[#F87171]' : 'text-slate-400'
          }`}>
            {summary.failed > 0 && <ShieldAlert className="w-4 h-4 text-[#EF4444]" />}
            <span>{summary.failed}</span>
          </span>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] block">Execution Duration</span>
          <span className="text-lg font-bold text-[#818CF8] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#818CF8]" />
            <span>{summary.durationMs}ms</span>
          </span>
        </div>
      </div>

      {/* Test Suites Console */}
      <div className="card-linear p-4 space-y-3 bg-[#090D16]">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Discovered Test Suites ({testSuites.length})</span>
          </div>

          <div className="flex items-center gap-1">
            {['All', 'Passed', 'Failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveLogFilter(filter)}
                className={`px-2.5 py-1 text-[11px] rounded transition-all ${
                  activeLogFilter === filter
                    ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State when no test files exist */}
        {!hasTests && (
          <div className="p-8 text-center space-y-2 text-[#94A3B8]">
            <FileCode className="w-8 h-8 text-[#64748B] mx-auto" />
            <div className="text-xs font-bold text-slate-200">No Unit Test Files Found</div>
            <p className="text-[11px] max-w-sm mx-auto font-sans">
              This repository does not contain <code>*.test.js</code> or <code>tests/</code> suites. Add test files or load a sample repository with full test coverage.
            </p>
          </div>
        )}

        {/* Test Suites List */}
        {hasTests && (
          <div className="space-y-2">
            {filteredSuites.map((suite) => {
              const isExpanded = expandedSuites[suite.file] ?? true;
              return (
                <div 
                  key={suite.file} 
                  className="rounded-lg bg-[#111726] border border-[#1E293B] overflow-hidden"
                >
                  {/* Suite Title Bar */}
                  <div 
                    onClick={() => toggleSuite(suite.file)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#1A2338] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />}
                      <FileCode className="w-4 h-4 text-[#818CF8]" />
                      <span className="font-bold text-slate-200 truncate">{suite.file}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#64748B]">{suite.durationMs}ms</span>
                      {suite.failed > 0 ? (
                        <span className="badge badge-critical">{suite.failed} Failed</span>
                      ) : (
                        <span className="badge badge-success">{suite.passed} Passed</span>
                      )}
                    </div>
                  </div>

                  {/* Test Cases inside Suite */}
                  {isExpanded && (
                    <div className="p-3 border-t border-[#1E293B] bg-[#0D121F] space-y-1.5">
                      {(suite.filteredTests || []).map((t, idx) => (
                        <div 
                          key={idx}
                          className={`p-2 rounded text-xs flex items-start justify-between gap-2 ${
                            t.passed 
                              ? 'bg-[#111726]/60 text-slate-300' 
                              : 'bg-[#EF4444]/10 text-[#FCA5A5] border border-[#EF4444]/30'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {t.passed ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-[#EF4444] mt-0.5 shrink-0" />
                            )}
                            <div>
                              <span>{t.name}</span>
                              {t.error && (
                                <p className="text-[10px] text-[#F87171] mt-1 font-sans">{t.error}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-[#64748B] shrink-0">{t.durationMs}ms</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

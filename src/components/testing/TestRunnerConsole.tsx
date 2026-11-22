'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  FileCode, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useRefactorStore } from '@/stores/refactorStore';
import { Button } from '@/components/ui/Button';

export function TestRunnerConsole() {
  const router = useRouter();
  const { 
    getActiveRepo, 
    activeRepoId, 
    testResult, 
    runTests, 
    isRunningTests, 
    updateActiveRepoFile 
  } = useRepoStore();

  const historyLogs = useHistoryStore((state) => state.logs);
  const markRolledBack = useHistoryStore((state) => state.markRolledBack);
  const { generateProposal } = useRefactorStore();

  const [filterMode, setFilterMode] = useState<'All' | 'Failed' | 'Passed'>('All');
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!testResult && !isRunningTests) {
      runTests();
    }
  }, []);

  const activeRepo = getActiveRepo();
  const summary = testResult?.summary || { total: 0, passed: 0, failed: 0, durationMs: 0 };
  const hasRegression = testResult?.hasRegression || summary.failed > 0;
  const testSuites = testResult?.testSuites || [];
  const hasTests = testResult?.hasTests !== false && testSuites.length > 0;

  const toggleSuite = (filePath: string) => {
    setExpandedSuites((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  };

  const handleRollback = () => {
    const lastLog = historyLogs[0];
    if (!lastLog || !lastLog.originalCode) {
      alert('No previous rollback snapshot found in session history.');
      return;
    }

    updateActiveRepoFile(lastLog.file, lastLog.originalCode);
    markRolledBack(lastLog.id);
    alert(`Successfully rolled back ${lastLog.file} to pre-refactor state.`);
  };

  const handleAutoPatch = () => {
    if (!testResult?.failedDetails) return;
    const targetSuite = testResult.failedDetails.suite;
    const errorMsg = testResult.failedDetails.error;
    const testName = testResult.failedDetails.testName;

    // Find module under test
    const cleanTarget = targetSuite.replace(/^tests\//, 'src/services/').replace(/\.test\.js$/, '.js');
    const targetFile = activeRepo?.files[cleanTarget] ? cleanTarget : Object.keys(activeRepo?.files || {})[0] || '';
    const originalCode = activeRepo?.files[targetFile] || '';

    generateProposal({
      filePath: targetFile,
      originalCode,
      customPrompt: `Fix test regression in suite '${targetSuite}': Test '${testName}' failed with error: '${errorMsg}'. Preserve the architecture while satisfying all unit assertions.`,
    });

    router.push(`/refactor/${activeRepoId}`);
  };

  return (
    <div className="space-y-4 animate-fadeIn font-mono text-xs">
      {/* Top Header & Telemetry Strip */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172033] flex items-center gap-2">
              Virtual Sandboxed Test Runner & Regression Guard
            </h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Isolated in-memory Node.js VM harness executing unit test suites with strict contract validation.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasRegression && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRollback}
                title="Rollback repository to pre-refactor snapshot"
                className="text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rollback Changes</span>
              </Button>

              <Button
                variant="ai"
                size="sm"
                onClick={handleAutoPatch}
                title="Auto-generate AI patch to satisfy failing assertions"
                className="text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E5484D]" />
                <span>Auto-Patch Regression</span>
              </Button>
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => runTests()}
            isLoading={isRunningTests}
            className="text-xs"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'Running VM...' : 'Execute Test Suites'}</span>
          </Button>
        </div>
      </div>

      {/* Regression Alert Banner */}
      {hasRegression && testResult?.failedDetails && (
        <div className="p-4 sm:p-5 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-3 animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-red-900">
              <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
              <span>TEST REGRESSION DETECTED POST-REFACTORING</span>
            </div>
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold border border-red-200">
              Contract Broken
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-white space-y-1 text-xs">
            <div className="text-slate-400">Suite: <span className="text-white font-bold">{testResult.failedDetails.suite}</span></div>
            <div className="text-slate-400">Failing Test: <span className="text-amber-400 font-bold">{testResult.failedDetails.testName}</span></div>
            <div className="text-red-400 font-bold pt-1">Error: {testResult.failedDetails.error}</div>
          </div>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="surface-card p-3.5 space-y-1 bg-white">
          <span className="text-[10px] text-[#64748B] uppercase block font-semibold">Total Assertions</span>
          <span className="text-xl font-bold text-[#172033]">{summary.total}</span>
        </div>

        <div className="surface-card p-3.5 space-y-1 bg-white">
          <span className="text-[10px] text-[#64748B] uppercase block font-semibold">Passed</span>
          <span className="text-xl font-bold text-emerald-600">{summary.passed}</span>
        </div>

        <div className="surface-card p-3.5 space-y-1 bg-white">
          <span className="text-[10px] text-[#64748B] uppercase block font-semibold">Failed</span>
          <span className={`text-xl font-bold ${summary.failed > 0 ? 'text-red-600' : 'text-[#64748B]'}`}>
            {summary.failed}
          </span>
        </div>

        <div className="surface-card p-3.5 space-y-1 bg-white">
          <span className="text-[10px] text-[#64748B] uppercase block font-semibold">Execution Time</span>
          <span className="text-xl font-bold text-[#172033]">{summary.durationMs}ms</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs">
        <div className="flex items-center gap-1.5">
          {(['All', 'Failed', 'Passed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                filterMode === mode
                  ? 'bg-white text-[#172033] border border-[#E2E8F0] font-semibold shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <span className="text-[#64748B] text-xs">
          {testSuites.length} test suite{testSuites.length > 1 ? 's' : ''} discovered
        </span>
      </div>

      {/* Test Suites Tree */}
      {!hasTests ? (
        <div className="surface-card p-12 text-center space-y-2 bg-white">
          <Terminal className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h4 className="text-sm font-bold text-[#172033]">No Test Suites Discovered</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto font-sans">
            Add a file containing <code>.test.js</code> or <code>tests/</code> in your repository to enable automatic sandboxed execution.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {testSuites.map((suite) => {
            const isExpanded = expandedSuites[suite.file] ?? true;
            const matchingTests = (suite.tests || []).filter((t) => {
              if (filterMode === 'Failed') return !t.passed;
              if (filterMode === 'Passed') return t.passed;
              return true;
            });

            if (filterMode !== 'All' && matchingTests.length === 0) return null;

            return (
              <div key={suite.file} className="surface-card overflow-hidden bg-white border border-[#E2E8F0] rounded-lg shadow-2xs">
                <div
                  onClick={() => toggleSuite(suite.file)}
                  className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[#64748B]" /> : <ChevronRight className="w-4 h-4 text-[#64748B]" />}
                    <FileCode className="w-4 h-4 text-[#E5484D]" />
                    <span className="font-bold text-[#172033] text-xs">{suite.file}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-700 font-semibold">{suite.passed} passed</span>
                    {suite.failed > 0 && <span className="text-red-600 font-bold">{suite.failed} failed</span>}
                    <span className="text-[#94A3B8]">{suite.durationMs}ms</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-[#E2E8F0] p-2 bg-white">
                    {matchingTests.map((t, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <span className={t.passed ? 'text-[#172033]' : 'text-red-700 font-semibold'}>
                              {t.name}
                            </span>
                            {t.error && (
                              <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed font-mono">
                                {t.error}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] text-[#94A3B8] shrink-0 font-mono">{t.durationMs}ms</span>
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
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  FileCode, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  ShieldAlert,
  Flame,
  Check
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
      <div className="surface-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#141414] border border-[#E53935]/40 text-[#FF4D4D] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(229,57,53,0.3)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Virtual Sandboxed Test Runner & Regression Guard
            </h1>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Isolated in-memory Node.js VM harness executing unit test suites with strict timeout protection.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {hasRegression && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRollback}
                title="Rollback repository to pre-refactor snapshot"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rollback Changes</span>
              </Button>

              <Button
                variant="ai"
                size="sm"
                onClick={handleAutoPatch}
                title="Auto-generate AI patch to satisfy failing assertions"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF4D4D]" />
                <span>Auto-Patch Regression</span>
              </Button>
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => runTests()}
            isLoading={isRunningTests}
          >
            <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'Running VM...' : 'Execute Test Suites'}</span>
          </Button>
        </div>
      </div>

      {/* Regression Alert Banner */}
      {hasRegression && testResult?.failedDetails && (
        <div className="p-4 rounded bg-[#E53935]/10 border border-[#E53935]/40 text-[#FF4D4D] space-y-2.5 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <ShieldAlert className="w-4 h-4 text-[#E53935]" />
              <span>TEST REGRESSION DETECTED POST-REFACTORING</span>
            </div>
            <span className="text-[10px] bg-[#E53935]/20 text-[#FF4D4D] px-2 py-0.5 rounded uppercase font-bold border border-[#E53935]/30">
              Contract Broken
            </span>
          </div>

          <div className="p-3 rounded bg-[#0D0D0D] border border-[#E53935]/25 space-y-1 text-[11px]">
            <div className="text-[#858585]">Suite: <span className="text-white font-bold">{testResult.failedDetails.suite}</span></div>
            <div className="text-[#858585]">Failing Test: <span className="text-amber-400 font-bold">{testResult.failedDetails.testName}</span></div>
            <div className="text-[#FF4D4D] font-bold pt-1">Error: {testResult.failedDetails.error}</div>
          </div>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="surface-card p-3 space-y-1">
          <span className="text-[10px] text-[#5C5C5C] uppercase block">Total Assertions</span>
          <span className="text-xl font-black text-white">{summary.total}</span>
        </div>

        <div className="surface-card p-3 space-y-1">
          <span className="text-[10px] text-[#5C5C5C] uppercase block">Passed</span>
          <span className="text-xl font-black text-emerald-400">{summary.passed}</span>
        </div>

        <div className="surface-card p-3 space-y-1">
          <span className="text-[10px] text-[#5C5C5C] uppercase block">Failed</span>
          <span className={`text-xl font-black ${summary.failed > 0 ? 'text-[#FF4D4D]' : 'text-[#858585]'}`}>
            {summary.failed}
          </span>
        </div>

        <div className="surface-card p-3 space-y-1">
          <span className="text-[10px] text-[#5C5C5C] uppercase block">Execution Time</span>
          <span className="text-xl font-black text-white">{summary.durationMs}ms</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#202020] pb-2 text-xs">
        <div className="flex items-center gap-1.5">
          {(['All', 'Failed', 'Passed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                filterMode === mode
                  ? 'bg-[#1B1B1B] text-white border border-[#2B2B2B] font-bold'
                  : 'text-[#858585] hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <span className="text-[#858585] text-[11px]">
          {testSuites.length} test suite{testSuites.length > 1 ? 's' : ''} discovered
        </span>
      </div>

      {/* Test Suites Tree */}
      {!hasTests ? (
        <div className="surface-card p-12 text-center space-y-2">
          <Terminal className="w-8 h-8 text-[#5C5C5C] mx-auto" />
          <h4 className="text-sm font-bold text-white">No Test Suites Discovered</h4>
          <p className="text-xs text-[#858585] max-w-sm mx-auto font-sans">
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
              <div key={suite.file} className="surface-card overflow-hidden">
                <div
                  onClick={() => toggleSuite(suite.file)}
                  className="p-3 bg-[#0D0D0D] border-b border-[#202020] flex items-center justify-between cursor-pointer hover:bg-[#141414] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[#858585]" /> : <ChevronRight className="w-4 h-4 text-[#858585]" />}
                    <FileCode className="w-4 h-4 text-[#E53935]" />
                    <span className="font-bold text-white text-xs">{suite.file}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 font-bold">{suite.passed} passed</span>
                    {suite.failed > 0 && <span className="text-[#FF4D4D] font-bold">{suite.failed} failed</span>}
                    <span className="text-[#5C5C5C]">{suite.durationMs}ms</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-[#202020] p-1 bg-[#090909]">
                    {matchingTests.map((t, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#FF4D4D] shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <span className={t.passed ? 'text-[#B3B3B3]' : 'text-[#FF4D4D] font-bold'}>
                              {t.name}
                            </span>
                            {t.error && (
                              <div className="p-2 rounded bg-[#E53935]/10 border border-[#E53935]/30 text-[#FF4D4D] text-[11px] leading-relaxed">
                                {t.error}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] text-[#5C5C5C] shrink-0">{t.durationMs}ms</span>
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


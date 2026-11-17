import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HealthDashboard from './components/HealthDashboard';
import IssueList from './components/IssueList';
import CodeReviewModal from './components/CodeReviewModal';
import DiffViewer from './components/DiffViewer';
import TestRunnerConsole from './components/TestRunnerConsole';
import ArchitectureGraph from './components/ArchitectureGraph';
import RefactorHistory from './components/RefactorHistory';
import CodebaseChat from './components/CodebaseChat';
import RepoImporter from './components/RepoImporter';

import { SAMPLE_REPOSITORIES } from './services/sampleRepos';
import { analyzeCodebase } from './services/staticAnalyzer';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Key, 
  Database, 
  RefreshCcw, 
  Bot, 
  X, 
  Sliders, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sampleReposList, setSampleReposList] = useState(SAMPLE_REPOSITORIES);
  const [activeRepo, setActiveRepo] = useState(SAMPLE_REPOSITORIES[0]);
  const [selectedFilePath, setSelectedFilePath] = useState('src/services/userService.js');
  
  // Analysis State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Review & Refactor State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueExplanation, setIssueExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const [refactorProposal, setRefactorProposal] = useState(null);
  const [isGeneratingRefactor, setIsGeneratingRefactor] = useState(false);

  // Testing State
  const [testResult, setTestResult] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // History & Modal Drawers
  const [historyLogs, setHistoryLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('patchpilot_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Configurable Scoring Weights
  const [scoringWeights, setScoringWeights] = useState({
    critical: 15,
    high: 7,
    medium: 3,
    low: 1,
    circularDep: 8
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('patchpilot_history', JSON.stringify(historyLogs));
    } catch (e) {
      console.warn('Failed to persist history to localStorage:', e);
    }
  }, [historyLogs]);

  // 1. Initial Scan on Mount or Repo Switch
  useEffect(() => {
    if (activeRepo && activeRepo.files) {
      runStaticScan(activeRepo.files);
      runVirtualTests(activeRepo.files);
      // Select first file if current selected doesn't exist in repo
      const files = Object.keys(activeRepo.files);
      if (files.length > 0 && !activeRepo.files[selectedFilePath]) {
        setSelectedFilePath(files[0]);
      }
    }
  }, [activeRepo]);

  const runStaticScan = (files, weights = scoringWeights) => {
    setIsScanning(true);
    setTimeout(() => {
      const result = analyzeCodebase(files, weights);
      setAnalysisResult(result);
      setIsScanning(false);
    }, 150);
  };

  // 2. Real Sandboxed Test Execution
  const runVirtualTests = async (files) => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoFiles: files || activeRepo?.files || {}
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      console.error('Test execution error:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  // 3. AI Issue Explanation Modal Trigger
  const handleSelectIssueForReview = async (issue) => {
    setSelectedIssue(issue);
    setIssueExplanation(null);
    setIsExplaining(true);

    try {
      const fileCode = activeRepo.files[issue.filePath] || issue.codeSnippet || '';
      const res = await fetch('/api/explain-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue,
          codeSnippet: fileCode.slice(0, 1500),
          filePath: issue.filePath
        })
      });
      const data = await res.json();
      setIssueExplanation(data);
    } catch (e) {
      console.error('Explain issue error:', e);
    } finally {
      setIsExplaining(false);
    }
  };

  // 4. Trigger AI Refactoring Proposal
  const handleTriggerRefactor = async (issue, customPrompt = '') => {
    const targetFile = issue ? issue.filePath : selectedFilePath;
    const originalCode = activeRepo.files[targetFile] || '';

    setSelectedIssue(issue);
    setIsGeneratingRefactor(true);
    setActiveTab('diff');

    try {
      const res = await fetch('/api/propose-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: targetFile,
          originalCode,
          issue,
          customPrompt
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setRefactorProposal({ isAiAvailable: false, error: data.error || 'Failed to generate refactoring.' });
      } else {
        setRefactorProposal(data);
      }
    } catch (e) {
      setRefactorProposal({ isAiAvailable: false, error: e.message });
    } finally {
      setIsGeneratingRefactor(false);
    }
  };

  // 5. Apply Refactoring & Run Test Runner Verification
  const handleApplyRefactor = async () => {
    if (!refactorProposal) return;

    const targetFile = refactorProposal.filePath;
    const previousCode = activeRepo.files[targetFile];

    // Update modified file in active repository state
    const updatedFiles = {
      ...activeRepo.files,
      [targetFile]: refactorProposal.refactoredCode
    };

    setActiveRepo(prev => ({
      ...prev,
      files: updatedFiles
    }));

    // Re-run static analysis to compute new Health Score
    const newAnalysis = analyzeCodebase(updatedFiles, scoringWeights);
    setAnalysisResult(newAnalysis);

    // Append to Refactoring Audit History
    const newAudit = {
      id: `RF-${Date.now().toString().slice(-4)}`,
      file: targetFile,
      problem: refactorProposal.summary || 'Code simplification and complexity reduction',
      originalCode: previousCode,
      refactoredCode: refactorProposal.refactoredCode,
      complexityBefore: refactorProposal.metricsDelta?.complexityBefore || 1,
      complexityAfter: refactorProposal.metricsDelta?.complexityAfter || 1,
      linesBefore: refactorProposal.metricsDelta?.linesBefore || 0,
      linesAfter: refactorProposal.metricsDelta?.linesAfter || 0,
      status: 'Applied',
      model: 'Groq Llama-3.3-70b',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistoryLogs(prev => [newAudit, ...prev]);

    // Automatically trigger Test Runner Console to guard against regressions
    setActiveTab('tests');
    runVirtualTests(updatedFiles);
  };

  // 6. Reject Refactoring
  const handleRejectRefactor = () => {
    setRefactorProposal(null);
    setActiveTab('dashboard');
  };

  // 7. Rollback Changes (from Audit Log or Test Runner)
  const handleRollback = (auditLog) => {
    const targetLog = auditLog || historyLogs[0];
    if (!targetLog || !targetLog.originalCode) {
      alert('No previous rollback snapshot available.');
      return;
    }

    const updatedFiles = {
      ...activeRepo.files,
      [targetLog.file]: targetLog.originalCode
    };

    setActiveRepo(prev => ({
      ...prev,
      files: updatedFiles
    }));

    runStaticScan(updatedFiles);
    runVirtualTests(updatedFiles);

    setHistoryLogs(prev => prev.map(log => 
      log.id === targetLog.id ? { ...log, status: 'Rolled back' } : log
    ));

    alert(`Successfully rolled back changes in ${targetLog.file} to pre-refactor state.`);
  };

  // 8. Auto-Patch Regression with AI
  const handleAutoPatchRegression = () => {
    if (!testResult?.failedDetails) return;
    const prompt = `Fix regression: Test '${testResult.failedDetails.testName}' failed with error '${testResult.failedDetails.error}'. Preserve the clean architecture while satisfying all unit assertions.`;
    handleTriggerRefactor(selectedIssue, prompt);
  };

  // 9. Import Custom Repository Handler
  const handleImportCustomRepo = (newRepo) => {
    setSampleReposList(prev => [newRepo, ...prev]);
    setActiveRepo(newRepo);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-[#F8FAFC] relative">
      {/* Top Navigation Header Bar */}
      <Navbar
        activeRepo={activeRepo}
        onSelectRepo={setActiveRepo}
        sampleRepos={sampleReposList}
        healthScore={analysisResult?.healthScore || 80}
        onScanRepo={() => runStaticScan(activeRepo.files)}
        isScanning={isScanning}
        onOpenImporter={() => setIsImporterOpen(true)}
      />

      {/* Main Layout Body: Sidebar + Main Content View */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          issuesCount={analysisResult?.counts?.totalIssues || 0}
          circularDepsCount={analysisResult?.circularDependencies?.length || 0}
          testSummary={testResult?.summary}
          historyCount={historyLogs.length}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-grow overflow-y-auto p-5 view-transition">
          {activeTab === 'dashboard' && (
            <HealthDashboard
              analysisResult={analysisResult}
              activeRepo={activeRepo}
              selectedFilePath={selectedFilePath}
              onSelectFile={setSelectedFilePath}
              onNavigateTab={setActiveTab}
              onTriggerRefactor={(issue) => handleTriggerRefactor(issue)}
            />
          )}

          {activeTab === 'issues' && (
            <IssueList
              issues={analysisResult?.issues || []}
              onSelectIssueForReview={handleSelectIssueForReview}
              onTriggerRefactor={(issue) => handleTriggerRefactor(issue)}
            />
          )}

          {activeTab === 'diff' && (
            <DiffViewer
              refactorProposal={refactorProposal}
              issue={selectedIssue}
              onApplyRefactor={handleApplyRefactor}
              onRejectRefactor={handleRejectRefactor}
              onRePrompt={(prompt) => handleTriggerRefactor(selectedIssue, prompt)}
              isGenerating={isGeneratingRefactor}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureGraph
              activeRepo={activeRepo}
              analysisResult={analysisResult}
              onTriggerRefactor={(issue) => handleTriggerRefactor(issue)}
            />
          )}

          {activeTab === 'tests' && (
            <TestRunnerConsole
              activeRepo={activeRepo}
              testResult={testResult}
              onRunTestSuites={() => runVirtualTests(activeRepo?.files)}
              onRollback={() => handleRollback(historyLogs[0])}
              onAutoPatch={handleAutoPatchRegression}
              isRunning={isRunningTests}
            />
          )}

          {activeTab === 'history' && (
            <RefactorHistory 
              historyLogs={historyLogs}
              activeRepo={activeRepo}
              onRollbackLog={handleRollback}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl animate-fadeIn font-mono text-xs">
              {/* Platform Engine Settings */}
              <div className="card-linear p-5 space-y-4 bg-[#090D16]">
                <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
                  <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono">AI Reasoning Engine & Groq Cloud Settings</h2>
                    <p className="text-xs text-[#94A3B8] font-sans mt-0.5">Configure target inference models and backend integration.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Active LLM Model</label>
                    <input
                      type="text"
                      readOnly
                      value="llama-3.3-70b-versatile (Groq Cloud LPUs)"
                      className="w-full bg-[#111726] border border-[#1E293B] rounded p-2.5 text-xs text-[#818CF8] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Backend Security Architecture</label>
                    <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-xs text-[#34D399] font-mono flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                        Backend Secret Isolation Active (Key not exposed to client)
                      </span>
                      <span className="text-[10px] bg-[#10B981]/20 px-2 py-0.5 rounded font-bold uppercase">Secure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurable Health Scoring Weights */}
              <div className="card-linear p-5 space-y-4 bg-[#090D16]">
                <div className="flex items-center gap-3 border-b border-[#1E293B] pb-3">
                  <div className="p-2 rounded-lg bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono">Customizable Code Health Score Penalty Weights</h2>
                    <p className="text-xs text-[#94A3B8] font-sans mt-0.5">Customize penalty point deductions per finding severity category.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[#F87171] font-bold block text-[11px]">Critical (-pts)</label>
                    <input
                      type="number"
                      value={scoringWeights.critical}
                      onChange={(e) => {
                        const newW = { ...scoringWeights, critical: Number(e.target.value) || 0 };
                        setScoringWeights(newW);
                        runStaticScan(activeRepo.files, newW);
                      }}
                      className="w-full bg-[#111726] border border-[#1E293B] rounded p-2 text-xs font-mono text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[#FBBF24] font-bold block text-[11px]">High (-pts)</label>
                    <input
                      type="number"
                      value={scoringWeights.high}
                      onChange={(e) => {
                        const newW = { ...scoringWeights, high: Number(e.target.value) || 0 };
                        setScoringWeights(newW);
                        runStaticScan(activeRepo.files, newW);
                      }}
                      className="w-full bg-[#111726] border border-[#1E293B] rounded p-2 text-xs font-mono text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[#38BDF8] font-bold block text-[11px]">Medium (-pts)</label>
                    <input
                      type="number"
                      value={scoringWeights.medium}
                      onChange={(e) => {
                        const newW = { ...scoringWeights, medium: Number(e.target.value) || 0 };
                        setScoringWeights(newW);
                        runStaticScan(activeRepo.files, newW);
                      }}
                      className="w-full bg-[#111726] border border-[#1E293B] rounded p-2 text-xs font-mono text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[#EF4444] font-bold block text-[11px]">Cycle (-pts)</label>
                    <input
                      type="number"
                      value={scoringWeights.circularDep}
                      onChange={(e) => {
                        const newW = { ...scoringWeights, circularDep: Number(e.target.value) || 0 };
                        setScoringWeights(newW);
                        runStaticScan(activeRepo.files, newW);
                      }}
                      className="w-full bg-[#111726] border border-[#1E293B] rounded p-2 text-xs font-mono text-white mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      const defW = { critical: 15, high: 7, medium: 3, low: 1, circularDep: 8 };
                      setScoringWeights(defW);
                      runStaticScan(activeRepo.files, defW);
                    }}
                    className="btn-secondary text-[11px] py-1 px-3"
                  >
                    Reset Default Penalties
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Assistant Drawer Toggle */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all border border-white/20"
          title="Open PatchPilot AI Codebase Assistant"
        >
          {isChatDrawerOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </button>
      </div>

      {/* Slide-over AI Codebase RAG Assistant Drawer */}
      {isChatDrawerOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-96 max-w-[92vw] animate-slideUp">
          <CodebaseChat 
            activeRepo={activeRepo}
            analysisResult={analysisResult}
            onClose={() => setIsChatDrawerOpen(false)}
            onTriggerRefactor={(issue) => {
              setIsChatDrawerOpen(false);
              handleTriggerRefactor(issue);
            }} 
          />
        </div>
      )}

      {/* AI Code Review Explanation Modal */}
      <CodeReviewModal
        issue={selectedIssue}
        explanation={issueExplanation}
        onClose={() => setSelectedIssue(null)}
        onTriggerRefactor={(issue) => handleTriggerRefactor(issue)}
        isLoading={isExplaining}
      />

      {/* Repository Importer Modal */}
      <RepoImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        sampleRepos={sampleReposList}
        onSelectRepo={setActiveRepo}
        onImportCustomRepo={handleImportCustomRepo}
      />
    </div>
  );
}

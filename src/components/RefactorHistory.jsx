import React, { useState } from 'react';
import { 
  History, 
  GitPullRequest, 
  ArrowDownRight, 
  CheckCircle2, 
  Search, 
  Filter, 
  ShieldCheck, 
  ArrowRight,
  RotateCcw,
  Download,
  FileCode,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import PRGeneratorModal from './PRGeneratorModal';

export default function RefactorHistory({ 
  historyLogs = [], 
  activeRepo,
  onRollbackLog,
  onInspectLogDiff
}) {
  const [showPRModal, setShowPRModal] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [filterTerm, setFilterTerm] = useState('');

  const handleOpenPRModal = (log) => {
    setSelectedAuditLog(log);
    setShowPRModal(true);
  };

  const handleExportHistoryJSON = () => {
    const jsonStr = JSON.stringify(historyLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patchpilot-audit-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = historyLogs.filter(log => {
    if (!filterTerm) return true;
    const term = filterTerm.toLowerCase();
    return log.file.toLowerCase().includes(term) || 
      (log.problem || '').toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4 font-mono text-xs text-slate-100 animate-fadeIn">
      {/* Audit Log Header */}
      <div className="card-linear p-4 bg-[#090D16]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
              <History className="w-4 h-4 text-[#818CF8]" />
              <span>Refactoring Audit Trail & Pull Request Studio</span>
              <span className="px-2 py-0.5 rounded-full bg-[#6366F1]/15 text-[#818CF8] text-[10px] font-mono border border-[#6366F1]/30">
                {historyLogs.length} Events
              </span>
            </h2>
            <p className="text-xs text-[#94A3B8] font-sans">
              Immutable ledger tracking applied AI code transformations, complexity deltas, and rollback checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {historyLogs.length > 0 && (
              <>
                <button
                  onClick={handleExportHistoryJSON}
                  className="btn-secondary text-xs py-1.5 px-3 font-mono font-semibold"
                  title="Export audit logs to JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={() => handleOpenPRModal(historyLogs[0])}
                  className="btn-primary text-xs py-1.5 px-3.5 font-bold"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Generate Pull Request</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Input */}
        {historyLogs.length > 0 && (
          <div className="pt-3 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter history by file, ID..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full bg-[#111726] border border-[#1E293B] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
              />
            </div>
            <span className="text-[11px] text-[#64748B]">
              Showing {filteredLogs.length} of {historyLogs.length} events
            </span>
          </div>
        )}
      </div>

      {/* Empty State when no history exists */}
      {historyLogs.length === 0 && (
        <div className="card-linear p-12 text-center text-[#94A3B8] space-y-3 bg-[#090D16]">
          <History className="w-8 h-8 text-[#64748B] mx-auto" />
          <h3 className="text-xs font-bold text-slate-200">No Refactoring History Recorded Yet</h3>
          <p className="text-[11px] max-w-md mx-auto font-sans leading-relaxed">
            When you propose and apply refactorings in the <strong>Refactoring Studio</strong>, each applied change is recorded here with complexity deltas, rollback checkpoints, and pull request generators.
          </p>
        </div>
      )}

      {/* Audit Log Table */}
      {historyLogs.length > 0 && (
        <div className="card-linear overflow-hidden bg-[#090D16]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#111726] text-[#64748B] text-[10px] uppercase font-bold">
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Target File</th>
                  <th className="p-3">Change Summary</th>
                  <th className="p-3">Complexity</th>
                  <th className="p-3">LOC Delta</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredLogs.map((log) => {
                  const linesSaved = (log.linesBefore || 0) - (log.linesAfter || 0);
                  const isRolledBack = log.status === 'Rolled back';

                  return (
                    <tr key={log.id} className="hover:bg-[#111726]/60 transition-colors">
                      <td className="p-3 font-bold text-[#818CF8]">
                        <div className="flex items-center gap-1.5">
                          <span>{log.id}</span>
                          <span className="text-[9px] text-[#64748B] block font-normal">{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-200 font-semibold truncate max-w-xs" title={log.file}>
                        {log.file}
                      </td>
                      <td className="p-3 text-[#94A3B8] max-w-sm truncate font-sans text-xs">
                        {log.problem}
                      </td>
                      <td className="p-3">
                        <span className="text-[#F87171]">{log.complexityBefore}</span>
                        <span className="mx-1 text-[#64748B]">→</span>
                        <span className="text-[#34D399] font-bold">{log.complexityAfter}</span>
                      </td>
                      <td className="p-3">
                        <span className={linesSaved >= 0 ? 'text-[#34D399] font-bold' : 'text-[#F87171]'}>
                          {linesSaved > 0 ? `-${linesSaved}` : linesSaved} lines
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isRolledBack
                            ? 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30'
                            : 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                        }`}>
                          {log.status || 'Applied'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isRolledBack && onRollbackLog && (
                            <button
                              onClick={() => onRollbackLog(log)}
                              className="btn-secondary text-[10px] py-1 px-2 text-[#F87171] hover:text-[#EF4444]"
                              title="Restore file back to pre-refactor version"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenPRModal(log)}
                            className="btn-secondary text-[10px] py-1 px-2.5 font-bold"
                          >
                            <GitPullRequest className="w-3 h-3 text-[#818CF8]" />
                            <span>PR</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GitHub PR Generator Modal */}
      <PRGeneratorModal
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        auditLog={selectedAuditLog}
        activeRepo={activeRepo}
      />
    </div>
  );
}

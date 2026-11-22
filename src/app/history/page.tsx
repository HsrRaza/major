'use client';

import React from 'react';
import { 
  History, 
  RotateCcw, 
  Download, 
  Trash2, 
  FileCode, 
  Cpu, 
  Clock 
} from 'lucide-react';
import { useHistoryStore } from '@/stores/historyStore';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/Button';

export default function HistoryPage() {
  const { logs, markRolledBack, clearHistory, exportJson } = useHistoryStore();
  const { updateActiveRepoFile } = useRepoStore();

  const handleRollback = (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log || !log.originalCode) {
      alert('Snapshot missing for this audit log.');
      return;
    }

    updateActiveRepoFile(log.file, log.originalCode);
    markRolledBack(log.id);
    alert(`Successfully reverted ${log.file} to pre-refactor state.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fadeIn">
      {/* Header Bar */}
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <History className="w-5 h-5 text-[#E5484D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                Refactoring Audit Log & Snapshots
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200 font-bold">
                SNAPSHOT ENGINE
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Chronological immutable audit trail of AI refactoring proposals, complexity deltas, and one-click rollback snapshots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportJson}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-[#64748B] hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* History Log List */}
      {logs.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-3 bg-white">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-[#94A3B8] flex items-center justify-center mx-auto shadow-2xs">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#172033]">
            No Refactor Operations Recorded Yet
          </h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto font-sans">
            When you accept an AI refactoring proposal in the Refactoring Studio, an immutable rollback snapshot will appear here with before/after complexity verification.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 font-mono text-xs">
          {logs.map((log) => {
            const isRolledBack = log.status === 'Rolled back';

            return (
              <div
                key={log.id}
                className="surface-card p-4 sm:p-5 space-y-3 hover:border-[#CBD5E1] transition-all bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033]">
                      {log.id}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#172033] font-bold">
                      <FileCode className="w-3.5 h-3.5 text-[#E5484D]" />
                      <span>{log.file}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                        isRolledBack
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#E5484D]" />
                      <span>{log.model}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#94A3B8]">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 space-y-1.5">
                    <p className="text-xs text-[#475569] font-sans">{log.problem}</p>
                    <div className="flex items-center gap-4 text-xs text-[#64748B]">
                      <span>
                        Complexity: <span className="text-red-600 font-bold">{log.complexityBefore}</span> → <span className="text-emerald-600 font-bold">{log.complexityAfter}</span>
                      </span>
                      <span className="text-[#CBD5E1]">•</span>
                      <span>
                        LOC: <strong className="text-[#172033]">{log.linesBefore}</strong> → <strong className="text-[#172033]">{log.linesAfter}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-start md:justify-end">
                    {!isRolledBack && (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleRollback(log.id)}
                        className="text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Snapshot</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

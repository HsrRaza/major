'use client';

import React from 'react';
import { 
  History, 
  RotateCcw, 
  Download, 
  Trash2, 
  FileCode, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  TrendingDown,
  Clock
} from 'lucide-react';
import { useHistoryStore } from '@/stores/historyStore';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/Button';

export default function HistoryPage() {
  const { logs, markRolledBack, clearHistory, exportJson } = useHistoryStore();
  const { updateActiveRepoFile, getActiveRepo } = useRepoStore();
  const activeRepo = getActiveRepo();

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
      <div className="surface-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#141414] border border-[#2B2B2B] text-[#FF4D4D] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F5F5F5] font-mono tracking-tight uppercase">
                Refactoring Audit Log & Snapshots
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]">
                SNAPSHOT ENGINE
              </span>
            </div>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
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
                className="font-mono text-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#B3B3B3]" />
                <span>Export JSON</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="font-mono text-xs text-[#858585] hover:text-[#FF4D4D]"
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
        <div className="surface-card p-12 text-center space-y-3 bg-[#0D0D0D]">
          <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#2B2B2B] text-[#858585] flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wide">
            No Refactor Operations Recorded Yet
          </h4>
          <p className="text-xs text-[#858585] max-w-sm mx-auto font-sans">
            When you accept an AI refactoring proposal in the Refactoring Studio, an immutable rollback snapshot will appear here with before/after complexity verification.
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-xs">
          {logs.map((log) => {
            const isRolledBack = log.status === 'Rolled back';

            return (
              <div
                key={log.id}
                className="surface-card p-4 space-y-3 hover:border-[#E53935]/40 transition-all bg-[#0D0D0D]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202020] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded font-bold bg-[#141414] border border-[#2B2B2B] text-[#FF4D4D]">
                      {log.id}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#F5F5F5] font-bold">
                      <FileCode className="w-3.5 h-3.5 text-[#FF4D4D]" />
                      <span>{log.file}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                        isRolledBack
                          ? 'bg-[#E53935]/15 text-[#FF4D4D] border-[#E53935]/30'
                          : 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#858585]">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#FF4D4D]" />
                      <span>{log.model}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 space-y-1">
                    <p className="text-xs text-[#B3B3B3] font-sans">{log.problem}</p>
                    <div className="flex items-center gap-4 text-[11px] text-[#858585]">
                      <span>
                        Complexity: <span className="text-[#FF4D4D]">{log.complexityBefore}</span> → <span className="text-[#22C55E] font-bold">{log.complexityAfter}</span>
                      </span>
                      <span className="text-[#2B2B2B]">•</span>
                      <span>
                        LOC: <span>{log.linesBefore}</span> → <span>{log.linesAfter}</span>
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-start md:justify-end">
                    {!isRolledBack && (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleRollback(log.id)}
                        className="font-mono text-xs"
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

'use client';

import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  RefreshCcw, 
  Clock 
} from 'lucide-react';
import { useHistoryStore } from '@/stores/historyStore';
import { useRepoStore } from '@/stores/repoStore';

export function ActivityFeed() {
  const historyLogs = useHistoryStore((state) => state.logs);
  const testResult = useRepoStore((state) => state.testResult);
  const activeRepo = useRepoStore((state) => state.getActiveRepo());

  const activities = [
    ...(testResult?.timestamp ? [{
      type: 'test',
      title: 'Virtual VM Test Suite Executed',
      detail: `${testResult.summary.passed}/${testResult.summary.total} assertions passed in ${testResult.summary.durationMs}ms`,
      timestamp: new Date(testResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: Terminal,
      color: testResult.hasRegression ? 'text-red-600' : 'text-emerald-600',
    }] : []),
    ...historyLogs.slice(0, 4).map((log) => ({
      type: 'refactor',
      title: `AI Refactor Applied on ${log.file.split('/').pop()}`,
      detail: `Reduced complexity from ${log.complexityBefore} to ${log.complexityAfter}`,
      timestamp: log.timestamp,
      icon: Sparkles,
      color: 'text-[#E5484D]',
    })),
    {
      type: 'scan',
      title: `AST Codebase Indexed: ${activeRepo?.name}`,
      detail: `${Object.keys(activeRepo?.files || {}).length} files parsed with Babel`,
      timestamp: 'Just now',
      icon: RefreshCcw,
      color: 'text-[#64748B]',
    },
  ];

  return (
    <div className="surface-card p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between bg-white">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E5484D]" />
          <h4 className="font-semibold text-xs text-[#172033] uppercase tracking-wider font-mono">
            Repository Activity
          </h4>
        </div>
        <span className="text-xs text-[#64748B]">Live Telemetry</span>
      </div>

      <div className="space-y-3">
        {activities.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
            >
              <div className="p-1.5 rounded-md bg-white border border-[#E2E8F0] shrink-0 mt-0.5 shadow-2xs">
                <Icon className={`w-3.5 h-3.5 ${act.color}`} />
              </div>
              <div className="flex-grow space-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#172033] truncate">{act.title}</span>
                  <span className="text-[11px] text-[#94A3B8] shrink-0 font-mono">{act.timestamp}</span>
                </div>
                <p className="text-xs text-[#64748B] font-sans truncate">{act.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

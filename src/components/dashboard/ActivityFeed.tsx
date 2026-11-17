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
      color: testResult.hasRegression ? 'text-[#FF4D4D]' : 'text-emerald-400',
    }] : []),
    ...historyLogs.slice(0, 4).map((log) => ({
      type: 'refactor',
      title: `AI Refactor Applied on ${log.file.split('/').pop()}`,
      detail: `Reduced complexity from ${log.complexityBefore} to ${log.complexityAfter}`,
      timestamp: log.timestamp,
      icon: Sparkles,
      color: 'text-[#FF4D4D]',
    })),
    {
      type: 'scan',
      title: `AST Codebase Indexed: ${activeRepo?.name}`,
      detail: `${Object.keys(activeRepo?.files || {}).length} files parsed with Babel`,
      timestamp: 'Just now',
      icon: RefreshCcw,
      color: 'text-[#858585]',
    },
  ];

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3.5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E53935]" />
          <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Repository Activity
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#858585]">Live Telemetry</span>
      </div>

      <div className="space-y-2.5">
        {activities.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded bg-[#0D0D0D] border border-[#2B2B2B]"
            >
              <div className="p-1.5 rounded bg-[#141414] border border-[#2B2B2B] shrink-0 mt-0.5">
                <Icon className={`w-3.5 h-3.5 ${act.color}`} />
              </div>
              <div className="flex-grow space-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#F5F5F5] truncate">{act.title}</span>
                  <span className="text-[10px] text-[#5C5C5C] shrink-0">{act.timestamp}</span>
                </div>
                <p className="text-[11px] text-[#858585] font-sans truncate">{act.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


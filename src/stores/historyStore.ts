import { create } from 'zustand';
import { RefactorAuditLog } from '@/types/refactor';

interface HistoryState {
  logs: RefactorAuditLog[];
  addLog: (log: RefactorAuditLog) => void;
  markRolledBack: (logId: string) => void;
  clearHistory: () => void;
  exportJson: () => void;
}

const STORAGE_KEY = 'patchpilot_refactor_history';

const getInitialLogs = (): RefactorAuditLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  logs: getInitialLogs(),

  addLog: (log: RefactorAuditLog) => {
    const nextLogs = [log, ...get().logs];
    set({ logs: nextLogs });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogs));
      } catch (e) {
        console.warn('Failed to save history to localStorage:', e);
      }
    }
  },

  markRolledBack: (logId: string) => {
    const nextLogs = get().logs.map(l =>
      l.id === logId ? { ...l, status: 'Rolled back' as const } : l
    );
    set({ logs: nextLogs });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogs));
      } catch (e) {
        console.warn('Failed to save history to localStorage:', e);
      }
    }
  },

  clearHistory: () => {
    set({ logs: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  exportJson: () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(get().logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `patchpilot-audit-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
}));

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  RefreshCw, 
  Save 
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/Button';
import { checkBackendHealth, HealthResponse } from '@/lib/api';

export default function SettingsPage() {
  const { scoringWeights, setScoringWeights, resetDefaultWeights } = useRepoStore();
  const [weights, setWeights] = useState(scoringWeights);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await checkBackendHealth();
      setBackendHealth(data);
    } catch (err) {
      setBackendHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setScoringWeights(weights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    resetDefaultWeights();
    setWeights({
      critical: 15,
      high: 7,
      medium: 3,
      low: 1,
      circularDep: 8,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn text-xs">
      {/* Header Bar */}
      <div className="surface-card p-5 sm:p-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Settings className="w-5 h-5 text-[#E5484D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                Platform & Analysis Configuration
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200 font-bold">
                PREFERENCES
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Calibrate AST penalty deductions, inspect Express backend runtime, and verify Groq LPU connectivity.
            </p>
          </div>
        </div>
      </div>

      {/* Backend & AI Engine Telemetry Card */}
      <div className="surface-card p-5 sm:p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2 text-[#172033] font-bold text-xs uppercase tracking-tight font-mono">
            <Cpu className="w-4 h-4 text-[#E5484D]" />
            <span>AI Reasoning Engine & Backend Service</span>
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={checkHealth}
            isLoading={isCheckingHealth}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Telemetry</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">Active Inference Model</span>
            <span className="text-[#172033] font-bold text-xs font-mono">{backendHealth?.model || 'llama-3.3-70b-versatile'}</span>
            <span className="text-[11px] text-[#E5484D] block font-mono">Hardware: Groq Cloud LPU Tensor Unit</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">Express Backend Daemon (Port 3008)</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'online' ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
              <span className="text-[#172033] font-bold">{backendHealth?.status === 'online' ? 'Connected & Healthy' : 'Offline / Unreachable'}</span>
            </div>
            <span className="text-[11px] text-[#64748B] block font-mono">Node Runtime: {backendHealth?.nodeVersion || 'v24'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero-Trust Server Secret Isolation: GROQ_API_KEY is isolated on port 3008 and never exposed to the client bundle.</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold uppercase shrink-0 font-mono">
            SECURE
          </span>
        </div>
      </div>

      {/* Code Health Penalty Weights Form */}
      <form onSubmit={handleSaveWeights} className="surface-card p-5 sm:p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2 text-[#172033] font-bold text-xs uppercase tracking-tight font-mono">
            <Sliders className="w-4 h-4 text-[#E5484D]" />
            <span>Code Health Index Deductions (-points per occurrence)</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleReset}
            className="text-[#64748B] hover:text-[#172033]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] text-red-600 font-bold block">Critical (-pts)</label>
            <input
              type="number"
              value={weights.critical}
              onChange={(e) => setWeights({ ...weights, critical: Number(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#E5484D] focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-amber-700 font-bold block">High (-pts)</label>
            <input
              type="number"
              value={weights.high}
              onChange={(e) => setWeights({ ...weights, high: Number(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#E5484D] focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-700 font-bold block">Medium (-pts)</label>
            <input
              type="number"
              value={weights.medium}
              onChange={(e) => setWeights({ ...weights, medium: Number(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#E5484D] focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#64748B] font-bold block">Low (-pts)</label>
            <input
              type="number"
              value={weights.low}
              onChange={(e) => setWeights({ ...weights, low: Number(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#E5484D] focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-red-600 font-bold block">Cycle Loop (-pts)</label>
            <input
              type="number"
              value={weights.circularDep}
              onChange={(e) => setWeights({ ...weights, circularDep: Number(e.target.value) || 0 })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#E5484D] focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Penalty weights saved to workspace state.</span>
              </span>
            )}
          </div>
          <Button type="submit" variant="primary" size="sm">
            <Save className="w-3.5 h-3.5" />
            <span>Save Penalty Weights</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

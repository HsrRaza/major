'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  RefreshCw,
  Terminal,
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
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn font-mono text-xs">
      {/* Header Bar */}
      <div className="surface-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#141414] border border-[#2B2B2B] text-[#FF4D4D] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F5F5F5] font-mono tracking-tight uppercase">
                Platform & Analysis Configuration
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]">
                REDLINE PREFERENCES
              </span>
            </div>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Calibrate AST penalty deductions, inspect Express backend runtime, and verify Groq LPU connectivity.
            </p>
          </div>
        </div>
      </div>

      {/* Backend & AI Engine Telemetry Card */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#202020] pb-3">
          <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-xs uppercase tracking-tight">
            <Cpu className="w-4 h-4 text-[#FF4D4D]" />
            <span>AI Reasoning Engine & Backend Service</span>
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={checkHealth}
            isLoading={isCheckingHealth}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Telemetry</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#202020] space-y-1">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Active Inference Model</span>
            <span className="text-[#F5F5F5] font-bold text-xs">{backendHealth?.model || 'llama-3.3-70b-versatile'}</span>
            <span className="text-[10px] text-[#FF4D4D] block font-mono">Hardware: Groq Cloud LPU Tensor Unit</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#202020] space-y-1">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Express Backend Daemon (Port 3008)</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'online' ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'}`} />
              <span className="text-[#F5F5F5] font-bold">{backendHealth?.status === 'online' ? 'Connected & Healthy' : 'Offline / Unreachable'}</span>
            </div>
            <span className="text-[10px] text-[#858585] block font-mono">Node Runtime: {backendHealth?.nodeVersion || 'v24'}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#141414] border border-[#202020] text-[#B3B3B3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span>Zero-Trust Server Secret Isolation: GROQ_API_KEY is isolated on port 3008 and never exposed to the client bundle.</span>
          </div>
          <span className="text-[10px] bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 px-2 py-0.5 rounded font-bold uppercase">
            SECURE
          </span>
        </div>
      </div>

      {/* Code Health Penalty Weights Form */}
      <form onSubmit={handleSaveWeights} className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#202020] pb-3">
          <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-xs uppercase tracking-tight">
            <Sliders className="w-4 h-4 text-[#F59E0B]" />
            <span>Code Health Index Deductions (-points per occurrence)</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleReset}
            className="text-[#858585] hover:text-[#F5F5F5]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-[#FF4D4D] font-bold block">Critical (-pts)</label>
            <input
              type="number"
              value={weights.critical}
              onChange={(e) => setWeights({ ...weights, critical: Number(e.target.value) || 0 })}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#F59E0B] font-bold block">High (-pts)</label>
            <input
              type="number"
              value={weights.high}
              onChange={(e) => setWeights({ ...weights, high: Number(e.target.value) || 0 })}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#B3B3B3] font-bold block">Medium (-pts)</label>
            <input
              type="number"
              value={weights.medium}
              onChange={(e) => setWeights({ ...weights, medium: Number(e.target.value) || 0 })}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#858585] font-bold block">Low (-pts)</label>
            <input
              type="number"
              value={weights.low}
              onChange={(e) => setWeights({ ...weights, low: Number(e.target.value) || 0 })}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#FF4D4D] font-bold block">Cycle Loop (-pts)</label>
            <input
              type="number"
              value={weights.circularDep}
              onChange={(e) => setWeights({ ...weights, circularDep: Number(e.target.value) || 0 })}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-[#22C55E] text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
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

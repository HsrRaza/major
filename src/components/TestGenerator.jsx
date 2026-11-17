import React, { useState } from 'react';
import { Terminal, Sparkles, CheckCircle2, Copy, Check, FileCode, Play } from 'lucide-react';

export default function TestGenerator({ filePath = 'src/services/userService.js', codeContent = '' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testSuite, setTestSuite] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateTests = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, codeContent })
      });
      const data = await res.json();
      setTestSuite(data);
    } catch (e) {
      console.error('Test gen error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (testSuite?.testCode) {
      navigator.clipboard.writeText(testSuite.testCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card-linear p-5 space-y-4 font-mono text-xs text-slate-100 bg-[#090D16] animate-fadeIn">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-mono">AI Unit Test Suite Generator</h3>
            <p className="text-[10px] text-[#94A3B8]">Generates comprehensive Vitest / Jest unit tests with 100% path coverage</p>
          </div>
        </div>

        <button
          onClick={handleGenerateTests}
          disabled={isGenerating}
          className="btn-success text-xs py-1.5 px-3.5 font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Generating Tests...' : 'Generate Unit Tests'}</span>
        </button>
      </div>

      {testSuite && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-[#38BDF8]">
              <FileCode className="w-3.5 h-3.5" />
              {testSuite.testFileName}
            </span>
            <button onClick={handleCopyCode} className="text-[#818CF8] hover:underline flex items-center gap-1 text-[11px]">
              {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Code!' : 'Copy Jest Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#0B0F19] rounded-[6px] text-[11px] text-[#CBD5E1] border border-[#1E293B] overflow-x-auto max-h-64 leading-relaxed font-mono">
            <code>{testSuite.testCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

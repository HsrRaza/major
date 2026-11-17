'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Code, 
  FolderGit2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  FileArchive, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useRepoStore } from '@/stores/repoStore';
import { uploadZipArchive, importGithubRepo } from '@/lib/api';
import { Repository } from '@/types/repository';

interface RepoImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RepoImporterModal({ isOpen, onClose }: RepoImporterModalProps) {
  const [activeTab, setActiveTab] = useState<'sample' | 'github' | 'zip' | 'direct'>('sample');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [directName, setDirectName] = useState('custom-module');
  const [directPath, setDirectPath] = useState('src/index.js');
  const [directCode, setDirectCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { repositories, setActiveRepoId, importCustomRepo } = useRepoStore();

  const handleSelectSample = (id: string) => {
    setActiveRepoId(id);
    onClose();
  };

  const handleGithubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await importGithubRepo(githubUrl.trim(), githubBranch.trim() || 'main');
      const newRepo: Repository = {
        id: `gh-${Date.now()}`,
        name: data.repoName.split('/')[1] || data.repoName,
        owner: data.repoName.split('/')[0] || 'github',
        description: `Imported from public GitHub repository: ${githubUrl}`,
        language: 'JavaScript / TypeScript',
        defaultBranch: data.branch || 'main',
        files: data.files,
        isCustom: true,
        importedAt: new Date().toISOString(),
      };

      importCustomRepo(newRepo);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import GitHub repository.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await uploadZipArchive(file);
      const newRepo: Repository = {
        id: `zip-${Date.now()}`,
        name: data.repoName,
        owner: 'local-upload',
        description: `Imported ZIP archive (${data.fileCount} code files)`,
        language: 'Auto-detected',
        defaultBranch: 'main',
        files: data.files,
        isCustom: true,
        importedAt: new Date().toISOString(),
      };

      importCustomRepo(newRepo);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract ZIP archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCode.trim() || !directPath.trim()) return;

    const newRepo: Repository = {
      id: `custom-${Date.now()}`,
      name: directName.trim() || 'custom-codebase',
      owner: 'developer',
      description: 'Custom code snippet workspace',
      language: 'JavaScript',
      defaultBranch: 'main',
      files: {
        'package.json': JSON.stringify({ name: directName.trim(), version: '1.0.0' }, null, 2),
        [directPath.trim()]: directCode,
      },
      isCustom: true,
      importedAt: new Date().toISOString(),
    };

    importCustomRepo(newRepo);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#141414] border border-[#E53935]/40 text-[#FF4D4D] flex items-center justify-center">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Repository Workspace Manager</h3>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Import a live GitHub repo, upload a ZIP archive, or select an authentic sample codebase.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#202020] pb-3 text-xs font-mono">
          <button
            onClick={() => setActiveTab('sample')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'sample'
                ? 'bg-[#E53935] text-white font-semibold shadow-sm shadow-[#E53935]/30'
                : 'text-[#858585] hover:text-white hover:bg-[#1B1B1B]'
            }`}
          >
            Sample Repositories
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'github'
                ? 'bg-[#E53935] text-white font-semibold shadow-sm shadow-[#E53935]/30'
                : 'text-[#858585] hover:text-white hover:bg-[#1B1B1B]'
            }`}
          >
            GitHub Import
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-[#E53935] text-white font-semibold shadow-sm shadow-[#E53935]/30'
                : 'text-[#858585] hover:text-white hover:bg-[#1B1B1B]'
            }`}
          >
            Upload ZIP
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-[#E53935] text-white font-semibold shadow-sm shadow-[#E53935]/30'
                : 'text-[#858585] hover:text-white hover:bg-[#1B1B1B]'
            }`}
          >
            Paste Code
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded bg-[#E53935]/10 border border-[#E53935]/40 text-[#FF4D4D] text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Sample Repositories */}
        {activeTab === 'sample' && (
          <div className="space-y-3">
            <p className="text-xs text-[#858585] font-sans">
              Choose from pre-configured production repositories with authentic architectural smells, security vulnerabilities, and runnable VM test suites:
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {repositories.map(repo => (
                <div
                  key={repo.id}
                  onClick={() => handleSelectSample(repo.id)}
                  className="surface-card p-3.5 flex items-center justify-between hover:border-[#E53935]/50 cursor-pointer group transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs text-white group-hover:text-[#FF4D4D] transition-colors">
                        {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
                      </span>
                      <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[#1B1B1B] border border-[#2B2B2B] text-[#858585]">
                        {repo.language || 'JS'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#858585] max-w-md font-sans">
                      {repo.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-[#858585] group-hover:text-white">
                    <span>{Object.keys(repo.files).length} files</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#FF4D4D]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: GitHub Import */}
        {activeTab === 'github' && (
          <form onSubmit={handleGithubImport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#F5F5F5] font-semibold block">
                Public GitHub Repository URL
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-[#858585] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="https://github.com/facebook/react or https://github.com/expressjs/express"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-9 pr-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#E53935]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#F5F5F5] font-semibold block">
                Target Branch
              </label>
              <input
                type="text"
                placeholder="main (or master)"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#E53935]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
                <Upload className="w-3.5 h-3.5" />
                <span>Import Repository Tree</span>
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Upload ZIP */}
        {activeTab === 'zip' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#2B2B2B] hover:border-[#E53935]/50 rounded-xl p-8 text-center space-y-3 cursor-pointer bg-[#0D0D0D]/50 transition-all relative">
              <input
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                disabled={isLoading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded bg-[#141414] border border-[#E53935]/30 text-[#FF4D4D] flex items-center justify-center mx-auto">
                <FileArchive className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-white">
                  Drop repository .ZIP file here or click to browse
                </p>
                <p className="text-[11px] text-[#858585] font-sans">
                  Automatically extracts source code, excludes node_modules/.git, and runs security scans.
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#FF4D4D]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#E53935]" />
                <span>Extracting ZIP archive and parsing ASTs...</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Direct Code Input */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#F5F5F5] font-semibold block">Repository / Module Name</label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#E53935]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#F5F5F5] font-semibold block">File Path</label>
                <input
                  type="text"
                  value={directPath}
                  onChange={(e) => setDirectPath(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#E53935]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#F5F5F5] font-semibold block">Source Code</label>
              <textarea
                rows={8}
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value)}
                placeholder="// Paste JavaScript or TypeScript code here..."
                className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-3 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Workspace
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

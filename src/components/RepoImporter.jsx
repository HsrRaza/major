import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Folder, 
  FileCode, 
  Sparkles, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  Database,
  Code
} from 'lucide-react';
import JSZip from 'jszip';

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  );
}

export default function RepoImporter({ 
  isOpen, 
  onClose, 
  sampleRepos = [], 
  onSelectRepo, 
  onImportCustomRepo 
}) {
  const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'github' | 'zip' | 'direct'
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Direct code input state
  const [directFileName, setDirectFileName] = useState('src/services/customService.js');
  const [directCode, setDirectCode] = useState(`// Paste or edit your JavaScript/TypeScript code here
const calculateDiscount = (cart, user) => {
  let discount = 0;
  if (user && user.isVip) {
    if (cart.total > 100) {
      discount = cart.total * 0.20;
    } else {
      discount = cart.total * 0.10;
    }
  }
  return discount;
};

module.exports = { calculateDiscount };`);

  if (!isOpen) return null;

  // 1. GitHub Import
  const handleGithubImport = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setErrorMsg('Please enter a valid GitHub repository URL.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setImportStatus('Contacting GitHub API and fetching recursive git tree...');

    try {
      const res = await fetch('/api/github-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl: githubUrl.trim(), 
          branch: githubBranch.trim() || 'main' 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import GitHub repository.');
      }

      setImportStatus(`Successfully fetched ${Object.keys(data.files).length} code files!`);
      const newRepo = {
        id: `github-${data.repoName.replace('/', '-')}`,
        name: data.repoName.split('/')[1] || data.repoName,
        owner: data.repoName.split('/')[0] || 'github',
        description: `Imported GitHub repository (${data.repoName}) on branch ${data.branch}`,
        language: 'JavaScript / TypeScript',
        framework: 'Imported',
        defaultBranch: data.branch,
        files: data.files
      };

      onImportCustomRepo(newRepo);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
      setImportStatus('');
    }
  };

  // 2. Client-Side Safe ZIP Archive Extraction
  const handleZipFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('Please select a valid .zip file archive.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setImportStatus('Extracting ZIP archive safely and filtering code files...');

    try {
      const zip = await JSZip.loadAsync(file);
      const filesMap = {};
      let extractedCount = 0;
      const ignoredExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf'];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;

        // Path traversal protection
        if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
          continue;
        }

        // Filter out build folders and heavy dependencies
        if (
          relativePath.includes('node_modules/') ||
          relativePath.includes('.git/') ||
          relativePath.includes('dist/') ||
          relativePath.includes('build/') ||
          relativePath.includes('.next/') ||
          relativePath.includes('coverage/') ||
          relativePath.includes('.DS_Store')
        ) {
          continue;
        }

        const lowerPath = relativePath.toLowerCase();
        if (ignoredExtensions.some(ext => lowerPath.endsWith(ext))) {
          continue;
        }

        try {
          const text = await zipEntry.async('string');
          if (text.length <= 600000) {
            let cleanPath = relativePath;
            const slashIdx = cleanPath.indexOf('/');
            if (slashIdx !== -1 && !cleanPath.startsWith('src/') && !cleanPath.startsWith('tests/')) {
              const rootCandidate = cleanPath.substring(0, slashIdx);
              if (Object.keys(zip.files).every(f => f.startsWith(rootCandidate + '/') || f === rootCandidate)) {
                cleanPath = cleanPath.substring(slashIdx + 1);
              }
            }
            if (cleanPath) {
              filesMap[cleanPath] = text;
              extractedCount++;
            }
          }
        } catch (readErr) {
          console.warn('Failed to read entry:', relativePath, readErr);
        }

        if (extractedCount >= 80) break;
      }

      if (Object.keys(filesMap).length === 0) {
        throw new Error('No valid text or code files found in the uploaded ZIP archive.');
      }

      const repoTitle = file.name.replace(/\.zip$/i, '');
      const newRepo = {
        id: `zip-${Date.now()}`,
        name: repoTitle,
        owner: 'local-upload',
        description: `Locally extracted archive containing ${Object.keys(filesMap).length} source files.`,
        language: 'Multi-Language',
        framework: 'Local Archive',
        defaultBranch: 'local',
        files: filesMap
      };

      onImportCustomRepo(newRepo);
      onClose();
    } catch (err) {
      setErrorMsg('ZIP Extraction failed: ' + err.message);
    } finally {
      setIsLoading(false);
      setImportStatus('');
    }
  };

  // 3. Direct Code Input
  const handleDirectCodeSubmit = (e) => {
    e.preventDefault();
    if (!directCode.trim()) {
      setErrorMsg('Code cannot be empty.');
      return;
    }

    const cleanPath = directFileName.trim() || 'src/services/snippet.js';
    const newRepo = {
      id: `direct-${Date.now()}`,
      name: 'Single File Workspace',
      owner: 'direct-input',
      description: `Targeted single-file code analysis workspace for ${cleanPath}`,
      language: cleanPath.endsWith('.ts') ? 'TypeScript' : 'JavaScript',
      framework: 'Standalone',
      defaultBranch: 'draft',
      files: {
        [cleanPath]: directCode
      }
    };

    onImportCustomRepo(newRepo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05080F]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans text-xs">
      <div className="card-linear max-w-2xl w-full p-6 space-y-5 bg-[#090D16] border-[#818CF8]/40 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#818CF8]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Repository Ingestion & Workspace Setup
              </h2>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-0.5">
                Load curated production sample projects, import public GitHub repos, or unpack local ZIP archives.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#111726] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2 font-mono">
          <button
            onClick={() => { setActiveTab('samples'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'samples'
                ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/35'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Sample Repos ({sampleRepos.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('github'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'github'
                ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/35'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub Import</span>
          </button>

          <button
            onClick={() => { setActiveTab('zip'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'zip'
                ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/35'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload ZIP</span>
          </button>

          <button
            onClick={() => { setActiveTab('direct'); setErrorMsg(''); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'direct'
                ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/35'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Direct Code</span>
          </button>
        </div>

        {/* Status / Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-md text-xs text-[#F87171] font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {importStatus && (
          <div className="p-3 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-md text-xs text-[#818CF8] font-mono flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 animate-spin shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* TAB 1: Sample Repositories */}
        {activeTab === 'samples' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#94A3B8] font-mono">
              Select one of the pre-configured production repositories to inspect authentic architectural patterns:
            </div>

            <div className="space-y-2.5">
              {sampleRepos.map((repo) => {
                const fCount = Object.keys(repo.files || {}).length;
                return (
                  <div
                    key={repo.id}
                    onClick={() => { onSelectRepo(repo); onClose(); }}
                    className="p-3.5 rounded-lg bg-[#111726] border border-[#1E293B] hover:border-[#6366F1]/60 hover:bg-[#1A2338] transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 font-mono text-xs group-hover:text-[#818CF8] transition-colors">
                          {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
                          {repo.framework}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {fCount} files
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] line-clamp-1 font-sans">
                        {repo.description}
                      </p>
                    </div>

                    <button className="btn-secondary text-xs py-1.5 px-3 font-mono font-semibold shrink-0 group-hover:bg-[#6366F1] group-hover:text-white transition-all">
                      <span>Load Repo</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GitHub Public Repo Import */}
        {activeTab === 'github' && (
          <form onSubmit={handleGithubImport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold font-mono">
                Public GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="https://github.com/expressjs/express"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-[#111726] border border-[#1E293B] rounded-[6px] px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#6366F1] font-mono"
              />
              <p className="text-[10px] text-[#64748B] font-mono">
                Enter any public GitHub repo URL. PatchPilot fetches code files (.js, .ts, .json, .py, etc.) recursively.
              </p>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <label className="block text-slate-300 font-semibold font-mono">
                Branch (Optional)
              </label>
              <input
                type="text"
                placeholder="main"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                className="w-full bg-[#111726] border border-[#1E293B] rounded-[6px] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6366F1] font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4 font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary text-xs py-2 px-5 font-mono font-bold"
              >
                {isLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <GithubIcon className="w-3.5 h-3.5" />}
                <span>{isLoading ? 'Fetching Repository...' : 'Import from GitHub'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Local ZIP Archive Upload */}
        {activeTab === 'zip' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#1E293B] hover:border-[#6366F1]/50 rounded-xl p-8 text-center space-y-3 bg-[#0D121F] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/15 text-[#818CF8] flex items-center justify-center mx-auto border border-[#6366F1]/30">
                <Upload className="w-6 h-6 text-[#818CF8]" />
              </div>
              <div>
                <h3 className="font-bold text-white font-mono text-xs">Select or Drop a .ZIP Repository Archive</h3>
                <p className="text-[11px] text-[#94A3B8] max-w-sm mx-auto mt-1">
                  Files are safely decompressed with automatic exclusion of <code>node_modules</code>, <code>.git</code>, and build folders.
                </p>
              </div>

              <label className="btn-primary inline-flex cursor-pointer text-xs py-2 px-4 font-mono font-bold">
                <span>Browse Local ZIP File</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipFileSelected}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: Direct Code Input */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectCodeSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold font-mono">
                Target File Path
              </label>
              <input
                type="text"
                value={directFileName}
                onChange={(e) => setDirectFileName(e.target.value)}
                className="w-full bg-[#111726] border border-[#1E293B] rounded-[6px] px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold font-mono">
                Source Code Content
              </label>
              <textarea
                rows={10}
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value)}
                className="w-full bg-[#0D121F] border border-[#1E293B] rounded-[6px] p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4 font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-5 font-mono font-bold"
              >
                <span>Analyze Snippet Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

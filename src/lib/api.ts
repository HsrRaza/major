import { CodeIssue, IssueExplanation } from '@/types/issue';
import { RefactorProposal } from '@/types/refactor';
import { TestRunResult } from '@/types/test';

export interface HealthResponse {
  status: string;
  platform: string;
  groqConnected: boolean;
  model: string;
  nodeVersion: string;
  timestamp: string;
}

export interface ImportRepoResponse {
  repoName: string;
  branch?: string;
  fileCount: number;
  files: Record<string, string>;
  error?: string;
}

export interface RagChatResponse {
  reply: string;
  isAiAvailable?: boolean;
  citedFiles?: string[];
  error?: string;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
  return res.json();
}

export async function uploadZipArchive(file: File): Promise<ImportRepoResponse> {
  const formData = new FormData();
  formData.append('zipFile', file);

  const res = await fetch('/api/upload-zip', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to extract ZIP archive');
  }
  return data;
}

export async function importGithubRepo(repoUrl: string, branch = 'main'): Promise<ImportRepoResponse> {
  const res = await fetch('/api/github-repo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, branch }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to clone GitHub repository tree');
  }
  return data;
}

export async function explainIssueApi(payload: {
  issue: CodeIssue;
  codeSnippet: string;
  filePath: string;
}): Promise<IssueExplanation> {
  const res = await fetch('/api/explain-issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function proposeRefactorApi(payload: {
  filePath: string;
  originalCode: string;
  issue?: CodeIssue | null;
  customPrompt?: string;
}): Promise<RefactorProposal> {
  const res = await fetch('/api/propose-refactor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      filePath: payload.filePath,
      originalCode: payload.originalCode,
      refactoredCode: payload.originalCode,
      summary: 'AI Refactoring proposal failed.',
      riskAssessment: [],
      metricsDelta: {
        complexityBefore: 1,
        complexityAfter: 1,
        linesBefore: payload.originalCode.split('\n').length,
        linesAfter: payload.originalCode.split('\n').length,
      },
      isAiAvailable: false,
      error: data.error || 'Server returned an error generating refactoring',
    };
  }
  return data;
}

export async function runTestsApi(payload: {
  repoFiles: Record<string, string>;
  targetFilePath?: string | null;
  isPostRefactor?: boolean;
}): Promise<TestRunResult> {
  const res = await fetch('/api/run-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Test execution failed (${res.status})`);
  }
  return res.json();
}

export async function chatRagApi(payload: {
  message: string;
  filesContext: Array<{ path: string; content: string }>;
  repoName?: string;
}): Promise<RagChatResponse> {
  const res = await fetch('/api/rag-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function downloadPatchFile(payload: {
  filePath: string;
  originalCode: string;
  refactoredCode: string;
}): Promise<void> {
  const res = await fetch('/api/generate-patch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to generate patch');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patchpilot-${payload.filePath.replace(/[\/\\]/g, '-')}.patch`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

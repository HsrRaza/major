import { create } from 'zustand';
import { CodeIssue } from '@/types/issue';
import { RefactorProposal } from '@/types/refactor';
import { proposeRefactorApi } from '@/lib/api';

interface RefactorState {
  selectedIssue: CodeIssue | null;
  proposal: RefactorProposal | null;
  isGenerating: boolean;
  selectedFilePath: string | null;

  setSelectedIssue: (issue: CodeIssue | null) => void;
  setProposal: (proposal: RefactorProposal | null) => void;
  setSelectedFilePath: (path: string | null) => void;
  clearProposal: () => void;
  generateProposal: (params: {
    filePath: string;
    originalCode: string;
    issue?: CodeIssue | null;
    customPrompt?: string;
  }) => Promise<RefactorProposal>;
}

export const useRefactorStore = create<RefactorState>((set) => ({
  selectedIssue: null,
  proposal: null,
  isGenerating: false,
  selectedFilePath: null,

  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
  setProposal: (proposal) => set({ proposal }),
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),
  clearProposal: () => set({ proposal: null, selectedIssue: null }),

  generateProposal: async ({ filePath, originalCode, issue, customPrompt }) => {
    set({ isGenerating: true, selectedIssue: issue || null, selectedFilePath: filePath });
    try {
      const result = await proposeRefactorApi({
        filePath,
        originalCode,
        issue,
        customPrompt,
      });
      set({ proposal: result, isGenerating: false });
      return result;
    } catch (err: any) {
      const errProposal: RefactorProposal = {
        filePath,
        originalCode,
        refactoredCode: originalCode,
        summary: 'Failed to generate refactoring',
        riskAssessment: [],
        metricsDelta: {
          complexityBefore: 1,
          complexityAfter: 1,
          linesBefore: originalCode.split('\n').length,
          linesAfter: originalCode.split('\n').length,
        },
        isAiAvailable: false,
        error: err.message || 'Error communicating with Groq backend',
      };
      set({ proposal: errProposal, isGenerating: false });
      return errProposal;
    }
  },
}));

import { create } from 'zustand';
import { Repository } from '@/types/repository';
import { AnalysisResult, ScoringWeights } from '@/types/analysis';
import { TestRunResult } from '@/types/test';
import { SAMPLE_REPOSITORIES } from '@/services/sampleRepos';
import { analyzeCodebase } from '@/services/staticAnalyzer';
import { runTestsApi } from '@/lib/api';

interface RepoState {
  repositories: Repository[];
  activeRepoId: string;
  selectedFilePath: string;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  testResult: TestRunResult | null;
  isRunningTests: boolean;
  scoringWeights: ScoringWeights;

  // Actions
  getActiveRepo: () => Repository;
  setActiveRepoId: (id: string) => void;
  importCustomRepo: (repo: Repository) => void;
  setSelectedFilePath: (path: string) => void;
  runAnalysis: (overrideWeights?: ScoringWeights) => void;
  runTests: () => Promise<TestRunResult | null>;
  updateActiveRepoFile: (filePath: string, newContent: string) => void;
  setScoringWeights: (weights: ScoringWeights) => void;
  resetDefaultWeights: () => void;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  critical: 15,
  high: 7,
  medium: 3,
  low: 1,
  circularDep: 8,
};

export const useRepoStore = create<RepoState>((set, get) => {
  const initialRepos = SAMPLE_REPOSITORIES;
  const initialActive = initialRepos[0];
  const initialFiles = Object.keys(initialActive.files);
  const initialFilePath = initialFiles.includes('src/services/userService.js')
    ? 'src/services/userService.js'
    : initialFiles[0] || '';

  // Initial immediate static scan
  const initialAnalysis = analyzeCodebase(initialActive.files, DEFAULT_WEIGHTS);

  return {
    repositories: initialRepos,
    activeRepoId: initialActive.id,
    selectedFilePath: initialFilePath,
    analysisResult: initialAnalysis,
    isAnalyzing: false,
    testResult: null,
    isRunningTests: false,
    scoringWeights: DEFAULT_WEIGHTS,

    getActiveRepo: () => {
      const { repositories, activeRepoId } = get();
      return repositories.find(r => r.id === activeRepoId) || repositories[0];
    },

    setActiveRepoId: (id: string) => {
      const repo = get().repositories.find(r => r.id === id);
      if (!repo) return;

      const files = Object.keys(repo.files);
      const newSelectedFile = files[0] || '';
      const analysis = analyzeCodebase(repo.files, get().scoringWeights);

      set({
        activeRepoId: id,
        selectedFilePath: newSelectedFile,
        analysisResult: analysis,
        testResult: null,
      });

      // Auto-trigger test runner in background
      get().runTests();
    },

    importCustomRepo: (newRepo: Repository) => {
      const updatedRepos = [newRepo, ...get().repositories];
      const files = Object.keys(newRepo.files);
      const analysis = analyzeCodebase(newRepo.files, get().scoringWeights);

      set({
        repositories: updatedRepos,
        activeRepoId: newRepo.id,
        selectedFilePath: files[0] || '',
        analysisResult: analysis,
        testResult: null,
      });

      get().runTests();
    },

    setSelectedFilePath: (path: string) => {
      set({ selectedFilePath: path });
    },

    runAnalysis: (overrideWeights?: ScoringWeights) => {
      const activeRepo = get().getActiveRepo();
      const weights = overrideWeights || get().scoringWeights;
      set({ isAnalyzing: true });

      setTimeout(() => {
        const analysis = analyzeCodebase(activeRepo.files, weights);
        set({
          analysisResult: analysis,
          isAnalyzing: false,
        });
      }, 100);
    },

    runTests: async () => {
      const activeRepo = get().getActiveRepo();
      set({ isRunningTests: true });

      try {
        const result = await runTestsApi({ repoFiles: activeRepo.files });
        set({ testResult: result, isRunningTests: false });
        return result;
      } catch (err) {
        console.error('Run tests error:', err);
        set({ isRunningTests: false });
        return null;
      }
    },

    updateActiveRepoFile: (filePath: string, newContent: string) => {
      const { repositories, activeRepoId, scoringWeights } = get();
      const updatedRepos = repositories.map(r => {
        if (r.id === activeRepoId) {
          return {
            ...r,
            files: {
              ...r.files,
              [filePath]: newContent,
            },
          };
        }
        return r;
      });

      const activeRepo = updatedRepos.find(r => r.id === activeRepoId)!;
      const newAnalysis = analyzeCodebase(activeRepo.files, scoringWeights);

      set({
        repositories: updatedRepos,
        analysisResult: newAnalysis,
      });

      // Trigger test runner to re-verify against regression
      get().runTests();
    },

    setScoringWeights: (weights: ScoringWeights) => {
      set({ scoringWeights: weights });
      get().runAnalysis(weights);
    },

    resetDefaultWeights: () => {
      set({ scoringWeights: DEFAULT_WEIGHTS });
      get().runAnalysis(DEFAULT_WEIGHTS);
    },
  };
});

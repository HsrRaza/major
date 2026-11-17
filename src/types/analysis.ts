import { CodeIssue } from './issue';

export interface FileMetrics {
  lineCount: number;
  complexity: number;
  functionCount: number;
  maxNesting: number;
  imports: string[];
  maintainabilityIndex: number;
  layer: 'Controller' | 'Service' | 'Repository' | 'Utility' | 'Config' | 'Test' | 'Component' | 'General';
  issuesCount: number;
}

export interface CircularDependency {
  cycle: string[];
  source?: string;
  target?: string;
  nodes?: string[];
  severity: 'Critical' | 'High';
  description: string;
}

export interface CouplingMetric {
  afferent: number;
  efferent: number;
  instability: number;
  isHotspot: boolean;
}

export interface DuplicateBlock {
  files: string[];
  lines: number;
  snippet: string;
}

export interface ScoringWeights {
  critical: number;
  high: number;
  medium: number;
  low: number;
  circularDep: number;
}

export interface SubScores {
  maintainability: number;
  complexity: number;
  security: number;
  duplication: number;
  architecture: number;
  testing: number;
}

export interface AnalysisCounts {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AnalysisResult {
  healthScore: number;
  healthGrade: string;
  scoreExplanation: string;
  subScores: SubScores;
  counts: AnalysisCounts;
  issues: CodeIssue[];
  fileMetrics: Record<string, FileMetrics>;
  adjacencyList: Record<string, string[]>;
  circularDependencies: CircularDependency[];
  couplingMap: Record<string, CouplingMetric>;
  duplicates: DuplicateBlock[];
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  averageComplexity: number;
  maxComplexity: number;
  timestamp: string;
}

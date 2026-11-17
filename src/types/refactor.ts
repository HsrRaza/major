export interface MetricsDelta {
  complexityBefore: number;
  complexityAfter: number;
  linesBefore: number;
  linesAfter: number;
}

export interface RefactorProposal {
  filePath: string;
  originalCode: string;
  refactoredCode: string;
  patch?: string;
  structuredDiff?: any;
  summary: string;
  riskAssessment: string[];
  metricsDelta: MetricsDelta;
  isAiGenerated?: boolean;
  isAiAvailable?: boolean;
  error?: string;
}

export interface RefactorAuditLog {
  id: string;
  file: string;
  problem: string;
  originalCode: string;
  refactoredCode: string;
  complexityBefore: number;
  complexityAfter: number;
  linesBefore: number;
  linesAfter: number;
  status: 'Applied' | 'Rolled back' | 'Rejected';
  model: string;
  timestamp: string;
}

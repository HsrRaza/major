export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueCategory = 'Security' | 'Complexity' | 'Performance' | 'Architecture' | 'Duplication' | 'Maintainability';

export interface CodeIssue {
  id: string;
  filePath: string;
  category: IssueCategory;
  type: string;
  title: string;
  severity: IssueSeverity;
  line: number;
  column: number;
  why: string;
  suggestedApproach: string;
  codeSnippet: string;
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface IssueExplanation {
  isAiAvailable?: boolean;
  whatsWrong: string;
  whyProblematic: string;
  howToFix: string;
  expectedBenefits: string[];
  potentialRisks: string[];
  error?: string;
}

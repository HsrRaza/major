export interface Repository {
  id: string;
  name: string;
  owner?: string;
  description?: string;
  language?: string;
  framework?: string;
  defaultBranch?: string;
  files: Record<string, string>;
  isCustom?: boolean;
  importedAt?: string;
}

export interface FileItem {
  path: string;
  name: string;
  lines: number;
  complexity: number;
  layer: string;
  maintainabilityIndex: number;
  issuesCount: number;
  risk: 'Low' | 'Medium' | 'High';
}

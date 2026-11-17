export interface TestCaseResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestSuiteResult {
  file: string;
  passed: number;
  failed: number;
  durationMs: number;
  tests: TestCaseResult[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

export interface FailedTestDetails {
  suite: string;
  testName: string;
  error: string;
}

export interface TestRunResult {
  hasTests: boolean;
  timestamp?: string;
  summary: TestSummary;
  hasRegression: boolean;
  failedDetails?: FailedTestDetails | null;
  testSuites: TestSuiteResult[];
  message?: string;
}

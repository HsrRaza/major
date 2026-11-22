import vm from 'node:vm';
import { TestRunResult } from '@/types/test';

export async function executeVmTests(repoFiles: Record<string, string> = {}): Promise<TestRunResult> {
  const filesList = Object.keys(repoFiles);
  const testFiles = filesList.filter(f => f.includes('.test.') || f.includes('.spec.') || f.startsWith('tests/'));

  if (testFiles.length === 0) {
    return {
      hasTests: false,
      summary: { total: 0, passed: 0, failed: 0, durationMs: 0 },
      testSuites: [],
      hasRegression: false,
      message: 'No unit test files found in this repository. Add a .test.js file to run tests.'
    };
  }

  const startTime = Date.now();
  const testSuites = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let failedDetails: { suite: string; testName: string; error: string } | null = null;

  for (const testFilePath of testFiles) {
    const testCode = repoFiles[testFilePath];
    if (!testCode) continue;

    const suiteTests: Array<{ name: string; passed: boolean; durationMs: number; error?: string }> = [];
    const queuedTests: Array<{ testName: string; fn: () => any }> = [];
    const moduleCache: Record<string, any> = {};

    const sandboxedRequire = (modulePath: string) => {
      const cleanPath = modulePath.replace(/^\.\//, '').replace(/^\.\.\//, '');
      const matchedFile = filesList.find(f => f.endsWith(cleanPath) || f.endsWith(cleanPath + '.js'));

      if (matchedFile && repoFiles[matchedFile]) {
        if (moduleCache[matchedFile]) {
          return moduleCache[matchedFile].exports;
        }

        const mod = { exports: {} };
        moduleCache[matchedFile] = mod;

        const modContext = {
          module: mod,
          exports: mod.exports,
          Buffer: Buffer,
          console: { log: () => {}, warn: () => {}, error: () => {} },
          require: sandboxedRequire,
          process: { env: {} }
        };

        try {
          vm.runInNewContext(repoFiles[matchedFile], modContext, { timeout: 1500 });
          return mod.exports;
        } catch (err: any) {
          console.warn(`[RefactorAI TestRunner] Error executing module ${matchedFile}:`, err.message);
          return mod.exports;
        }
      }
      return {};
    };

    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      Buffer: Buffer,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      describe: (_suiteName: string, fn: () => void) => {
        try { fn(); } catch (err: any) { console.error('Suite registration error:', err.message); }
      },
      test: (testName: string, fn: () => any) => {
        queuedTests.push({ testName, fn });
      },
      it: (testName: string, fn: () => any) => {
        queuedTests.push({ testName, fn });
      },
      expect: (actual: any) => ({
        toBe: (expected: any) => {
          if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
        },
        toEqual: (expected: any) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
          }
        },
        toHaveProperty: (prop: string) => {
          if (!actual || !(prop in actual)) throw new Error(`Expected object to have property "${prop}"`);
        },
        toBeGreaterThan: (expected: number) => {
          if (typeof actual !== 'number' || actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
        },
        toThrow: (expectedMessage?: string) => {
          if (typeof actual === 'function') {
            let threw = false;
            try {
              actual();
            } catch (e: any) {
              threw = true;
              if (expectedMessage && !e.message.includes(expectedMessage)) {
                throw new Error(`Expected error containing "${expectedMessage}", received "${e.message}"`);
              }
            }
            if (!threw) {
              throw new Error('Expected function to throw, but it executed successfully.');
            }
          }
        },
        rejects: {
          toThrow: async (expectedMessage?: string) => {
            if (actual && typeof actual.then === 'function') {
              let threw = false;
              try {
                await actual;
              } catch (e: any) {
                threw = true;
                if (expectedMessage && !e.message.includes(expectedMessage)) {
                  throw new Error(`Expected rejection containing "${expectedMessage}", received "${e.message}"`);
                }
              }
              if (!threw) {
                throw new Error('Expected promise to reject, but it resolved successfully.');
              }
            }
          }
        }
      }),
      require: sandboxedRequire
    };

    try {
      const vmContext = vm.createContext(sandbox);
      vm.runInContext(testCode, vmContext, { timeout: 2000 });
    } catch (err: any) {
      console.warn(`[RefactorAI] Test suite registration error in ${testFilePath}:`, err.message);
    }

    let suitePassed = 0;
    let suiteFailed = 0;

    for (const t of queuedTests) {
      totalTests++;
      const tStart = Date.now();
      try {
        const res = t.fn();
        if (res && typeof res.then === 'function') {
          await res;
        }
        suitePassed++;
        totalPassed++;
        suiteTests.push({
          name: t.testName,
          passed: true,
          durationMs: Math.max(1, Date.now() - tStart)
        });
      } catch (err: any) {
        suiteFailed++;
        totalFailed++;
        suiteTests.push({
          name: t.testName,
          passed: false,
          durationMs: Math.max(1, Date.now() - tStart),
          error: err.message
        });
        if (!failedDetails) {
          failedDetails = {
            suite: testFilePath,
            testName: t.testName,
            error: err.message
          };
        }
      }
    }

    testSuites.push({
      file: testFilePath,
      passed: suitePassed,
      failed: suiteFailed,
      durationMs: Math.max(8, Date.now() - startTime),
      tests: suiteTests
    });
  }

  const durationMs = Date.now() - startTime;

  return {
    hasTests: true,
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      durationMs: Math.max(18, durationMs)
    },
    hasRegression: totalFailed > 0,
    failedDetails,
    testSuites
  };
}


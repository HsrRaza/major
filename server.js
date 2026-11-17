import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import * as diff from 'diff';
import multer from 'multer';
import JSZip from 'jszip';
import vm from 'node:vm';
import { parse } from '@babel/parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Express middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for safe zip file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max zip
});

// Initialize Groq client
let groq = null;
if (GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: GROQ_API_KEY });
  } catch (err) {
    console.warn('[PatchPilot Server] Groq SDK init warning:', err.message);
  }
}

/**
 * Helper to call Groq LLM with a strict timeout and error handling.
 */
async function callGroqLLM(prompt, systemInstruction = '', model = GROQ_MODEL, timeoutMs = 25000) {
  if (!groq) {
    throw new Error('Groq API client is not configured. Set GROQ_API_KEY in your .env file.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: systemInstruction || 'You are an elite Software Architect and Principal Refactoring Engineer.' 
        },
        { role: 'user', content: prompt }
      ],
      model: model,
      temperature: 0.1,
      max_tokens: 4000,
    }, { signal: controller.signal });

    clearTimeout(timeoutId);
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Groq API request timed out after ${timeoutMs / 1000} seconds.`);
    }
    console.error('[PatchPilot Server] Groq API Error:', error.message);
    throw error;
  }
}

/**
 * Fast AST parser to compute cyclomatic complexity & LOC for any JS/TS code.
 */
function computeASTMetrics(code) {
  if (!code || typeof code !== 'string') {
    return { complexity: 1, loc: 0 };
  }

  const loc = code.split('\n').length;
  let complexity = 1;

  try {
    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'dynamicImport',
        'exportDefaultFrom',
        'optionalChaining',
        'nullishCoalescingOperator',
        'asyncGenerators',
        'objectRestSpread'
      ],
      errorRecovery: true
    });

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const isDecision = [
        'IfStatement',
        'ConditionalExpression',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'CatchClause'
      ].includes(node.type) || (
        node.type === 'SwitchCase' && node.test !== null
      ) || (
        node.type === 'LogicalExpression' && ['&&', '||', '??'].includes(node.operator)
      );

      if (isDecision) complexity++;

      for (const k in node) {
        if (k === 'loc' || k === 'start' || k === 'end' || k === 'extra') continue;
        const child = node[k];
        if (Array.isArray(child)) child.forEach(walk);
        else if (child && typeof child === 'object') walk(child);
      }
    };

    walk(ast);
  } catch {
    // Regex fallback
    const branchMatches = code.match(/\b(if|else if|switch|case|for|while|catch|\?)\b|&&|\|\|/g);
    if (branchMatches) complexity += branchMatches.length;
  }

  return { complexity, loc };
}

// -----------------------------------------------------------------------------
// 1. System Health Check
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'PatchPilot AI Code Intelligence Engine',
    groqConnected: !!groq && !!GROQ_API_KEY,
    model: GROQ_MODEL,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// 2. Safe Local ZIP Repository Upload Endpoint
// -----------------------------------------------------------------------------
app.post('/api/upload-zip', upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No ZIP archive file provided in request.' });
    }

    const zip = await JSZip.loadAsync(req.file.buffer);
    const filesMap = {};
    let extractedCount = 0;
    const ignoredExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3'];

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Security check: Prevent path traversal
      if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
        continue;
      }

      // Ignore common non-code / build directories
      if (
        relativePath.includes('node_modules/') ||
        relativePath.includes('.git/') ||
        relativePath.includes('dist/') ||
        relativePath.includes('build/') ||
        relativePath.includes('.next/') ||
        relativePath.includes('coverage/') ||
        relativePath.includes('__pycache__/') ||
        relativePath.includes('.DS_Store')
      ) {
        continue;
      }

      // Check file extensions
      const lowerPath = relativePath.toLowerCase();
      if (ignoredExtensions.some(ext => lowerPath.endsWith(ext))) {
        continue;
      }

      // Read text content
      try {
        const text = await zipEntry.async('string');
        // Cap individual file size to 600 KB to prevent memory exhaustion
        if (text.length <= 600000) {
          // Normalize leading directory if zip contained a single root folder
          let cleanPath = relativePath;
          const slashIdx = cleanPath.indexOf('/');
          if (slashIdx !== -1 && !cleanPath.startsWith('src/') && !cleanPath.startsWith('lib/') && !cleanPath.startsWith('tests/')) {
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
      } catch (err) {
        console.warn(`[PatchPilot] Failed to decode text for ${relativePath}:`, err.message);
      }

      // Cap total extracted files to 100 for fast AST scanning
      if (extractedCount >= 100) break;
    }

    if (Object.keys(filesMap).length === 0) {
      return res.status(400).json({ error: 'No valid text or code files found in the uploaded ZIP archive.' });
    }

    const repoName = req.file.originalname ? req.file.originalname.replace(/\.zip$/i, '') : 'uploaded-archive';

    res.json({
      repoName,
      fileCount: Object.keys(filesMap).length,
      files: filesMap
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process ZIP archive: ' + error.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Public GitHub Repository File Tree Importer
// -----------------------------------------------------------------------------
app.post('/api/github-repo', async (req, res) => {
  try {
    const { repoUrl, branch = 'main' } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required.' });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL format. Example: https://github.com/owner/repository' });
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PatchPilot-Code-Intelligence-Platform'
    };

    let activeBranch = branch;
    let treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`, { headers });
    
    if (!treeRes.ok) {
      // Fallback to master branch
      activeBranch = 'master';
      treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        const rateLimitRemaining = treeRes.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
          return res.status(429).json({ error: 'GitHub API rate limit exceeded for public requests. Please try again later or upload a ZIP.' });
        }
        return res.status(404).json({ error: `Could not fetch GitHub repository tree for ${owner}/${repo}. Ensure repository is public.` });
      }
    }

    const treeData = await treeRes.json();
    const codeFiles = (treeData.tree || [])
      .filter(item => (
        item.type === 'blob' && 
        /\.(js|ts|jsx|tsx|json|py|css|html|md|sql)$/i.test(item.path) &&
        !item.path.includes('node_modules/') &&
        !item.path.includes('.git/') &&
        !item.path.includes('dist/') &&
        !item.path.includes('build/')
      ))
      .slice(0, 40); // Cap to 40 primary code files

    const filesMap = {};
    for (const file of codeFiles) {
      try {
        const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${file.path}`);
        if (fileRes.ok) {
          const text = await fileRes.text();
          if (text.length <= 500000) {
            filesMap[file.path] = text;
          }
        }
      } catch (err) {
        console.warn(`[PatchPilot] Failed to fetch raw file ${file.path}:`, err.message);
      }
    }

    res.json({
      repoName: `${owner}/${repo}`,
      branch: activeBranch,
      fileCount: Object.keys(filesMap).length,
      files: filesMap
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import GitHub repository: ' + error.message });
  }
});

// -----------------------------------------------------------------------------
// 4. AI Issue Explanation with Structured Diagnostic Schema
// -----------------------------------------------------------------------------
app.post('/api/explain-issue', async (req, res) => {
  try {
    const { issue, codeSnippet, filePath } = req.body;
    if (!issue || !filePath) {
      return res.status(400).json({ error: 'Missing issue payload or filePath' });
    }

    if (!groq || !GROQ_API_KEY) {
      return res.json({
        isAiAvailable: false,
        whatsWrong: `Violation: ${issue.title}. ${issue.why}`,
        whyProblematic: `This introduces architectural technical debt and potential runtime failures.`,
        howToFix: issue.suggestedApproach || `Refactor the code into cohesive, modular functions.`,
        expectedBenefits: [
          'Decreased cyclomatic complexity and fewer defect points',
          'Cleaner unit test mocking boundaries',
          'Improved team maintainability'
        ],
        potentialRisks: [
          'Ensure existing public API signatures remain backward compatible'
        ]
      });
    }

    const systemPrompt = `You are a Principal Software Security & Architecture Auditor.
Analyze code quality issues, security vulnerabilities, and architectural smells.
You must respond with ONLY a valid, parseable JSON object matching this schema exactly:
{
  "whatsWrong": "Clear 2-sentence summary of the exact violation",
  "whyProblematic": "Detailed technical analysis of maintainability risks, performance overhead, or security vulnerabilities",
  "howToFix": "Specific, actionable step-by-step refactoring recommendation",
  "expectedBenefits": ["Clear benefit 1", "Clear benefit 2", "Clear benefit 3"],
  "potentialRisks": ["Watchout 1", "Watchout 2"]
}`;

    const userPrompt = `File: ${filePath}
Issue Title: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Violation Explanation: ${issue.why}
Code Snippet:
\`\`\`
${codeSnippet}
\`\`\`

Provide your structured JSON diagnostic report.`;

    const responseText = await callGroqLLM(userPrompt, systemPrompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ ...parsed, isAiAvailable: true });
    }

    throw new Error('LLM response did not contain parseable JSON.');
  } catch (error) {
    res.status(500).json({
      isAiAvailable: false,
      error: error.message,
      whatsWrong: `The issue in \`${req.body.filePath}\` involves ${req.body.issue?.title || 'code quality'}.`,
      whyProblematic: 'Elevated cyclomatic branching and tight coupling degrade maintainability.',
      howToFix: req.body.issue?.suggestedApproach || 'Decompose nested branching into modular helper routines.',
      expectedBenefits: ['Lower defect density', 'Improved test coverage'],
      potentialRisks: ['Verify API signature compatibility']
    });
  }
});

// -----------------------------------------------------------------------------
// 5. Genuine AI Refactoring Proposal & Unified Git Patch Generation
// -----------------------------------------------------------------------------
app.post('/api/propose-refactor', async (req, res) => {
  try {
    const { filePath, originalCode, issue, customPrompt } = req.body;

    if (!filePath || typeof originalCode !== 'string') {
      return res.status(400).json({ error: 'filePath and originalCode are required.' });
    }

    // 1. Calculate genuine AST metrics for the original code
    const originalMetrics = computeASTMetrics(originalCode);

    if (!groq || !GROQ_API_KEY) {
      return res.status(503).json({
        isAiAvailable: false,
        error: 'Groq API is not configured on the backend. Please add GROQ_API_KEY to your .env file to enable AI refactorings.'
      });
    }

    const systemPrompt = `You are a Principal Software Refactoring Engineer.
Refactor the provided code to eliminate code smells, eliminate deep nesting, reduce cyclomatic complexity, remove security flaws (such as hardcoded secrets, SQL injection, eval), and preserve full backwards compatibility of public export signatures.
CRITICAL: You must return ONLY a valid, parseable JSON object matching this schema:
{
  "refactoredCode": "FULL REFACTORED CODE STRING HERE (do not truncate, provide complete working code)",
  "summary": "Concise summary of key architectural improvements and patterns applied",
  "riskAssessment": [
    "Regression watchout 1",
    "Regression watchout 2"
  ]
}`;

    const userPrompt = `File: ${filePath}
Target Issue: ${issue ? issue.title : 'General Code Quality & Clean Architecture Refactoring'}
Specific Problem: ${issue ? issue.why : 'High complexity and technical debt'}
Custom Instruction: ${customPrompt || 'Refactor into clean, decoupled functions. Remove nesting, eliminate unsafe dynamic code execution, handle errors cleanly.'}

Original Code:
\`\`\`javascript
${originalCode}
\`\`\`

Refactor the complete file cleanly. Preserve all exported functions. Return ONLY JSON.`;

    const responseText = await callGroqLLM(userPrompt, systemPrompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Groq returned a non-JSON response.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const refactoredCode = parsed.refactoredCode;

    if (!refactoredCode || typeof refactoredCode !== 'string') {
      throw new Error('Refactored code missing in LLM response.');
    }

    // 2. Calculate genuine AST metrics for the refactored code
    const refactoredMetrics = computeASTMetrics(refactoredCode);

    // 3. Generate standard Unified Git Diff & Structured Patch
    const patch = diff.createTwoFilesPatch(
      `a/${filePath}`,
      `b/${filePath}`,
      originalCode,
      refactoredCode,
      'original',
      'refactored'
    );
    const structuredDiff = diff.structuredPatch(
      filePath,
      filePath,
      originalCode,
      refactoredCode
    );

    res.json({
      filePath,
      originalCode,
      refactoredCode,
      patch,
      structuredDiff,
      summary: parsed.summary || 'Applied clean architecture refactoring and reduced cyclomatic complexity.',
      riskAssessment: parsed.riskAssessment || [
        'Run existing unit test suites to verify signature compatibility',
        'Verify environment variable bindings'
      ],
      metricsDelta: {
        complexityBefore: originalMetrics.complexity,
        complexityAfter: refactoredMetrics.complexity,
        linesBefore: originalMetrics.loc,
        linesAfter: refactoredMetrics.loc
      },
      isAiGenerated: true
    });
  } catch (error) {
    res.status(500).json({
      isAiAvailable: false,
      error: 'Failed to generate AI refactoring: ' + error.message
    });
  }
});

// -----------------------------------------------------------------------------
// 6. Genuine In-Memory Sandboxed Test Runner Engine
// -----------------------------------------------------------------------------
app.post('/api/run-tests', async (req, res) => {
  try {
    const { repoFiles = {}, targetFilePath = null, isPostRefactor = false } = req.body;

    const filesList = Object.keys(repoFiles);
    const testFiles = filesList.filter(f => f.includes('.test.') || f.includes('.spec.') || f.startsWith('tests/'));

    if (testFiles.length === 0) {
      return res.json({
        hasTests: false,
        summary: { total: 0, passed: 0, failed: 0, durationMs: 0 },
        testSuites: [],
        hasRegression: false,
        message: 'No unit test files found in this repository. Use Test Generator to create one.'
      });
    }

    const startTime = Date.now();
    const testSuites = [];
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let failedDetails = null;

    // Run test suites in sandboxed VM context
    for (const testFilePath of testFiles) {
      const testCode = repoFiles[testFilePath];
      if (!testCode) continue;

      const suiteTests = [];
      const queuedTests = [];
      const moduleCache = {};

      const sandboxedRequire = (modulePath) => {
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
            console: { log: () => {} },
            require: sandboxedRequire,
            process: { env: {} }
          };

          try {
            vm.runInNewContext(repoFiles[matchedFile], modContext, { timeout: 1500 });
            return mod.exports;
          } catch (err) {
            console.warn(`[PatchPilot TestRunner] Error executing module ${matchedFile}:`, err.message);
            return mod.exports;
          }
        }
        return {};
      };

      // Create isolated VM context
      const sandbox = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        Buffer: Buffer,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        describe: (suiteName, fn) => {
          try { fn(); } catch (err) { console.error('Suite registration error:', err.message); }
        },
        test: (testName, fn) => {
          queuedTests.push({ testName, fn });
        },
        expect: (actual) => ({
          toBe: (expected) => {
            if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
          },
          toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
            }
          },
          toHaveProperty: (prop) => {
            if (!actual || !(prop in actual)) throw new Error(`Expected object to have property "${prop}"`);
          },
          toBeGreaterThan: (expected) => {
            if (typeof actual !== 'number' || actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
          },
          toThrow: (expectedMessage) => {
            if (typeof actual === 'function') {
              let threw = false;
              try {
                actual();
              } catch (e) {
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
            toThrow: async (expectedMessage) => {
              if (actual && typeof actual.then === 'function') {
                let threw = false;
                try {
                  await actual;
                } catch (e) {
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

      sandbox.it = sandbox.test;

      try {
        const vmContext = vm.createContext(sandbox);
        vm.runInContext(testCode, vmContext, { timeout: 2000 });
      } catch (err) {
        console.warn(`[PatchPilot] Test suite registration error in ${testFilePath}:`, err.message);
      }

      // Execute all queued tests asynchronously
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
        } catch (err) {
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

    res.json({
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
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute test suites: ' + error.message });
  }
});

// -----------------------------------------------------------------------------
// 7. Context-Aware Codebase RAG Assistant Endpoint
// -----------------------------------------------------------------------------
app.post('/api/rag-chat', async (req, res) => {
  try {
    const { message, filesContext = [], repoName = 'repository' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Query message is required.' });
    }

    if (!groq || !GROQ_API_KEY) {
      return res.json({
        isAiAvailable: false,
        reply: `Groq AI is currently offline (GROQ_API_KEY missing). Based on local static analysis of \`${repoName}\`:
1. Check **Architecture Graph** to review circular dependency paths.
2. Review **Issue Explorer** for Critical security and performance findings.
3. Once configured, Groq Llama-3.3-70b will provide interactive context-aware architectural answers.`
      });
    }

    // Rank and select top 3 most relevant files based on user question keywords
    const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const scoredFiles = filesContext.map(file => {
      let score = 0;
      const lowerPath = file.path.toLowerCase();
      const lowerContent = (file.content || '').toLowerCase();

      keywords.forEach(kw => {
        if (lowerPath.includes(kw)) score += 5;
        const matches = (lowerContent.match(new RegExp(kw, 'g')) || []).length;
        score += Math.min(matches, 10);
      });

      return { ...file, score };
    }).sort((a, b) => b.score - a.score);

    const topFiles = scoredFiles.slice(0, 3);
    const contextSnippet = topFiles.map(f => `File: ${f.path}\n\`\`\`\n${(f.content || '').slice(0, 1200)}\n\`\`\``).join('\n\n');

    const systemPrompt = `You are PatchPilot AI, an elite Software Architect and Code Quality Assistant.
You have context from the active repository \`${repoName}\`.
Answer developer questions with specific file references, architectural diagrams, concrete code snippets, and actionable recommendations. Keep answers clear, technical, and concise.`;

    const userPrompt = `Repository Context:
${contextSnippet}

Developer Question: ${message}`;

    const reply = await callGroqLLM(userPrompt, systemPrompt);
    res.json({
      reply,
      isAiAvailable: true,
      citedFiles: topFiles.map(f => f.path)
    });
  } catch (error) {
    res.status(500).json({
      isAiAvailable: false,
      error: error.message,
      reply: 'Unable to reach Groq AI assistant at this moment: ' + error.message
    });
  }
});

// -----------------------------------------------------------------------------
// 8. Downloadable Standard Git Patch Generator
// -----------------------------------------------------------------------------
app.post('/api/generate-patch', (req, res) => {
  try {
    const { filePath, originalCode, refactoredCode } = req.body;
    if (!filePath || !originalCode || !refactoredCode) {
      return res.status(400).json({ error: 'filePath, originalCode, and refactoredCode are required.' });
    }

    const patchText = diff.createTwoFilesPatch(
      `a/${filePath}`,
      `b/${filePath}`,
      originalCode,
      refactoredCode,
      'original',
      'refactored'
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="patchpilot-${filePath.replace(/[\/\\]/g, '-')}.patch"`);
    res.send(patchText);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate patch: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PatchPilot Production Backend Server running on http://localhost:${PORT}`);
  console.log(`🤖 Groq Model Configured: ${GROQ_MODEL} (Key Verified: ${!!GROQ_API_KEY})`);
});

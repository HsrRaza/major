// Production-Grade AST-Based Static Code Analyzer for PatchPilot
import { parse } from '@babel/parser';

/**
 * Traverses an AST recursively with a visitor object.
 */
function traverseAST(node, visitor, parent = null, depth = 0) {
  if (!node || typeof node !== 'object') return;

  if (visitor.enter) {
    visitor.enter(node, parent, depth);
  }

  const nodeTypeVisitor = visitor[node.type];
  if (typeof nodeTypeVisitor === 'function') {
    nodeTypeVisitor(node, parent, depth);
  }

  for (const key in node) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'comments') {
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        if (child[i] && typeof child[i] === 'object') {
          traverseAST(child[i], visitor, node, depth + 1);
        }
      }
    } else if (child && typeof child === 'object') {
      traverseAST(child, visitor, node, depth + 1);
    }
  }

  if (visitor.exit) {
    visitor.exit(node, parent, depth);
  }
}

/**
 * Checks if a given node is inside a loop construct.
 */
function isInsideLoop(nodeStack) {
  return nodeStack.some(n => 
    n.type === 'ForStatement' || 
    n.type === 'ForInStatement' || 
    n.type === 'ForOfStatement' || 
    n.type === 'WhileStatement' || 
    n.type === 'DoWhileStatement'
  );
}

/**
 * Analyzes a full repository of files and returns structured metrics, issues,
 * dependency graph, circular dependencies, and health score breakdown.
 */
export function analyzeCodebase(filesMap, customWeights = {}) {
  const issues = [];
  const fileMetrics = {};
  const importsMap = {};
  const codeBlocksForDuplication = [];

  let totalLines = 0;
  let totalFiles = 0;
  let totalFunctions = 0;
  let totalCyclomaticComplexity = 0;
  let maxComplexityOverall = 0;

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  // 1. Pass One: File-level AST Parsing and Metric Extraction
  Object.entries(filesMap || {}).forEach(([filePath, content]) => {
    // Skip binary, lockfiles, or non-code files
    if (
      !content || 
      filePath.endsWith('.lock') || 
      filePath.endsWith('.md') ||
      filePath.endsWith('.svg') ||
      filePath.endsWith('.png') ||
      filePath.endsWith('.ico')
    ) {
      return;
    }

    if (filePath.endsWith('.json')) {
      totalFiles++;
      const lineCount = content.split('\n').length;
      totalLines += lineCount;
      fileMetrics[filePath] = {
        lineCount,
        complexity: 1,
        functionCount: 0,
        maxNesting: 0,
        imports: [],
        maintainabilityIndex: 90,
        layer: 'Config',
        issuesCount: 0
      };
      return;
    }

    totalFiles++;
    const lines = content.split('\n');
    const lineCount = lines.length;
    totalLines += lineCount;

    // Detect File Length Issue (> 250 lines)
    if (lineCount > 250) {
      const isExtreme = lineCount > 400;
      issues.push({
        id: `issue-file-len-${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        filePath,
        category: 'Complexity',
        type: 'Large File Smell',
        title: `File \`${filePath}\` exceeds 250 lines (${lineCount} LOC)`,
        severity: isExtreme ? 'High' : 'Medium',
        line: 1,
        column: 1,
        why: `Files with high LOC violate the Single Responsibility Principle and increase cognitive review load.`,
        suggestedApproach: 'Split file into cohesive modular domain services, helper modules, or separate routers.',
        codeSnippet: lines.slice(0, 8).join('\n') + '\n...',
        confidence: 'High'
      });
      if (isExtreme) highCount++; else mediumCount++;
    }

    // Try AST Parse with Babel
    let ast = null;

    try {
      ast = parse(content, {
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
    } catch {
      // Handled gracefully below via regex fallback
    }

    let fileComplexity = 1;
    let functionCount = 0;
    let maxNestingDepth = 0;
    const extractedImports = [];
    const nodeStack = [];
    let currentNesting = 0;

    if (ast) {
      traverseAST(ast, {
        enter(node) {
          nodeStack.push(node);

          // Track Nesting Depth
          const isControlFlow = [
            'IfStatement',
            'ForStatement',
            'ForInStatement',
            'ForOfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'SwitchStatement',
            'TryStatement'
          ].includes(node.type);

          if (isControlFlow) {
            currentNesting++;
            if (currentNesting > maxNestingDepth) {
              maxNestingDepth = currentNesting;
            }

            if (currentNesting > 4) {
              const line = node.loc ? node.loc.start.line : 1;
              const col = node.loc ? node.loc.start.column : 1;
              if (!issues.some(i => i.filePath === filePath && i.type === 'Deep Nesting' && Math.abs(i.line - line) < 4)) {
                issues.push({
                  id: `nesting-${filePath}-${line}`,
                  filePath,
                  category: 'Complexity',
                  type: 'Deep Nesting',
                  title: `Deeply nested logic block (${currentNesting} levels deep)`,
                  severity: currentNesting > 6 ? 'High' : 'Medium',
                  line,
                  column: col,
                  why: `Nesting depth is ${currentNesting} levels (threshold is 4). Deep nesting drastically degrades readability and causes branch explosion.`,
                  suggestedApproach: 'Use guard clauses, invert conditionals for early returns, or extract nested routines.',
                  codeSnippet: lines[line - 1] ? lines[line - 1].trim() : '',
                  confidence: 'High'
                });
                if (currentNesting > 6) highCount++; else mediumCount++;
              }
            }
          }

          // Measure Cyclomatic Complexity
          const isDecisionPoint = [
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

          if (isDecisionPoint) {
            fileComplexity++;
          }

          // Track Functions & Function Length
          if ([
            'FunctionDeclaration',
            'FunctionExpression',
            'ArrowFunctionExpression',
            'ClassMethod',
            'ObjectMethod'
          ].includes(node.type)) {
            functionCount++;
            totalFunctions++;

            if (node.loc) {
              const fnLines = node.loc.end.line - node.loc.start.line + 1;
              const fnName = node.id?.name || node.key?.name || 'anonymous';
              if (fnLines > 45) {
                issues.push({
                  id: `fn-len-${filePath}-${node.loc.start.line}`,
                  filePath,
                  category: 'Complexity',
                  type: 'Long Function',
                  title: `Function \`${fnName}()\` is too long (${fnLines} lines)`,
                  severity: fnLines > 80 ? 'High' : 'Medium',
                  line: node.loc.start.line,
                  column: node.loc.start.column,
                  why: `Long functions violate Single Responsibility and make unit testing difficult to isolate.`,
                  suggestedApproach: `Decompose \`${fnName}\` into smaller, single-purpose helper functions.`,
                  codeSnippet: lines.slice(node.loc.start.line - 1, node.loc.start.line + 4).join('\n') + '\n...',
                  confidence: 'High'
                });
                if (fnLines > 80) highCount++; else mediumCount++;
              }
            }
          }

          // Extract Dependencies: require(...) and import ... from ...
          if (node.type === 'ImportDeclaration' && node.source && typeof node.source.value === 'string') {
            extractedImports.push(node.source.value);
          } else if (
            node.type === 'CallExpression' && 
            node.callee && 
            node.callee.name === 'require' && 
            node.arguments.length > 0 && 
            node.arguments[0].type === 'StringLiteral'
          ) {
            extractedImports.push(node.arguments[0].value);
          } else if (
            node.type === 'CallExpression' && 
            node.callee && 
            node.callee.type === 'Import' && 
            node.arguments.length > 0 && 
            node.arguments[0].type === 'StringLiteral'
          ) {
            extractedImports.push(node.arguments[0].value);
          }

          // Security Checks (AST-Based)
          // 1. Dangerous Dynamic Execution (eval, Function, vm)
          if (node.type === 'CallExpression') {
            let isEval = false;
            if (node.callee.type === 'Identifier' && node.callee.name === 'eval') isEval = true;
            if (node.callee.type === 'Identifier' && node.callee.name === 'Function') isEval = true;
            if (node.callee.type === 'MemberExpression' && node.callee.property && ['runInContext', 'runInNewContext'].includes(node.callee.property.name)) {
              isEval = true;
            }

            if (isEval) {
              const line = node.loc ? node.loc.start.line : 1;
              issues.push({
                id: `sec-eval-${filePath}-${line}`,
                filePath,
                category: 'Security',
                type: 'Unsafe Dynamic Execution',
                title: `Dangerous dynamic code execution via \`eval()\` / \`Function\``,
                severity: 'Critical',
                line,
                column: node.loc ? node.loc.start.column : 1,
                why: `Direct code execution from strings allows Remote Code Execution (RCE) and bypasses security boundaries.`,
                suggestedApproach: 'Replace `eval()` with structured JSON parsing, safe arithmetic tokenizers, or lookup maps.',
                codeSnippet: lines[line - 1] ? lines[line - 1].trim() : '',
                confidence: 'High'
              });
              criticalCount++;
            }

            // 2. Command Injection Check (child_process.exec with template literals or concatenation)
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property &&
              ['exec', 'execSync'].includes(node.callee.property.name)
            ) {
              const arg = node.arguments[0];
              if (arg && (arg.type === 'BinaryExpression' || arg.type === 'TemplateLiteral')) {
                const line = node.loc ? node.loc.start.line : 1;
                issues.push({
                  id: `sec-cmd-${filePath}-${line}`,
                  filePath,
                  category: 'Security',
                  type: 'Command Injection Risk',
                  title: `Unsanitized command execution via \`${node.callee.property.name}()\``,
                  severity: 'Critical',
                  line,
                  column: node.loc ? node.loc.start.column : 1,
                  why: `Concatenating dynamic variables into shell execution commands exposes the host server to arbitrary command injection.`,
                  suggestedApproach: 'Use `execFile` or `spawn` with an explicit argument array, or sanitize inputs strictly.',
                  codeSnippet: lines[line - 1] ? lines[line - 1].trim() : '',
                  confidence: 'High'
                });
                criticalCount++;
              }
            }
          }

          // 3. Performance: Sequential Await in Loops (N+1 query risk)
          if (node.type === 'AwaitExpression') {
            const inLoop = isInsideLoop(nodeStack);
            if (inLoop) {
              const line = node.loc ? node.loc.start.line : 1;
              if (!issues.some(i => i.filePath === filePath && i.type === 'N+1 Loop Query' && Math.abs(i.line - line) < 6)) {
                issues.push({
                  id: `perf-n1-${filePath}-${line}`,
                  filePath,
                  category: 'Performance',
                  type: 'N+1 Loop Query',
                  title: `Sequential \`await\` execution inside loop construct`,
                  severity: 'High',
                  line,
                  column: node.loc ? node.loc.start.column : 1,
                  why: `Awaiting asynchronous network or database calls in a sequential loop causes N+1 network roundtrips and severe latency.`,
                  suggestedApproach: 'Batch operations using `Promise.all()` or execute batch database `WHERE id IN (...)` lookups.',
                  codeSnippet: lines[line - 1] ? lines[line - 1].trim() : '',
                  confidence: 'High'
                });
                highCount++;
              }
            }
          }

          // 4. Hardcoded Secrets Check via StringLiteral
          if (node.type === 'StringLiteral' && typeof node.value === 'string') {
            const val = node.value.trim();
            const prevLine = lines[node.loc?.start?.line - 1] || '';
            const isSecretPattern = (
              /(JWT_SECRET|API_KEY|STRIPE_KEY|DB_PASSWORD|SECRET_KEY|BEARER_TOKEN|PRIVATE_KEY)/i.test(prevLine) &&
              val.length >= 8 &&
              !prevLine.includes('process.env') &&
              !val.includes('localhost') &&
              !val.includes('127.0.0.1')
            ) || (
              /^(gsk_[a-zA-Z0-9]{30,}|sk_live_[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35})$/.test(val)
            );

            if (isSecretPattern) {
              const line = node.loc ? node.loc.start.line : 1;
              if (!issues.some(i => i.filePath === filePath && i.type === 'Hardcoded Secret' && i.line === line)) {
                issues.push({
                  id: `sec-secret-${filePath}-${line}`,
                  filePath,
                  category: 'Security',
                  type: 'Hardcoded Secret',
                  title: `Hardcoded API key or credential secret detected`,
                  severity: 'Critical',
                  line,
                  column: node.loc ? node.loc.start.column : 1,
                  why: `Embedding sensitive production credentials directly in source code risks leakages via version control and breaches compliance.`,
                  suggestedApproach: 'Move secrets to environment variables (e.g., `process.env.JWT_SECRET`) and load via `.env`.',
                  codeSnippet: lines[line - 1] ? lines[line - 1].replace(val, '***MASKED_SECRET***').trim() : '',
                  confidence: 'High'
                });
                criticalCount++;
              }
            }
          }
        },
        exit(node) {
          const isControlFlow = [
            'IfStatement',
            'ForStatement',
            'ForInStatement',
            'ForOfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'SwitchStatement',
            'TryStatement'
          ].includes(node.type);
          if (isControlFlow) {
            currentNesting--;
          }
          nodeStack.pop();
        }
      });
    } else {
      // Fallback regex scan if Babel parser encountered syntax error
      lines.forEach((line, idx) => {
        const lineNo = idx + 1;
        const branchMatches = line.match(/\b(if|else if|switch|case|for|while|catch|\?)\b|&&|\|\|/g);
        if (branchMatches) fileComplexity += branchMatches.length;

        if (/(JWT_SECRET|API_KEY|STRIPE_KEY|DB_PASSWORD)\s*[:=]\s*["'][^"']{8,}["']/i.test(line) && !line.includes('process.env')) {
          issues.push({
            id: `sec-secret-${filePath}-${lineNo}`,
            filePath,
            category: 'Security',
            type: 'Hardcoded Secret',
            title: `Hardcoded secret detected at line ${lineNo}`,
            severity: 'Critical',
            line: lineNo,
            column: 1,
            why: 'Hardcoded sensitive token found in file.',
            suggestedApproach: 'Store secret in environment variables.',
            codeSnippet: line.trim(),
            confidence: 'Medium'
          });
          criticalCount++;
        }
      });
    }

    // SQL Injection Check via template literals or concatenated query strings
    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      if (
        /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|DROP TABLE)\b/i.test(line) &&
        (/['"].*\+.*['"]/.test(line) || /\$\{.*\}/.test(line))
      ) {
        if (!issues.some(i => i.filePath === filePath && i.type === 'SQL Injection' && Math.abs(i.line - lineNo) < 3)) {
          issues.push({
            id: `sec-sqli-${filePath}-${lineNo}`,
            filePath,
            category: 'Security',
            type: 'SQL Injection',
            title: `Unescaped SQL query concatenation at line ${lineNo}`,
            severity: 'Critical',
            line: lineNo,
            column: 1,
            why: `Direct string interpolation into SQL commands allows attackers to alter query structures and dump/modify database contents.`,
            suggestedApproach: 'Use parameterized SQL queries or ORM prepared statements (e.g. `db.query("... WHERE id = ?", [id])`).',
            codeSnippet: line.trim(),
            confidence: 'High'
          });
          criticalCount++;
        }
      }
    });

    // Check for high file complexity
    if (fileComplexity > 12) {
      issues.push({
        id: `comp-high-${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        filePath,
        category: 'Complexity',
        type: 'High Cyclomatic Complexity',
        title: `File has high cyclomatic complexity (Score: ${fileComplexity})`,
        severity: fileComplexity > 18 ? 'High' : 'Medium',
        line: 1,
        column: 1,
        why: `Cyclomatic complexity is ${fileComplexity} (recommended threshold is 10). High branch count drastically increases bug frequency and makes regression testing difficult.`,
        suggestedApproach: 'Refactor nested branching into Strategy pattern handlers, lookup tables, or small validator functions.',
        codeSnippet: lines.slice(0, 10).join('\n'),
        confidence: 'High'
      });
      if (fileComplexity > 18) highCount++; else mediumCount++;
    }

    totalCyclomaticComplexity += fileComplexity;
    if (fileComplexity > maxComplexityOverall) maxComplexityOverall = fileComplexity;

    // Resolve relative imports
    const resolvedImports = [];
    extractedImports.forEach(imp => {
      if (imp.startsWith('.')) {
        let basePath = filePath;
        const lastSlash = basePath.lastIndexOf('/');
        const dir = lastSlash !== -1 ? basePath.substring(0, lastSlash) : '';
        let target = dir ? `${dir}/${imp}` : imp;
        // Normalize ./ and ../
        const parts = target.split('/');
        const normalized = [];
        for (const p of parts) {
          if (p === '.' || p === '') continue;
          if (p === '..') normalized.pop();
          else normalized.push(p);
        }
        target = normalized.join('/');
        resolvedImports.push(target);
      } else {
        resolvedImports.push(imp);
      }
    });

    importsMap[filePath] = resolvedImports;

    // Calculate Maintainability Index (MI)
    const effectiveLoc = Math.max(1, lineCount);
    const effectiveComplexity = Math.max(1, fileComplexity);
    const estimatedVolume = Math.max(1, effectiveLoc * 4.5);
    const rawMI = 171 - (5.2 * Math.log(estimatedVolume)) - (0.23 * effectiveComplexity) - (16.2 * Math.log(effectiveLoc));
    const normalizedMI = Math.max(10, Math.min(100, Math.round((rawMI / 171) * 100)));

    // Classify layer
    let layer = 'General';
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('controller') || lowerPath.includes('route') || lowerPath.includes('api/')) layer = 'Controller';
    else if (lowerPath.includes('service') || lowerPath.includes('domain') || lowerPath.includes('usecase')) layer = 'Service';
    else if (lowerPath.includes('repo') || lowerPath.includes('model') || lowerPath.includes('dao') || lowerPath.includes('db')) layer = 'Repository';
    else if (lowerPath.includes('util') || lowerPath.includes('helper') || lowerPath.includes('lib/')) layer = 'Utility';
    else if (lowerPath.includes('config') || lowerPath.includes('env')) layer = 'Config';
    else if (lowerPath.includes('test') || lowerPath.includes('spec')) layer = 'Test';
    else if (lowerPath.includes('component') || lowerPath.includes('view') || lowerPath.includes('ui/')) layer = 'Component';

    fileMetrics[filePath] = {
      lineCount,
      complexity: fileComplexity,
      functionCount,
      maxNesting: maxNestingDepth,
      imports: resolvedImports,
      maintainabilityIndex: normalizedMI,
      layer,
      issuesCount: 0
    };

    // Collect code blocks for token-based duplicate detection (blocks of 4+ lines)
    if (lines.length > 5) {
      for (let i = 0; i < lines.length - 4; i += 3) {
        const block = lines.slice(i, i + 5).map(l => l.trim()).join(' ');
        if (block.length > 60 && !block.startsWith('import ') && !block.startsWith('const {') && !block.startsWith('//')) {
          codeBlocksForDuplication.push({
            filePath,
            startLine: i + 1,
            blockText: block
          });
        }
      }
    }
  });

  // 2. Pass Two: Architecture & DFS Circular Dependency Analysis
  const circularDependencies = [];
  const filesList = Object.keys(importsMap);

  const findMatchingFile = (target) => {
    return filesList.find(f => {
      if (f === target) return true;
      const fNoExt = f.replace(/\.(js|ts|jsx|tsx|json)$/, '');
      const tNoExt = target.replace(/\.(js|ts|jsx|tsx|json)$/, '');
      return fNoExt === tNoExt || f.endsWith('/' + target) || target.endsWith('/' + f);
    });
  };

  // Build Adjacency List for the true graph
  const adjacencyList = {};
  filesList.forEach(file => {
    adjacencyList[file] = [];
    const imports = importsMap[file] || [];
    imports.forEach(imp => {
      const match = findMatchingFile(imp);
      if (match && match !== file && !adjacencyList[file].includes(match)) {
        adjacencyList[file].push(match);
      }
    });
  });

  // Cycle detection using DFS with recursion stack
  const visited = {};
  const recStack = {};
  const currentPath = [];

  function dfsFindCycles(node) {
    visited[node] = true;
    recStack[node] = true;
    currentPath.push(node);

    const neighbors = adjacencyList[node] || [];
    for (const neighbor of neighbors) {
      if (!visited[neighbor]) {
        dfsFindCycles(neighbor);
      } else if (recStack[neighbor]) {
        // Cycle detected!
        const cycleStartIndex = currentPath.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycleNodes = currentPath.slice(cycleStartIndex).concat(neighbor);
          const cycleKey = [...new Set(cycleNodes)].sort().join(' ⇄ ');
          if (!circularDependencies.some(c => c.key === cycleKey)) {
            circularDependencies.push({
              key: cycleKey,
              nodes: cycleNodes,
              source: node,
              target: neighbor
            });

            issues.push({
              id: `arch-circ-${node.replace(/[^a-zA-Z0-9]/g, '_')}-${neighbor.replace(/[^a-zA-Z0-9]/g, '_')}`,
              filePath: node,
              category: 'Architecture',
              type: 'Circular Dependency',
              title: `Circular dependency loop between \`${node}\` and \`${neighbor}\``,
              severity: 'High',
              line: 1,
              column: 1,
              why: `Module \`${node}\` directly or indirectly imports \`${neighbor}\`, creating an execution recursion loop. This leads to undefined imports at runtime and tight architectural coupling.`,
              suggestedApproach: 'Extract shared interfaces, domain types, or event emitters into a third independent module.',
              codeSnippet: `// Cycle: ${cycleNodes.join(' -> ')}`,
              confidence: 'High'
            });
            highCount++;
          }
        }
      }
    }

    currentPath.pop();
    recStack[node] = false;
  }

  filesList.forEach(file => {
    if (!visited[file]) {
      dfsFindCycles(file);
    }
  });

  // 3. Pass Three: Token-Based Duplication Detection
  const blockHashMap = {};
  let duplicationCount = 0;

  codeBlocksForDuplication.forEach(item => {
    if (blockHashMap[item.blockText]) {
      const original = blockHashMap[item.blockText];
      if (original.filePath !== item.filePath) {
        duplicationCount++;
        if (!issues.some(i => i.type === 'Code Duplication' && i.filePath === item.filePath)) {
          issues.push({
            id: `dup-${item.filePath.replace(/[^a-zA-Z0-9]/g, '_')}-${item.startLine}`,
            filePath: item.filePath,
            category: 'Duplication',
            type: 'Code Duplication',
            title: `Duplicate code pattern with \`${original.filePath}\``,
            severity: 'Medium',
            line: item.startLine,
            column: 1,
            why: `Identical business logic blocks exist across multiple files. Code drift will lead to inconsistent bug fixes and technical debt.`,
            suggestedApproach: `Extract the common logic into a shared helper in \`/src/utils/\`.`,
            codeSnippet: item.blockText.slice(0, 140) + '...',
            confidence: 'Medium'
          });
          mediumCount++;
        }
      }
    } else {
      blockHashMap[item.blockText] = item;
    }
  });

  // Compute Per-File Issues Count
  issues.forEach(issue => {
    if (fileMetrics[issue.filePath]) {
      fileMetrics[issue.filePath].issuesCount++;
    }
  });

  // Compute Afferent/Efferent Coupling for all nodes
  const couplingMap = {};
  filesList.forEach(f => {
    const efferent = (adjacencyList[f] || []).length;
    let afferent = 0;
    filesList.forEach(other => {
      if ((adjacencyList[other] || []).includes(f)) afferent++;
    });
    const instability = (afferent + efferent > 0) ? (efferent / (afferent + efferent)) : 0;
    couplingMap[f] = {
      afferent,
      efferent,
      instability: Math.round(instability * 100) / 100,
      isHotspot: (fileMetrics[f]?.complexity || 1) > 10 && afferent >= 2
    };
  });

  // 4. Pass Four: Deterministic Health Index Scoring (0 - 100)
  const penaltyWeights = {
    critical: customWeights.critical ?? 15,
    high: customWeights.high ?? 7,
    medium: customWeights.medium ?? 3,
    low: customWeights.low ?? 1,
    circularDep: customWeights.circularDep ?? 8
  };

  const totalPenalty = (
    (criticalCount * penaltyWeights.critical) +
    (highCount * penaltyWeights.high) +
    (mediumCount * penaltyWeights.medium) +
    (lowCount * penaltyWeights.low) +
    (circularDependencies.length * penaltyWeights.circularDep)
  );

  const healthScore = Math.max(15, Math.min(100, Math.round(100 - totalPenalty)));

  // Sub-Scores (0 - 100)
  const securityScore = Math.max(15, Math.min(100, 100 - (criticalCount * 28)));
  const maintainabilityScore = Math.max(20, Math.min(100, 100 - (mediumCount * 5 + highCount * 6)));
  const complexityScore = Math.max(20, Math.min(100, Math.round(100 - (totalCyclomaticComplexity / Math.max(1, totalFiles)) * 4.2)));
  const architectureScore = Math.max(20, Math.min(100, 100 - (circularDependencies.length * 20)));
  const duplicationScore = Math.max(25, Math.min(100, 100 - (duplicationCount * 8)));
  
  // Testing score derived from presence of real test files
  const testFilesCount = filesList.filter(f => f.includes('.test.') || f.includes('.spec.') || f.startsWith('tests/')).length;
  const testingScore = testFilesCount > 0 ? Math.min(100, 60 + testFilesCount * 15) : 30;

  // Build transparent human-readable scoring explanation
  const penaltyDetails = [];
  if (criticalCount > 0) penaltyDetails.push(`-${criticalCount * penaltyWeights.critical}pts for ${criticalCount} Critical issues`);
  if (highCount > 0) penaltyDetails.push(`-${highCount * penaltyWeights.high}pts for ${highCount} High-severity issues`);
  if (mediumCount > 0) penaltyDetails.push(`-${mediumCount * penaltyWeights.medium}pts for ${mediumCount} Medium issues`);
  if (circularDependencies.length > 0) penaltyDetails.push(`-${circularDependencies.length * penaltyWeights.circularDep}pts for ${circularDependencies.length} Circular dependencies`);

  const scoreExplanation = penaltyDetails.length > 0
    ? `Base 100 with deductions: ${penaltyDetails.join(', ')}.`
    : `Flawless score: No architectural, security, or complexity violations detected.`;

  return {
    healthScore,
    scoreExplanation,
    subScores: {
      security: securityScore,
      maintainability: maintainabilityScore,
      complexity: complexityScore,
      architecture: architectureScore,
      duplication: duplicationScore,
      testing: testingScore
    },
    counts: {
      totalIssues: issues.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      complexity: issues.filter(i => i.category === 'Complexity').length,
      security: issues.filter(i => i.category === 'Security').length,
      performance: issues.filter(i => i.category === 'Performance').length,
      architecture: issues.filter(i => i.category === 'Architecture').length,
      duplication: issues.filter(i => i.category === 'Duplication').length
    },
    issues,
    fileMetrics,
    couplingMap,
    circularDependencies,
    adjacencyList,
    totalFiles,
    totalLines,
    totalFunctions,
    averageComplexity: Math.round((totalCyclomaticComplexity / Math.max(1, totalFiles)) * 10) / 10,
    maxComplexity: maxComplexityOverall
  };
}

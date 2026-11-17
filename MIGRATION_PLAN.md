# PatchPilot — Migration & Full Product Redesign Plan

## 1. Executive Summary & Audit Overview

PatchPilot is an AI-powered Code Intelligence, Architectural Review, Code Quality Analysis, and Refactoring Platform.
This document outlines the systematic migration from Vite + React 19 SPA to a Next.js App Router (TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Monaco Editor, React Flow) developer SaaS platform.

### Preserved Backend Architecture
- **Express Backend Service**: Runs on `http://localhost:3008` (orchestrated by `server.js`).
- **Engine Capabilities**:
  - `GET /api/health` — Groq model verification, node runtime, health status.
  - `POST /api/upload-zip` — In-memory ZIP unpack, security traversal guards, file filtering.
  - `POST /api/github-repo` — Recursive Git tree traversal, raw content extraction.
  - `POST /api/explain-issue` — Structured Groq LLM diagnostic reports.
  - `POST /api/propose-refactor` — Groq Llama-3.3-70b AST refactoring, unified Git diff generation.
  - `POST /api/run-tests` — Sandboxed `node:vm` in-memory test runner executing real assertions.
  - `POST /api/rag-chat` — RAG keyword-scored context-aware architectural assistant.
  - `POST /api/generate-patch` — Downloadable RFC-compliant `.patch` files.
- **Security Constraint**: All secrets (`GROQ_API_KEY`) strictly remain server-side in Express `.env` with no `NEXT_PUBLIC_` leakage. Next.js proxies all `/api/*` requests to port 3008 via `next.config.ts` rewrites.

---

## 2. Target Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router, Server Components + Interactive Client Islands) |
| **Language** | TypeScript 5+ (Strict typing across domain models) |
| **Styling** | Tailwind CSS v3/v4 + Tailwind Animate + Custom Obsidian/Navy Theme |
| **UI Components** | Radix UI Primitives / shadcn/ui pattern + Lucide React |
| **State Management** | Zustand (persistent active repository, analysis caches, audit history, settings) |
| **Server State / Caching** | TanStack Query v5 |
| **Editor / Diffing** | Monaco Editor (`@monaco-editor/react`) + Unified & Side-by-side Diffs |
| **Architecture Graph** | React Flow (`@xyflow/react`) with custom nodes, layout algorithms, circular path tracing |
| **Validation** | Zod schemas for all API payloads and settings |

---

## 3. Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                     # Global Root Layout with Fonts, Providers, Command Palette
│   ├── globals.css                    # Obsidian Design Tokens, Tailwind Directives, Custom Scrollbars
│   ├── page.tsx                       # Root Route (Redirects to Dashboard)
│   ├── dashboard/
│   │   └── page.tsx                   # Code Health Overview, Metrics, Priority Queue, Activity
│   ├── repositories/
│   │   ├── page.tsx                   # Repository Workspace & Manager (Import ZIP, GitHub, Samples)
│   │   └── [id]/page.tsx              # Individual Repository Explorer & File Breakdown
│   ├── analysis/
│   │   └── [id]/page.tsx              # Deep AST Code Smells & Security Findings Inspector
│   ├── issues/
│   │   └── page.tsx                   # Global Code Issues Explorer with Multi-faceted Filtering
│   ├── architecture/
│   │   └── [id]/page.tsx              # Interactive React Flow Dependency Graph & Coupling Visualizer
│   ├── refactor/
│   │   └── [id]/page.tsx              # Monaco Diff Editor, 3-Panel Refactoring Studio, AI Prompts
│   ├── tests/
│   │   └── [id]/page.tsx              # Sandboxed VM Test Console & Regression Detection
│   ├── assistant/
│   │   └── page.tsx                   # Dedicated Full-Page AI Codebase Architect Chat (RAG)
│   ├── history/
│   │   └── page.tsx                   # Refactoring Audit Logs, Rollback Triggers & JSON Export
│   └── settings/
│       └── page.tsx                   # Penalty Weights, LLM Status, Thresholds & Preferences
├── components/
│   ├── layout/                        # AppShell, AppHeader, AppSidebar, CommandPalette, Breadcrumbs
│   ├── dashboard/                     # RadialHealthScore, MetricCards, IssueBreakdown, ActivityFeed
│   ├── repository/                    # RepoCard, RepoImporterModal, ZipUploader, GitHubImporter
│   ├── analysis/                      # FindingsTable, FindingDetailModal, SeverityPill, CategoryFilter
│   ├── architecture/                  # DependencyGraph (React Flow), NodeInspector, CircularAlert
│   ├── refactor/                      # MonacoDiffViewer, PromptPresetSelector, RiskAssessmentCard
│   ├── testing/                       # TestRunnerConsole, TestSuiteCard, RegressionBanner, TestSummary
│   ├── assistant/                     # AssistantChatView, FileContextIndicator, PromptShortcuts
│   ├── shared/                        # StatBadge, CodeBlock, EmptyState, SkeletonLoader, ConfirmModal
│   └── ui/                            # Buttons, Dialogs, Inputs, Tooltips, Tabs, Dropdowns
├── hooks/                             # useActiveRepo, useCodebaseScan, useKeyboardShortcuts
├── lib/                               # apiClient, utils, queryClient, formatters
├── services/                          # staticAnalyzer.ts, sampleRepos.ts
├── stores/                            # repoStore.ts, historyStore.ts, settingsStore.ts
└── types/                             # repository.ts, analysis.ts, issue.ts, test.ts, refactor.ts
```

---

## 4. Phase-by-Phase Execution Roadmap

1. **Phase 1: Dependencies & Next.js Foundation**: Configure Next.js, TypeScript, Tailwind CSS, Lucide React, Zustand, TanStack Query, `@xyflow/react`, `@monaco-editor/react`, and configure port 3008 rewrites in `next.config.ts`.
2. **Phase 2: Core Domain Models & Services Migration**: Convert `staticAnalyzer.js` and `sampleRepos.js` to TypeScript with strict type definitions.
3. **Phase 3: Design System & Obsidian Theme**: Build custom Tailwind tokens matching Linear/Cursor SaaS aesthetic (`#090D16` obsidian, `#111726` surface, indigo `#6366F1`, emerald `#10B981`, amber `#F59E0B`, rose `#EF4444`, cyan `#06B6D4`).
4. **Phase 4: Application Shell & Command Palette**: Collapsible sidebar with real data counters, top navigation with breadcrumbs, repository switcher, Cmd+K global command palette.
5. **Phase 5: Dashboard & Telemetry**: Radial health score, 6 core metrics, severity breakdown, file explorer, priority findings queue.
6. **Phase 6: Repository Workspace**: GitHub importer, ZIP upload, sample repositories, active repo switching.
7. **Phase 7: Code Analysis & Findings**: Multi-faceted filtering, AST finding inspector with evidence, AI explanation modal, one-click refactor trigger.
8. **Phase 8: Architecture Intelligence**: React Flow dependency visualizer, circular dependency cycle detection, node inspector, coupling metrics.
9. **Phase 9: AI Refactoring Studio**: Monaco Diff Editor, 3-panel workflow, AI explanation, accept/reject/rollback, Git patch download.
10. **Phase 10: Sandboxed Test Runner**: VM test runner execution, test suite discovery, regression detection, rollback, auto-patch regression.
11. **Phase 11: AI Codebase Assistant**: RAG conversation interface, file citations, dynamic finding shortcuts.
12. **Phase 12: Audit History & Settings**: Refactoring logs, JSON export, rollback snapshots, configurable health scoring weights.
13. **Phase 13: End-to-End Verification**: Verification of all routes, builds, API requests, test runs, and responsive layouts.

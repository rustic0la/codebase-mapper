# First-version architecture

This is the proposed architecture of the complete first CLI version, rather than a list of modules already implemented. The current first step in `specs/001-review-prototype.md` remains smaller: validate the reference JSON and generate JSON/Markdown. The filenames below help us discuss future responsibilities; current modules are listed in [README.md](../README.md).

The first version has two independent paths: dependency analysis and proof of work. A report can use only the agent's work materials, only the graph, or both. A disabled module is explicitly marked as disabled. Empty or failed analysis is never presented as an absence of dependencies.

## Diagrams

1. [CLI and run control](./v1-cli.svg) — [Mermaid](./v1-cli.mmd).
2. [Source analysis and graph](./v1-analysis.svg) — [Mermaid](./v1-analysis.mmd).
3. [Proof of work](./v1-evidence.svg) — [Mermaid](./v1-evidence.mmd).
4. [Report generation and viewing](./v1-report.svg) — [Mermaid](./v1-report.mmd).
5. [GitHub Actions](./v1-github.svg) — [Mermaid](./v1-github.mmd).

Descriptions, Mermaid sources, and SVG previews are stored in Git. Local PNG and Excalidraw files have been moved to `.context/diagrams/`; that directory is excluded from Git.

Arrows represent data flow or a sequence of steps. Parallel branches in a diagram do not require parallel execution. A separate box or file represents a responsibility within one utility, rather than a separate service.

## Module inputs and outputs

| Module                                     | Input                                           | Output and verifiable responsibility                                                                                                                |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli/args.ts`, `config.ts`                 | Arguments and configuration                     | Mode, paths, and constraints. Validate argument combinations and paths; interface commands are still under discussion                               |
| `application/context.ts`                   | Explicit SHAs/snapshots and CI metadata         | `RunContext`: run ID, scope, tool version, snapshots, and their provenance. Proof of work without a graph does not require reading Git history      |
| `git/snapshots.ts`, `changes.ts`           | Available local Git repository                  | Merge-base, head, and file changes. Determine PR changes from merge-base to head; also preserve the original base SHA                               |
| `analysis/scan.ts`, `scope.ts`             | Two snapshots and scope rules                   | Selected sources and exclusions. Define extensions, limits, and symlink handling before execution                                                   |
| `analysis/parse.ts`, `imports.ts`          | File text and language                          | Detected constructs with source paths, line numbers, and relationship kinds; computed paths do not become invented edges                            |
| `analysis/resolve.ts`, `classify.ts`       | A construct and explicitly supported path rules | Internal file, external dependency, intentional exclusion, or unresolved reference with a reason. Validate Flow and React monorepo rules separately |
| `graph/*`                                  | Files and confirmed edges                       | Indexes in both directions, comparison, cycles, and potential impact with a depth limit. Track type-only and runtime relationships separately       |
| `evidence/read.ts`, `normalize.ts`         | Task, agent package, and normalized CI result   | Criteria, checks, and attachment references in a common format. Validate schema versions, unique IDs, and cross-references                          |
| `evidence/provenance.ts`                   | Check result and run context                    | Separate provenance: agent claim, collector record, or CI binding. A plain `source: ci` field in JSON remains a claim                               |
| `evidence/snapshot.ts`, `artifacts.ts`     | SHA/manifest and attachments                    | Freshness and integrity. A missing SHA means unknown freshness. A hash confirms integrity, rather than the source's honesty                         |
| `evidence/criteria.ts`, `assess.ts`        | Criteria and verified material references       | Which materials relate to a criterion, and which are missing or stale. A successful command does not automatically mean the task is accepted        |
| `report/assemble.ts`                       | Context, available results, and diagnostics     | `ReportData`: one result for all reporters, including disabled/partial/failed module status                                                         |
| `report/json.ts`, `markdown.ts`, `html.ts` | One `ReportData`                                | Consistent JSON, Markdown, and HTML representations. Presentation differs; the set of facts stays the same                                          |
| `report/write.ts`, `copy-artifacts.ts`     | Reporter output and manifest                    | Report and attachment directory. Do not copy files through arbitrary external paths; treat HTML and links as data                                   |
| `cli/exit.ts`, `errors.ts`                 | Run outcome and diagnostic errors               | Consistent exit codes and stdout/stderr. Utility errors are distinct from failed checks of the task being analyzed                                  |
| `.github/workflows/report.yml`             | PR event and available CI results               | One run of the same CLI, a job summary, and an artifact. Use explicit base/head SHAs, run ID, and attempt number                                    |

## Proposed contracts

These contracts describe the complete V1. The current `ReportData` contains `InputPackage` fields and `summary` counts; run context, module statuses, and proof of work are not yet implemented.

| Contract             | Main fields                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `RunContext`         | `schemaVersion`, `toolVersion`, `runId`, `repository`, `headSha`, `baseSha?`, `mergeBaseSha?`, `scope`, `ciRun?` |
| `ChangeSet`          | Added/modified/deleted files, explicit rename pairs, and snapshots being compared                                |
| `Edge`               | `from`, `to`, `kind`, `typeOnly`, `specifier`, `sourceLine`, `snapshotId`                                        |
| `AnalysisResult`     | Module status, files and edges from two snapshots, changes, cycles, impact, and limitations                      |
| `TaskSpec`           | `taskId`, description, and criteria with unique `criterionId` values                                             |
| `CheckResult`        | `checkId`, `criterionIds`, declared command, outcome, `exitCode?`, time, snapshot, provenance, `artifactIds`     |
| `ArtifactRef`        | `artifactId`, relative path, material type, and expected hash when available                                     |
| `EvidenceAssessment` | Checks and materials, freshness, integrity, provenance, missing links, and unverified criteria                   |
| `ReportData`         | Context, status of each module, `analysis?`, `evidence?`, diagnostics                                            |

`passed`, `failed`, `skipped`, and `not-run` describe a check's outcome. Store provenance, freshness (`same`, `different`, `unknown`), and attachment integrity separately. If incomplete input is insufficient to verify truth, show that limitation. Local uncommitted work requires a manifest hash for the checked scope; a Git SHA alone does not describe the working tree.

Agent data and external CI results are accepted through our normalized format. Native import of all Playwright/JUnit fields, requests to arbitrary CI APIs, and confirmation of external runs are future adapters, rather than first-version promises. In the first version, a CI process can prepare `ci-results.json` and attachments; the utility only reads them. It does not execute tests from the repository being analyzed or commands from the package.

## File layout

```text
src/
  cli/           args.ts, config.ts, errors.ts, exit.ts, show-report.ts
  application/   context.ts, run.ts
  contracts/     input.ts, analysis.ts, evidence.ts, report.ts
  git/           snapshots.ts, changes.ts
  analysis/      analyze.ts, scan.ts, scope.ts, parse.ts,
                 imports.ts, resolve.ts, classify.ts
  graph/         index.ts, compare.ts, cycles.ts, impact.ts
  evidence/      read.ts, normalize.ts, provenance.ts, snapshot.ts,
                 artifacts.ts, criteria.ts, assess.ts
  report/        assemble.ts, json.ts, markdown.ts, html.ts,
                 write.ts, copy-artifacts.ts
    assets/      map.js, evidence.js, diagnostics.js, report.css
tests/
  fixtures/      manual graphs, selected React scope, evidence packages
  cli/           real process: arguments, exit code, output files
  analysis/      supported constructs, unresolved references, exclusions
  graph/         chains, cycles, diamonds, snapshot comparison
  evidence/      missing IDs/files, different snapshot, skipped checks
  report/        reporter consistency and browser scenarios
.github/
  workflows/     report.yml
```

This guides responsibility boundaries; it does not require an empty file for every line. Small responsibilities can stay together during the first steps; extract files when actual implementations appear.

## Scope of the complete V1

V1 includes a local CLI, a specific supported JS/Flow scope, two independent processing paths, a common data format, JSON/Markdown/HTML, portable attachments, local report viewing, and a PR workflow. For React, initially limit the scope to seven real files from the reference snapshot; expanding to the entire monorepo requires separate acceptance checks. Do not claim support for forks and all React build rules based on a few matching aliases.

V1 excludes AI chat/automatic review, automatic agent execution, execution of loaded commands, a server with accounts, bot comments, a custom diff viewer, and publishing reports online. The architecture does not yet specify a parser library or HTML graph engine.

## Reading the diagrams together

Start with the proof of work diagram: `task.json → checks → materials → assessment → report`. It does not require understanding ASTs or graph traversal. Then examine the general CLI flow, followed by dependency analysis. Implementing everything shown in a single step is not authorized.

## Integration sources

- [GitHub Actions events and PR SHA behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).
- [Storing and downloading workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).
- [Playwright reporters: result formats](https://playwright.dev/docs/test-reporters).

The sequence of steps, contracts, and filenames in the diagrams are our design decisions. Official sources confirm only integration mechanisms and external tool formats.

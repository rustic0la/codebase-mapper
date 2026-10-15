# Plan for PR analysis and report generation with a CLI

## 1. Product format

The user clarified the product: a console utility integrated into GitHub Actions. When a PR is created or its branch is updated, the utility analyzes changes, connects them to dependencies, and generates a report that can be opened after the pipeline finishes. Playwright's HTML report is the reference for delivering the result.

Local runs and CI use the same command. The output is a directory containing `report.json`, a short `summary.md`, and, once the HTML reporter is implemented, an `index.html` with the map. The terminal shows a brief result and the report path. A separate web application, accounts, and a server database are not required.

React is the selected reference repository: https://github.com/react/react. Using React to build the tool itself is not a requirement. We will choose the HTML report technology based on its needs; first, define the data and CLI.

Cartograph is the inspiration. Our independent contribution is PR change analysis, a map of potential impact, and verifiable evidence of agent work in a portable pipeline report.

## 2. Usage scenario

1. A developer opens a PR or pushes new commits to its branch.
2. GitHub Actions runs the CLI with explicit base and head snapshots.
3. The utility identifies changed files, analyzes supported imports, and compares dependency edges.
4. If check evidence is provided, it links that evidence to the task and snapshot.
5. It generates a report and a brief run summary. The workflow stores the report directory as an artifact.
6. A reviewer reads the summary, downloads the report, and opens the map, dependencies, and check evidence. Source files and diffs open in GitHub or an editor.

The planned GitHub trigger is `pull_request` with the `opened`, `synchronize`, and `reopened` types; a new commit in an open PR triggers a new analysis. Analyzing every push without a PR is a separate future option.

Use an artifact and a job summary for the first integration. Publishing HTML at a permanent URL and posting bot comments on PRs are separate extensions. A downloadable artifact is not itself a published website.

## 3. Report contents

- Repository, PR when available, run time, tool version, and data schema version.
- IDs of the base, head, and comparison snapshots; analysis completeness.
- Changed files and a dependency map. Selecting a file opens its direct and reverse dependencies and source links.
- Added and removed edges, new cycles, and potential impact through imports with a depth limit.
- The agent's task and acceptance criteria, if the corresponding package is provided.
- Results of the provided checks, logs and attachments, provenance, and freshness for the snapshot.
- Unresolved imports, analysis errors, unsupported constructs, and unverified criteria.

The import map shows structural dependencies. It does not prove that a specific change will break the application. Type-only edges are separate from runtime edges; having no incoming imports does not prove that code is unused.

An agent report contains declared results. JSON schema and hash validation establish data consistency; independent confirmation of execution requires verification against a trusted CI source or a rerun on the same snapshot. A missing or skipped result does not become a passing result.

## 4. Architecture and initial stack

Detailed module diagrams, inputs and outputs, and the proposed file structure: [diagrams/README.md](./diagrams/README.md). Graph analysis and proof of work are independent; a report can contain either one on its own. The diagrams describe the proposed complete V1, rather than capabilities already implemented.

| Part      | Responsibility                                                               | Initial choice                                                                  |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| CLI       | Arguments, errors, orchestration, output files                               | Node.js + TypeScript; built-in `node:util` argument parsing                     |
| Contracts | Versions and validation for analysis, review, and evidence                   | JSON; current validation is manual, with Zod still planned                      |
| Parser    | Files, imports, path resolution, evidence for edges                          | Choose after testing Flow syntax on React; do not assume ts-morph supports Flow |
| Graph     | Indexes, traversal, cycles, snapshot comparison                              | Pure TypeScript functions                                                       |
| Reporters | Terminal, Markdown, JSON, then an HTML map                                   | Generators based on one analysis result                                         |
| Checks    | Manual reference data, CLI and graph tests, browser scenarios for the report | Vitest; Playwright for HTML                                                     |
| CI        | CLI execution, summary, and artifact                                         | GitHub Actions                                                                  |

The parser is independent of HTML, React, AI, and the GitHub API. Reporters do not duplicate graph algorithms. HTML reads the completed result without analyzing the repository again. A portable report includes its assets in the report directory; reading saved data does not require network access. If the chosen implementation requires local serving, add a `show-report` command and document it explicitly.

The early Vite/React scaffold has been removed. package.json and configuration files now target Node.js modules: TypeScript compilation and Vitest tests. The executable CLI validates a supplied JSON package and writes JSON and Markdown reports. Source analysis, the reference React package, and the HTML reporter are not implemented yet; the HTML technology remains undecided.

## 5. Stages

### Stage 0. Data for one report

Define one reference input and its expected output together. Use a real subset of React from `specs/001-review-prototype.md`, with edges labeled manually. List unsupported imports and imports outside the selected subset separately. Record the provenance of example check results.

**Acceptance:** files, edges, snapshots, and limitations are known in advance. The reference data is not generated by the implementation being tested.

### Stage 1. CLI and text report

The first small result: a command accepts reference JSON and an output directory, validates the input, and creates `report.json` and `summary.md`. This is the first reporter; source analysis comes in later tasks. Describe arguments, messages, and exit codes before implementation.

The command is implemented as `node dist/cli.js --input <input.json> --out <output-directory>` after `pnpm build`. It exits with `0` after both reports are written, including for a valid partial package with warnings. Argument, reading, validation, and writing errors produce an error in stderr and exit code `1`. Report writes are sequential; a failed Markdown write can leave the JSON report on disk. The eight CLI tests use synthetic packages; the manual React reference package remains to be prepared.

**Acceptance:** valid input produces the expected files and summary; malformed JSON, an unknown version, a missing file, and a write failure produce clear errors. Supported warnings are distinguished from an inability to perform analysis.

### Stage 2. Real analysis and Git snapshot comparison

Add syntax constructs one at a time: imports and re-exports, type-only edges, literal dynamic imports, and require calls. For React, check Flow, paths between packages, and build-time forks separately. Account for actual incompleteness and preserve the reasons for unresolved edges.

Add import indexes, reverse traversal with a depth limit, cycle protection, and graph comparison. The Git adapter preserves `baseSha`, `headSha`, and `mergeBaseSha`; PR changes are determined from merge-base to head. Do not automatically replace snapshots with `GITHUB_SHA`, which may refer to a merge commit for a PR event. Unknown or unavailable history is an explicit error.

**Acceptance:** an exact manual parser reference, chains, cycles, diamonds, deleted files, renames, and negative examples. Every internal import is supported by a file and line. Type-only impact is shown separately.

### Stage 3. HTML report with a map

Generate a portable HTML report from the same result. The map is central, with a file list and details for the selected node beside it. Provide text navigation with keyboard support, explanations of incompleteness, and source links for a specific commit. There is no embedded diff.

**Acceptance:** the report can be opened and explored after the CLI completes. Selecting a file synchronizes the map, edge list, and details. A browser scenario tests real clicks, keyboard interaction, empty states, and a large example. Choose numeric budgets for report size and interaction time before checking them.

### Stage 4. Proof of work

Accept a task package and results of checks already performed. Distinguish outcome, source, and snapshot freshness. Show missing evidence and uncovered criteria.

The CLI does not run commands from imported reports or execute scripts from the analyzed repository. Test results come from an existing, explicitly configured CI process. Integration with a particular format, such as Playwright, is a separate task. Linking evidence to a file does not prove full test coverage.

**Acceptance:** a real completed-task package and negative examples with a different snapshot, a missing log, and a failed or unexecuted test. Demo data is clearly distinguished from actual results.

### Stage 5. GitHub Actions

The workflow runs the same local command on a PR, passes explicit snapshots, saves Markdown in the job summary, and stores the report directory as an artifact. Diagnostic evidence is preserved even when analysis fails. A rerun is tied to a run ID and head SHA; a new run does not present an old report as current.

**Acceptance:** an actual run when a PR is created and a rerun after a new commit; downloading and opening the report; a clear failed run. Start by testing this in our repository. The React copy remains analysis data; publishing changes upstream is not required.

### Stage 6. Portfolio and extensions

A README with installation, local execution, an example workflow, and limitations; an example report on React; a short video; architecture and measured results. Describe capabilities actually implemented and our own contribution, and credit Cartograph as the inspiration.

Add AI explanations and AI review under a separate specification after the pipeline works. The model receives verified structural data, source files, and limitations, and answers with references; it does not create edges. Accounts, teams, and SaaS are outside the current plan.

## 6. Pair workflow

One step produces one clear result. First explain the input, output, and reason for the decision; the user participates in understanding the data and code. Then implement a single part, run checks, and discuss the result. The overall plan does not instruct the agent to complete an entire stage automatically.

The JSON-to-report CLI and its process tests are implemented. The manual React input and expected summary remain to be reviewed together before moving to source analysis. Current specification: [specs/001-review-prototype.md](./specs/001-review-prototype.md).

## 7. Checks and evidence

For the parser, preserve a manual expected result, the actual result, and a diff; for the CLI, preserve arguments, stdout/stderr, exit code, and output files; for HTML, preserve the browser scenario and trace. Checks for our tool run separately from the analyzed repository. Explain changes to reference data and checks.

`pnpm typecheck`, `pnpm test`, and `pnpm build` target the Node.js project. `pnpm test` builds the CLI before running Vitest. The 76 tests cover the implemented modules and eight real-process CLI scenarios: missing arguments, valid input, malformed JSON, an unsupported schema version, a missing input file, a Markdown write failure, repeated runs, and unknown options. Tests use synthetic packages; the manual reference React package is not implemented yet. Introduce Playwright with the HTML reporter. Preserve actually executed commands and their results separately from demo data.

## 8. Starting references

- [GitHub Actions: pull_request events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).
- [GitHub Actions: storing reports as artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).
- [Playwright: HTML reporter](https://playwright.dev/docs/test-reporters#html-reporter).

Before implementing specific commands and workflows, check current instructions and version compatibility.

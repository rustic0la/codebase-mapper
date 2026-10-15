# Task 001: first CLI report for a React scope

## Product format

The utility is designed to run locally and in GitHub Actions when a PR is created or updated. It generates a report from code snapshots; later, an HTML reporter will display the graph and evidence of the agent's work. A separate React application is not the goal. The specification's filename is retained for existing links; the earlier interface prototype was replaced by this task before implementation.

## First small scenario

The user supplies the CLI with reference JSON and an output directory. The command validates the package and creates `report.json` and a short `summary.md`. After `pnpm build`, run `node dist/cli.js --input <input.json> --out <output-directory>`. Before preparing the React reference package, review its input and expected summary text together.

JSON reading, package validation, statistics, Markdown rendering, report file writing, and the executable CLI are implemented. Eight CLI tests invoke the built command with synthetic packages. The manually verified React reference package remains a next step; the acceptance criteria below describe the complete scenario.

## Reference data

- Repository: https://github.com/react/react.
- Head commit: `15f7cd693e102c568df501eeeb9684f507e0ec0b`, `Add ReactDOM browser() API (#37143)`.
- Base commit: `6cb4322d65f4c68daa183df24b5f81668cedab14`.
- Seven real files around `packages/react-dom/src/shared/ReactDOMBrowser.js`. This is a selected scope, rather than a complete analysis of the commit or repository.
- Relationships are annotated manually and verified against imports/exports in the head source. Type-only imports are separated from runtime relationships.
- React tests and builds are not run. Their results are not invented. Future proof of work examples retain explicit demo provenance.

## Contract for this step

Schema version, repository URL, snapshot identifiers, file list, annotated relationships with source paths and line numbers, analysis boundaries, and warnings. Sources are linked to an exact commit. The seven files in the reference example do not mean that the entire PR is analyzed.

JSON and Markdown are generated from one validated result. Exit code `0` means both files were written successfully, including for a valid partial package with warnings. Errors in arguments, reading, validation, or writing produce a message in stderr and exit code `1`. Files are written sequentially; a failed Markdown write can leave `report.json` on disk. Report generation is not evidence that the analyzed code is correct.

## Acceptance criteria

1. A valid package creates the two expected files. The summary shows the repository, snapshot, selected analysis scope, and limitations.
2. `ReactDOMBrowser.js` imports `ReactSymbols.js`, `ReactFeatureFlags.js`, and `ReactTypes.js`; the last import is marked as type-only. `ReactDOM.js` imports `ReactDOMBrowser.js`.
3. Every source link contains the head commit SHA; the import line matches the actual source.
4. Malformed JSON, unknown versions, duplicate IDs, and references to missing files are rejected.
5. Missing input and write failures produce a clear error and a consistent nonzero exit code. Invalid input does not create a success report.
6. Repeated runs on the same input produce the same analysis and list order. Execution timing information does not change structural results.

## Deferred

The parser, Flow and cross-package path resolution for the entire React repository, Git adapter, HTML graph, CI result import, GitHub workflow, AI, website publishing, bot comments, and custom diff viewer. These parts remain in the plan and are implemented as separate tasks.

## Evidence

`pnpm test` builds the CLI before running Vitest. The 76 tests cover JSON reading, validation, report functions, and eight real-process CLI scenarios using synthetic packages. The CLI tests check exit codes, stdout/stderr, output contents, invalid-input rejection, write failures, and stable results on repeated runs. The manually verified React input and expected output are not yet prepared. Record the executed commands and results; synthetic test results do not establish the selected React relationships.

## Pair work

Review the manual React input and expected summary together next, identifying useful information and checking each relationship against its source. Then write one small fragment and verify it. This specification does not authorize implementing everything automatically in a single step.

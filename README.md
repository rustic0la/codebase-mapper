# Codebase Mapper

A command-line tool for analyzing pull requests and generating portable reports with a dependency map and evidence of an agent's work. The project develops in small steps; the current PR adds the data processing foundation.

JSON reading, input package validation, summary statistics, and a Markdown summary with GitHub source links are implemented. The executable CLI, writing `report.json`/`summary.md`, source parser, HTML map, and GitHub Actions workflow for PR analysis are not implemented yet.

## Development

Requires Node.js 20.19+ and pnpm 10.15.1.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

`pnpm build` compiles modules from `src/` into `dist/`. It builds the modules rather than running a finished CLI. Tests cover the implemented contracts, JSON reading, and report functions; CLI checks will be added once the command is implemented.

## Modules

| Function         | Contract                    | Purpose                                                                  |
| ---------------- | --------------------------- | ------------------------------------------------------------------------ |
| `reportJson`     | `string → Promise<unknown>` | Reads JSON; propagates read and parse errors to the caller               |
| `checkInput`     | `unknown → InputPackage`    | Validates the structure, field values, IDs, and references between files |
| `createReport`   | `InputPackage → ReportData` | Sorts files and edges and adds counts                                    |
| `renderMarkdown` | `ReportData → string`       | Generates a summary with snapshots, edges, limitations, and warnings     |

Input format version `1` includes an HTTP(S) repository URL, two 40-character Git SHAs, files with relative paths using `/`, edges, analysis scope, and warnings. Type-only edges are counted separately. Markdown links use GitHub's `/blob/<head SHA>/<path>#L<line>` structure; the reporter does not support other hosts yet.

Package validation does not confirm that imports exist in the source, that tests of the analyzed project ran, or that task criteria were met. Test packages are synthetic. The tool does not execute commands from imported data.

The complete V1 plan is in [PLAN.md](./PLAN.md), detailed diagrams are in [diagrams/README.md](./diagrams/README.md), and the next CLI scenario is in [specs/001-review-prototype.md](./specs/001-review-prototype.md). Collaboration rules are in [AGENTS.md](./AGENTS.md), and notes on verification and proof of work are in [WORKSHOP-NOTES.md](./WORKSHOP-NOTES.md).

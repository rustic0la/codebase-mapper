# Codebase Mapper

A command-line tool under development for PR analysis and portable reports with a dependency map and evidence of an agent's work.

The current CLI reads an annotated JSON package, validates it, and writes `report.json` and `summary.md` with dependency statistics and GitHub source links. Source parsing, Git snapshot comparison, an HTML map, evidence import, and GitHub Actions integration are planned stages. The real React reference package is still being prepared; current checks use synthetic input.

## Quick start

Requires Node.js 20.19+ and pnpm 10.15.1.

```sh
pnpm install --frozen-lockfile
pnpm build
```

Save this package as `input.json` in your working directory. The SHAs and dependency edge are synthetic examples; they do not represent verified source facts.

```json
{
  "schemaVersion": 1,
  "repository": "https://github.com/example/repository",
  "base": {
    "commitSha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "head": {
    "commitSha": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  },
  "files": [
    { "id": "entry", "path": "src/main.js" },
    { "id": "types", "path": "src/types.js" }
  ],
  "edges": [
    {
      "id": "entry-types",
      "from": "entry",
      "to": "types",
      "kind": "import",
      "typeOnly": true,
      "specifier": "./types",
      "sourceLine": 1
    }
  ],
  "scope": {
    "completeness": "partial",
    "description": "Synthetic example",
    "limitations": ["Source contents are not verified"]
  },
  "warnings": ["Synthetic snapshot identifiers and dependency data"]
}
```

Run:

```sh
node dist/cli.js --input ./input.json --out ./report
```

A successful run prints `Report written to: <absolute output directory>` and creates:

```text
report/
  report.json     # Validated data, sorted files/edges, and summary counts
  summary.md      # Metadata, scope, counts, dependencies, source links, warnings
```

The example produces two files, one dependency edge, zero runtime edges, and one type-only edge. The dependency source link uses the supplied head SHA; the example's link is illustrative.

## Command behavior

| Option              | Required | Meaning                        |
| ------------------- | -------- | ------------------------------ |
| `--input <file>`    | Yes      | Path to the input JSON package |
| `--out <directory>` | Yes      | Path to the output directory   |

Paths are relative to the command's working directory or absolute. Quote paths containing spaces. Empty values, unknown options, and positional arguments are rejected. Repeated options use the last value. An installable command and `--help` are not implemented yet.

| Exit code | Meaning                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `0`       | Both report files were written successfully, including packages with partial scope or warnings                |
| `1`       | Argument parsing, input reading, JSON parsing, package validation, directory creation, or file writing failed |

Errors are printed to stderr as `Error: <message>`. A failed run does not print the success message.

The output directory is created with missing parents. Both files use UTF-8, and existing report files are overwritten. Writes are sequential: if writing Markdown fails, `report.json` may already exist. Use the exit code to determine whether the run succeeded. Repeating a successful command with unchanged input produces identical report contents.

## Development and checks

```sh
pnpm typecheck
pnpm test
pnpm format:check
```

`pnpm build` compiles `src/` into `dist/`. `pnpm test` builds the CLI before running Vitest, so process tests exercise the current command.

The suite has 76 tests, including eight actual CLI process scenarios: missing required arguments, successful JSON/Markdown output, malformed JSON, an unsupported schema version, a missing input file, Markdown write failure, repeated output and overwrite, and unknown options. Remaining tests cover input contracts, JSON reading, and report functions. Temporary directories are removed after each filesystem scenario. The CLI scenarios are verified on macOS; Windows behavior has not been verified.

## Modules

| Function         | Contract                                       | Purpose                                                              |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `parseCliArgs`   | `string[] → CliOptions`                        | Parses required input/output options and rejects invalid arguments   |
| `reportJson`     | `string → Promise<unknown>`                    | Reads JSON; propagates read and parse errors to the caller           |
| `checkInput`     | `unknown → InputPackage`                       | Validates structure, field values, IDs, and file references          |
| `createReport`   | `InputPackage → ReportData`                    | Sorts files and edges and adds counts                                |
| `renderMarkdown` | `ReportData → string`                          | Generates a summary with snapshots, edges, limitations, and warnings |
| `writeReport`    | `(string, ReportData, string) → Promise<void>` | Creates the output directory and writes both reports                 |
| `run`            | `string[] → Promise<0 \| 1>`                   | Orchestrates the command and reports its outcome                     |

Input format version `1` includes an HTTP(S) repository URL, two 40-character Git SHAs, files with relative paths using `/`, edges, analysis scope, and warnings. Type-only edges are counted separately. Markdown links use GitHub's `/blob/<head SHA>/<path>#L<line>` structure; the reporter does not support other hosts yet.

Package validation does not confirm that imports exist in the source, that tests of the analyzed project ran, or that task criteria were met. The tool does not execute scripts from an analyzed repository or commands from imported data.

## Project references

The complete V1 plan is in [PLAN.md](./PLAN.md), detailed diagrams are in [diagrams/README.md](./diagrams/README.md), and the current CLI specification is in [specs/001-review-prototype.md](./specs/001-review-prototype.md). Collaboration rules are in [AGENTS.md](./AGENTS.md).

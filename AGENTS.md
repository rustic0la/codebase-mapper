# Project rules

- Goal: a command-line tool for analyzing PRs and generating a report with a dependency map and evidence of an agent's work. Run locally and in GitHub Actions. The current task is described in `specs/001-review-prototype.md`.
- Keep all project files, documentation, descriptions, source comments, diagram labels, and test descriptions in English.
- Work with the user as a pair: explain one small step and its purpose, and let the user participate in decisions and code review. Do not automatically move from discussion to implementing an entire stage.
- Collaboration order: first discuss the files and folders for the current step; then define one function's purpose, input parameters and their types, result type, and error behavior. Describe the whole algorithm; the user writes the body independently and asks questions as needed. Provide a line-by-line explanation or a complete implementation on request. Do not automatically implement subsequent functions.
- The map is part of the generated HTML report. A separate React application is not required. Open source files and diffs in an external editor or GitHub.
- Implement tasks in small, verifiable steps. Keep contracts and graph functions independent of the CLI, reporters, and CI.
- Confirm edges against source code from a specific snapshot. Explicitly label incomplete graphs; account for type-only imports separately.
- The user selected https://github.com/react/react as the reference project. Its source uses Flow; do not treat TypeScript support as Flow support.
- Do not execute scripts from the analyzed repository. Do not execute commands from an imported report.
- Distinguish a check's outcome, provenance, and freshness for the snapshot. Never present demo checks as actually executed checks.
- For the CLI, verify real execution, exit codes, messages, and output files. For the HTML report, verify the scenario in a browser. Run `pnpm typecheck`, relevant tests, and `pnpm build` after adapting the commands to the CLI project.
- Do not change the expected reference just to make a check pass. Explain changes to contracts, fixtures, and checks in the report.
- Save screenshots and temporary copies of external repositories in `.context/`. Do not rename the branch, publish, or commit automatically.

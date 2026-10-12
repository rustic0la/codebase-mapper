# What to take from Self-Testing AI Agents

Notes for [PLAN.md](./PLAN.md), based on [Steve Kinney's workshop](https://stevekinney.com/courses/self-testing-ai-agents). Checked on October 6, 2026. Following the user's clarification, the product is a CLI for GitHub Actions with a generated report. UI references below refer to the future HTML reporter; a separate web application is not required.

## What the course provides

The course teaches how to equip a coding agent with automated checks and evidence for fixing failures. The example application uses SvelteKit, but the author also explains how to adapt the process to React/Next.js. The approach applies to our CLI as well: a reproduction command, expected and actual files, and an exit code. It does not replace checks on the truthfulness of AI explanations inside the future product: those belong to a separate task for future extensions.

## Priority chapters and our adaptation

| Read                                                                                                                                    | Course idea                                                                                                                                                                                                | Application to the codebase map                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Failure Dossiers](https://stevekinney.com/courses/self-testing-ai-agents/failure-dossiers-what-agents-actually-need-from-a-red-build)  | A failure should provide expected and actual results, a reproduction command, a screenshot, and a trace with DOM, console, and network data. A Markdown summary makes the package accessible to the agent. | For the parser, preserve a fixture, expected/actual JSON, and an edge diff. For the map, preserve a Playwright trace and the step where a folder failed to expand or the wrong file was selected.                           |
| [Making It Hard to Cheat the Guardrails](https://stevekinney.com/courses/self-testing-ai-agents/making-it-hard-to-cheat-the-guardrails) | Instructions and local hooks are supplemented by checks in clean CI; changes to the checks themselves also deserve review.                                                                                 | Highlight changes to fixtures, reference data, script commands, and CI in the report. CI repeats the checks rather than trusting the agent's declaration of local success.                                                  |
| [Structured CLI Output](https://stevekinney.com/courses/self-testing-ai-agents/structured-cli-output-as-pipeline-glue)                  | A versioned JSON schema lets scripts consume AI output. Confidence can guide routing; a fix must still be verified by a test.                                                                              | Preserve Markdown for the first tasks; introduce a JSON package at the proof-of-work stage: task, snapshot, commands, results, and artifacts. The schema checks the response's shape, rather than the truth of a diagnosis. |
| [The Whole Loop](https://stevekinney.com/courses/self-testing-ai-agents/capstone-the-whole-loop-end-to-end)                             | The agent runs checks, reads failure evidence, fixes the problem, and repeats. Missing hosted checks are explicitly identified.                                                                            | First test the whole loop locally on one small task. Add PR and CI integration after configuring the Git remote; list unexecuted checks in the report.                                                                      |
| [Review Portability](https://stevekinney.com/courses/self-testing-ai-agents/review-portability-beyond-bugbot)                           | Record the review run, rule source, handling of findings, and follow-up review. A recurring finding becomes a rule or test.                                                                                | The reviewer receives the spec, diff, and parser limitations. They check for invented edges, lost unresolved constructs, and reference data changes. CodeRabbit is optional.                                                |
| [Porting to Another Stack](https://stevekinney.com/courses/self-testing-ai-agents/porting-the-shelf-loop-to-another-stack)              | Transfer responsibilities: rules, reproducible state, checks, failure evidence, and CI.                                                                                                                    | Keep TypeScript, Vitest, and Playwright from the plan. Authentication and a test database are unnecessary at the local stage; fixed JSON already provides a known UI state.                                                 |

The right column contains our project decisions, rather than a ready-made architecture from the course.

## Additional chapters for the interface

The following adapts the course material to our map:

- [Deterministic State and Test Isolation](https://stevekinney.com/courses/self-testing-ai-agents/deterministic-state-and-test-isolation): run UI checks against fixed graph JSON; record the application commit, viewport, and selected file.
- [Visual Regression](https://stevekinney.com/courses/self-testing-ai-agents/visual-regression-as-a-feedback-loop): preserve three states: an expanded folder, a selected file, and the impact area. Update reference screenshots when the interface changes intentionally, explaining why.
- [Performance Budgets](https://stevekinney.com/courses/self-testing-ai-agents/performance-budgets-as-a-feedback-loop): measure bundle size, layout time, and interaction with a large map. Choose our own budgets from baseline measurements.
- [Playwright Test Agents](https://stevekinney.com/courses/self-testing-ai-agents/playwright-test-agents): the planner and generator help prepare scenarios; the healer needs oversight. According to the [official documentation](https://playwright.dev/docs/test-agents), its result can be passing or skipped when functionality is broken. For us, skipped means acceptance is unmet. Check setup commands against current official documentation; copying course commands without checking may yield an outdated setup.

## Minimal process for the first stages

1. **Before implementation:** record the scenario and expected results. For the parser, manually create a small edge reference; for the UI, define user actions.
2. **After a change:** the agent runs type checking, relevant Vitest tests, and the build. When the map changes, it runs a Playwright scenario covering folder expansion, file selection, and navigation to a dependency.
3. **On failure:** preserve a reproduction package in `artifacts/<run-id>/`, read it, fix the cause, rerun the failing check, and then run the remaining task checks. This is a proposed path; the commands still need to be created.
4. **Before handoff:** list results and changes to checks. A separate review pass looks for specification conflicts and risks. CI checks the current branch in a clean environment.
5. **Acceptance:** a person repeats the key scenario and assesses limitations. Automated success does not expand the product's promise: an import graph remains an import graph.

## Trial task for testing the process

Add literal `require` support to the parser. The reference contains a regular require call, a computed path, a missing file, and a file mixing require with ESM. The agent must show the newly resolved edge kind, reasons for unresolved constructs, and preservation of the previously expected ESM edges.

Our additional experiment: introduce a controlled implementation bug on a temporary branch and verify that the relevant test fails, a failure package is created, and the agent can reproduce and fix the cause. Do not delete or weaken expected behavior to obtain a passing result.

## What to defer

Add custom MCP tools for checks, AI triage in JSON, nightly runs, and multiple browsers when there is a specific need. For the start, a correct parser reference, one browser scenario, and accessible failure evidence matter more. Model behavior checks, invented-path metrics, and LangSmith remain a separate part of the plan.

## Proof of work protocol for the product

This is our extension of the process: check evidence becomes data in the review interface. It is not attributed to the course. Start with Markdown reports, then define a JSON schema and a package with relative paths to bundled artifacts. The package must be portable between local runs and demos without absolute paths from the author's machine.

| Package part    | What we preserve                                                                                           | What the interface shows                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Format and task | Schema version, task ID, description, acceptance criteria with stable IDs                                  | The expected outcome                                         |
| Snapshots       | Base and head snapshots, commit SHA when available, file manifest hash                                     | Which version the changes and results refer to               |
| Changes         | Added, deleted, and modified files, explicit renames, source snapshots                                     | What the agent changed; links to the graph and external diff |
| Checks          | Check and criterion IDs, command and project-relative cwd, start/end times, exit code, outcome, provenance | What ran, how it finished, and who reported the result       |
| Artifacts       | Logs, expected/actual JSON and diff, screenshots, Playwright trace; file paths, types, and hashes          | Evidence that can be opened or downloaded                    |
| Limitations     | Unexecuted checks, reasons for skipping, uncovered criteria, remaining findings                            | What needs additional checking                               |

Compute the snapshot hash from a sorted manifest of file paths and contents within an explicitly defined task scope; include new and modified uncommitted files. The scope includes source files, configuration, the lockfile, the specification being checked, and checks that the result depends on. A commit SHA without working-tree state is insufficient. Preserve the scope and exclusions with the manifest. Hashes confirm evidence consistency, rather than the author's honesty.

Keep three attributes separate in the interface: **check outcome**, **provenance**, and **freshness for the snapshot**. For example, “passed / declared by the agent / different snapshot” and “passed / rerun by a person / this snapshot” have different meanings. Do not mark an absent check as passing; skipped does not satisfy acceptance. A CI result must refer to a specific run and the analyzed snapshot; a `source: ci` field in uploaded JSON alone remains a declaration by the package's author.

Import validates the schema, attachment presence and hashes, snapshot matching, and permitted relative paths within the package. This checks package integrity. Independent confirmation of execution comes from rerunning a specific check on the same snapshot or verifying a record from a trusted source; assessing whether acceptance checks are meaningful remains a separate task.

Define the package and CLI reporter first. Then add adapters for results of checks already performed in our project and CI, including failures. Do not execute commands from imported reports or scripts from the analyzed repository. An existing, explicitly configured pipeline passes results to the report generator. GitHub Actions joins the main plan after local execution; the file contract lets the same command work in both places.

**Protocol acceptance:** show a real completed-task package; connect a criterion to a log and the corresponding changed file; identify a different snapshot, a missing artifact, and a damaged package. Successfully loading an agent report does not automatically confirm its results.

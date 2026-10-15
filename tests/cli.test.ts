// Runs the real CLI and verifies its behavior

import { describe, expect, test } from "vitest";
import { executeCli } from "./helpers/cli.js";
import { syntheticInput } from "./helpers/input.js";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReportData } from "../src/contracts/report.js";

describe("CLI", () => {
  test("returns exit code 1 when required arguments are missing", () => {
    const result = executeCli([], process.cwd());
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("Error: Missing required option: --input\n");
  });

  test("writes JSON and Markdown reports for valid input", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const input = syntheticInput();
      input.scope.description = "UTF-8 café check";
      await writeFile(join(tempDir, "input.json"), JSON.stringify(input));
      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "input.json", "--out", "nested/report folder"],
        tempDir,
      );
      expect(exitCode).toBe(0);

      const outputDir = join(
        await realpath(tempDir),
        "nested",
        "report folder",
      );
      expect(stdout).toBe(`Report written to: ${outputDir}\n`);
      expect(stderr).toBe("");

      const report = await readFile(join(outputDir, "report.json"), {
        encoding: "utf8",
      });
      const {
        scope,
        edges,
        files,
        warnings,
        head,
        base,
        repository,
        summary: reportSummary,
      }: ReportData = JSON.parse(report);

      expect(scope).toEqual(input.scope);
      expect(files.map(({ id }) => id)).toEqual([
        "a-entry",
        "z-entry",
        "types",
      ]);

      expect(edges.map(({ id }) => id)).toEqual(["a-type", "z-runtime"]);
      expect([base, head, repository, warnings]).toEqual([
        input.base,
        input.head,
        input.repository,
        input.warnings,
      ]);

      expect(reportSummary).toEqual({
        fileCount: 3,
        edgeCount: 2,
        runtimeEdgeCount: 1,
        typeOnlyEdgeCount: 1,
      });

      const summary = await readFile(join(outputDir, "summary.md"), {
        encoding: "utf8",
      });

      expect(summary).toContain(input.scope.description);
      expect(summary).toContain("First warning");
      expect(summary).toContain(
        "FileCount: 3 | EdgeCount: 2 | RuntimeEdgeCount: 1 | TypeOnlyEdgeCount: 1",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("rejects malformed JSON without creating a report", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      await writeFile(join(tempDir, "input.json"), '{"schemaVersion":', "utf8");

      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "input.json", "--out", "nested/report folder"],
        tempDir,
      );

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("JSON");

      await expect(
        access(join(tempDir, "nested", "report folder")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("rejects an unsupported schema version without creating a report", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const input = { ...syntheticInput(), schemaVersion: 99 };
      await writeFile(
        join(tempDir, "input.json"),
        JSON.stringify(input),
        "utf8",
      );

      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "input.json", "--out", "nested/report folder"],
        tempDir,
      );

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("Error: schemaVersion: version 1 is expected\n");

      await expect(
        access(join(tempDir, "nested", "report folder")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("reports a missing input file without creating a report", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "missing.json", "--out", "nested/report folder"],
        tempDir,
      );

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("ENOENT");
      expect(stderr).toContain("missing.json");

      await expect(
        access(join(tempDir, "nested", "report folder")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns exit code 1 when writing the Markdown report fails", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const input = syntheticInput();
      await writeFile(
        join(tempDir, "input.json"),
        JSON.stringify(input),
        "utf8",
      );

      await mkdir(join(tempDir, "report", "summary.md"), {
        recursive: true,
      });
      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "input.json", "--out", "report"],
        tempDir,
      );

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("EISDIR");
      expect(stderr).toContain("summary.md");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("produces identical reports on repeated runs", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const input = syntheticInput();
      await writeFile(
        join(tempDir, "input.json"),
        JSON.stringify(input),
        "utf8",
      );
      const outputDir = join(await realpath(tempDir), "report");

      const {
        exitCode: exitCode1,
        stderr: stderr1,
        stdout: stdout1,
      } = executeCli(["--input", "input.json", "--out", "report"], tempDir);

      expect(exitCode1).toBe(0);
      expect(stdout1).toBe(`Report written to: ${outputDir}\n`);
      expect(stderr1).toBe("");

      const report1 = await readFile(join(outputDir, "report.json"), {
        encoding: "utf8",
      });
      await writeFile(
        join(outputDir, "report.json"),
        `${report1} stale output`,
      );

      const summary1 = await readFile(join(outputDir, "summary.md"), {
        encoding: "utf8",
      });
      await writeFile(
        join(outputDir, "summary.md"),
        `${summary1} stale output`,
      );

      const {
        exitCode: exitCode2,
        stderr: stderr2,
        stdout: stdout2,
      } = executeCli(["--input", "input.json", "--out", "report"], tempDir);

      expect(exitCode2).toBe(0);
      expect(stdout2).toBe(`Report written to: ${outputDir}\n`);
      expect(stderr2).toBe("");

      const report2 = await readFile(join(outputDir, "report.json"), {
        encoding: "utf8",
      });
      expect(report1).toBe(report2);

      const summary2 = await readFile(join(outputDir, "summary.md"), {
        encoding: "utf8",
      });
      expect(summary1).toBe(summary2);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("rejects unknown options without creating a report", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "codebase-mapper-cli-"));
    try {
      const { exitCode, stderr, stdout } = executeCli(
        ["--input", "input.json", "--out", "report", "--unknown"],
        tempDir,
      );

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("Unknown option");
      expect(stderr).toContain("--unknown");

      await expect(access(join(tempDir, "report"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

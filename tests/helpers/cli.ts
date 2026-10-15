import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

export type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export function executeCli(argv: string[], cwd: string): CliResult {
  const absolutePath = resolve("dist/cli.js");

  const { status, stderr, stdout, error } = spawnSync(
    process.execPath,
    [absolutePath, ...argv],
    { cwd, timeout: 10_000, encoding: "utf8" },
  );

  if (error) throw error;
  if (status === null) throw new Error("CLI process did not exit normally");

  return { exitCode: status, stderr, stdout };
}

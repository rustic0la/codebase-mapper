import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { reportJson } from "../../src/io/read-json.js";

it("reads UTF-8 JSON and propagates malformed or missing file errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "codebase-mapper-json-"));
  try {
    const input = { message: "UTF-8 café check" };
    const validPath = join(directory, "input.json");
    await writeFile(validPath, JSON.stringify(input), "utf8");
    const parsed = await reportJson(validPath);
    expect(parsed).toEqual(input);

    // Reading accepts any valid JSON; structure validation belongs to checkInput.
    await writeFile(validPath, "42", "utf8");
    expect(await reportJson(validPath)).toBe(42);

    const invalidPath = join(directory, "invalid.json");
    await writeFile(invalidPath, '{"unfinished":', "utf8");
    await expect(reportJson(invalidPath)).rejects.toBeInstanceOf(SyntaxError);
    await expect(
      reportJson(join(directory, "missing.json")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

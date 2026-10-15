import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { checkInput } from "../../src/contracts/input.js";
import { reportJson } from "../../src/io/read-json.js";
import { createReport } from "../../src/report/create-report.js";
import { renderMarkdown } from "../../src/report/render-markdown.js";
import { syntheticInput } from "../helpers/input.js";

// Value: protects=real UTF-8 JSON reading and failure propagation through the report module flow;
// fails_when=reading returns text, swallows I/O or syntax errors, or breaks module composition;
// why_new=no existing test reads disk or composes the implemented modules; seam=none
it("reads UTF-8 JSON into the report flow and propagates malformed or missing file errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "codebase-mapper-json-"));
  try {
    const input = syntheticInput();
    input.scope.description = "UTF-8 café check";
    const validPath = join(directory, "input.json");
    await writeFile(validPath, JSON.stringify(input), "utf8");
    const parsed = await reportJson(validPath);
    expect(parsed).toEqual(input);
    const markdown = renderMarkdown(createReport(checkInput(parsed)));
    expect(markdown).toContain("UTF-8 café check");
    expect(markdown).toContain("RuntimeEdgeCount: 1 | TypeOnlyEdgeCount: 1");

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

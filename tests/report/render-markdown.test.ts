import { describe, expect, it } from "vitest";
import { createReport } from "../../src/report/create-report.js";
import { renderMarkdown } from "../../src/report/render-markdown.js";
import { syntheticInput } from "../helpers/input.js";

describe("renderMarkdown", () => {
  // Value: protects=readable source-attributed Markdown with honest scope and dependency kinds;
  // fails_when=paths resolve by path instead of ID, links use the wrong SHA or lists coerce to commas;
  // why_new=no persistent test covers Markdown output or source URL encoding; seam=none
  it("renders file paths, source links, classifications and separate limitation and warning lists", () => {
    const report = createReport(syntheticInput());
    const before = structuredClone(report);
    const markdown = renderMarkdown(report);

    expect(markdown).toContain(
      `${report.repository} | ${report.base.commitSha} | ${report.head.commitSha}`,
    );
    expect(markdown).toContain(`${report.scope.description} | partial`);
    expect(markdown).toContain(
      "FileCount: 3 | EdgeCount: 2 | RuntimeEdgeCount: 1 | TypeOnlyEdgeCount: 1",
    );
    expect(markdown).toContain(
      "## Files:\n\n- src/main \\#1.js\n- src/main \\#1.js\n- src/types.js",
    );
    expect(markdown).toContain("From: src/main \\#1.js | To: src/types.js");
    expect(markdown).toContain("Kind: re-export | Type: type-only");
    expect(markdown).toContain("Kind: import | Type: runtime");
    const sourcePrefix = `https://github.com/example/repository/blob/${report.head.commitSha}/src/main%20%231.js`;
    expect(markdown).toContain(`[Source: line 3](${sourcePrefix}#L3)`);
    expect(markdown).toContain(`[Source: line 12](${sourcePrefix}#L12)`);
    expect(markdown).toContain(
      "## Limitations:\n\n- Source contents are not verified\n- Selected files only",
    );
    expect(markdown).toContain(
      "## Warnings:\n\n- First warning\n- Second warning",
    );
    expect(markdown).not.toContain("[object Object]");
    expect(markdown).not.toContain("undefined");
    expect(report).toEqual(before);
  });

  // Value: protects=explicit empty output and errors instead of links to nonexistent files;
  // fails_when=empty arrays leave ambiguous output or dangling endpoints print undefined;
  // why_new=the populated valid fixture cannot exercise fallbacks or endpoint guards; seam=none
  it("handles empty results and rejects missing source or target files", () => {
    const emptyInput = syntheticInput();
    emptyInput.files = [];
    emptyInput.edges = [];
    emptyInput.scope.limitations = [];
    emptyInput.warnings = [];
    const markdown = renderMarkdown(createReport(emptyInput));
    expect(markdown).toContain("## Dependencies:\n\nNo edges in package");
    expect(markdown).toContain("## Warnings:\n\nNo warnings");
    expect(markdown).toContain("FileCount: 0 | EdgeCount: 0");

    for (const endpoint of ["from", "to"] as const) {
      const report = createReport(syntheticInput());
      report.edges[0][endpoint] = `missing-${endpoint}`;
      expect(() => renderMarkdown(report)).toThrow(
        `No file: missing-${endpoint}`,
      );
    }
  });

  // Value: protects=source references and reporter-owned structure with imported text;
  // fails_when=URL query/hash survives in blob links or field Markdown creates report headings;
  // why_new=ordinary paths and single-line prose cannot expose these boundary defects; seam=none
  it("canonicalizes source URLs and renders imported Markdown as literal text", () => {
    const input = syntheticInput();
    input.repository =
      "https://github.com/example/repository/?tab=readme#about";
    input.files[0].path = "src/a)b.js";
    input.files[1].path = "src/a)b.js";
    input.scope.description = "Description\n## New section";
    input.scope.limitations = [
      "Known limitation\n\n## Warnings:\n\nNo warnings",
    ];
    input.warnings = ["[link](file) <tag> **bold** `code` &copy;"];
    const report = createReport(input);
    const markdown = renderMarkdown(report);

    expect(markdown).toContain(
      `[Source: line 12](https://github.com/example/repository/blob/${report.head.commitSha}/src/a%29b.js#L12)`,
    );
    expect(markdown).toContain("Description \\#\\# New section | partial");
    expect(markdown).toContain(
      "- Known limitation \\#\\# Warnings: No warnings",
    );
    expect(markdown.match(/^## Warnings:/gm)).toHaveLength(1);
    expect(markdown).toContain(
      "- \\[link\\](file) \\<tag\\> \\*\\*bold\\*\\* \\`code\\` \\&copy;",
    );
  });
});

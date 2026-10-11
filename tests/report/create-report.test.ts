import { describe, expect, it } from "vitest";
import { createReport } from "../../src/report/create-report.js";
import { syntheticInput } from "../helpers/input.js";

describe("createReport", () => {
  // Value: protects=stable ordering, type-only counts, metadata preservation and unmodified inputs;
  // fails_when=sorting ignores the ID tie-break, mutates inputs or counts type-only edges as runtime;
  // why_new=input validation tests do not exercise report generation; seam=none
  it("sorts copies, counts both dependency kinds and retains the input metadata", () => {
    const input = syntheticInput();
    const before = structuredClone(input);
    const result = createReport(input);

    expect(result.files.map(({ id }) => id)).toEqual([
      "a-entry",
      "z-entry",
      "types",
    ]);
    expect(result.edges.map(({ id }) => id)).toEqual(["a-type", "z-runtime"]);
    expect(result.summary).toEqual({
      fileCount: 3,
      edgeCount: 2,
      runtimeEdgeCount: 1,
      typeOnlyEdgeCount: 1,
    });
    expect(result).toMatchObject({
      schemaVersion: input.schemaVersion,
      repository: input.repository,
      base: input.base,
      head: input.head,
      scope: input.scope,
      warnings: input.warnings,
    });
    expect(input).toEqual(before);
    expect(result.files).not.toBe(input.files);
    expect(result.edges).not.toBe(input.edges);
    expect(createReport(input)).toEqual(result);
  });

  // Value: protects=zero counts for an empty selected dependency graph;
  // fails_when=the report assumes at least one file or emits nonzero empty counts;
  // why_new=the mixed dependency fixture cannot catch empty-collection mistakes; seam=none
  it("returns zero statistics for empty file and edge collections", () => {
    const input = syntheticInput();
    input.files = [];
    input.edges = [];
    const result = createReport(input);
    expect(result.files).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.summary).toEqual({
      fileCount: 0,
      edgeCount: 0,
      runtimeEdgeCount: 0,
      typeOnlyEdgeCount: 0,
    });
  });
});

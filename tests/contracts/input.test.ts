import { describe, expect, it } from "vitest";
import { checkInput, type InputPackage } from "../../src/contracts/input.js";

// Synthetic data checks the contract, not dependencies in a real repository.
function validInput(): InputPackage {
  return {
    schemaVersion: 1,
    repository: "https://example.com/team/repository",
    base: { commitSha: "a".repeat(40) },
    head: { commitSha: "b".repeat(40) },
    files: [
      { id: "main", path: "src/main.js" },
      { id: "types", path: "src/types.js" },
    ],
    edges: [
      {
        id: "main-types",
        from: "main",
        to: "types",
        kind: "import",
        typeOnly: true,
        specifier: "./types",
        sourceLine: 2,
      },
    ],
    scope: {
      completeness: "partial",
      description: "Synthetic input-validation fixture",
      limitations: ["Source contents are not verified"],
    },
    warnings: [],
  };
}

function withValue(path: string, value: unknown): unknown {
  const input: Record<string, unknown> = validInput();
  const parts = path.split(".");
  let parent = input;
  for (const part of parts.slice(0, -1)) {
    parent = parent[part] as Record<string, unknown>;
  }
  parent[parts[parts.length - 1]] = value;
  return input;
}

describe("checkInput", () => {
  it("returns the validated package without changing the input", () => {
    const input = validInput();
    const before = structuredClone(input);
    expect(checkInput(input)).toEqual(before);
    expect(input).toEqual(before);
  });

  it("accepts re-exports, runtime edges and complete scope metadata", () => {
    const input = validInput();
    input.edges[0].kind = "re-export";
    input.edges[0].typeOnly = false;
    input.scope.completeness = "complete";
    input.scope.limitations = [];
    expect(checkInput(input)).toEqual(input);
  });

  it("accepts empty file and edge lists", () => {
    const input = validInput();
    input.files = [];
    input.edges = [];
    expect(checkInput(input)).toEqual(input);
  });

  it.each([null, undefined, [], "input", 42, false])(
    "rejects a non-object input: %j",
    (input) => {
      expect(() => checkInput(input)).toThrow("input:");
    },
  );

  it.each(Object.keys(validInput()))("requires the %s field", (field) => {
    const input: Record<string, unknown> = validInput();
    delete input[field];
    expect(() => checkInput(input)).toThrow(`${field}:`);
  });

  const invalidValues: [string, unknown, string][] = [
    ["schemaVersion", "1", "schemaVersion:"],
    ["schemaVersion", 2, "schemaVersion:"],
    ["repository", 42, "repository:"],
    ["repository", " ", "repository:"],
    ["repository", "not-a-url", "repository:"],
    ["repository", "file:///tmp/repository", "repository:"],
    ["base", null, "base:"],
    ["head", [], "head:"],
    ["base.commitSha", undefined, "base.commitSha:"],
    ["head.commitSha", 42, "head.commitSha:"],
    ["head.commitSha", "abc123", "head.commitSha:"],
    ["head.commitSha", "g".repeat(40), "head.commitSha:"],
    ["head.commitSha", "b".repeat(41), "head.commitSha:"],
    ["files", {}, "files:"],
    ["files.0", null, "files[0]:"],
    ["files.0.id", undefined, "files[0].id:"],
    ["files.0.id", " ", "files[0].id:"],
    ["files.0.path", false, "files[0].path:"],
    ["files.0.path", "", "files[0].path:"],
    ["edges", "edges", "edges:"],
    ["edges.0", [], "edges[0]:"],
    ["edges.0.id", undefined, "edges[0].id:"],
    ["edges.0.from", 1, "edges[0].from:"],
    ["edges.0.to", " ", "edges[0].to:"],
    ["edges.0.specifier", undefined, "edges[0].specifier:"],
    ["edges.0.kind", "require", "edges[0].kind:"],
    ["edges.0.typeOnly", "true", "edges[0].typeOnly:"],
    ["edges.0.sourceLine", "2", "edges[0].sourceLine:"],
    ["edges.0.sourceLine", 0, "edges[0].sourceLine:"],
    ["edges.0.sourceLine", -1, "edges[0].sourceLine:"],
    ["edges.0.sourceLine", 1.5, "edges[0].sourceLine:"],
    ["edges.0.sourceLine", Infinity, "edges[0].sourceLine:"],
    ["edges.0.sourceLine", Number.MAX_SAFE_INTEGER + 1, "edges[0].sourceLine:"],
    ["scope", null, "scope:"],
    ["scope.completeness", "unknown", "scope.completeness:"],
    ["scope.description", " ", "scope.description:"],
    ["scope.limitations", "partial", "scope.limitations:"],
    ["scope.limitations", ["partial", 42], "scope.limitations[1]:"],
    ["warnings", null, "warnings:"],
    ["warnings", [false], "warnings[0]:"],
  ];

  it.each(invalidValues)("rejects invalid %s = %j", (path, value, message) => {
    expect(() => checkInput(withValue(path, value))).toThrow(message);
  });

  it.each([
    "/src/main.js",
    "../main.js",
    "src/../main.js",
    "C:/src/main.js",
    "C:\\src\\main.js",
    "src\\main.js",
    "src/main\0.js",
    ".",
  ])("rejects an invalid repository path: %j", (path) => {
    expect(() => checkInput(withValue("files.0.path", path))).toThrow(
      "files[0].path:",
    );
  });

  it("rejects duplicate file IDs", () => {
    const input = validInput();
    input.files.push({ id: "main", path: "src/other.js" });
    expect(() => checkInput(input)).toThrow(
      'files[2].id: duplicate file ID "main"',
    );
  });

  it("rejects duplicate edge IDs", () => {
    const input = validInput();
    input.edges.push({ ...input.edges[0] });
    expect(() => checkInput(input)).toThrow(
      'edges[1].id: duplicate edge ID "main-types"',
    );
  });

  it.each(["from", "to"] as const)(
    "rejects a dangling %s reference",
    (field) => {
      expect(() =>
        checkInput(withValue(`edges.0.${field}`, "missing")),
      ).toThrow(`edges[0].${field}: file ID "missing" is not in files`);
    },
  );

  it.each(["files", "edges", "warnings", "scope.limitations"])(
    "rejects a sparse %s array",
    (field) => {
      expect(() => checkInput(withValue(field, new Array(1)))).toThrow();
    },
  );
});

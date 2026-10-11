import type { InputPackage } from "../../src/contracts/input.js";

// Synthetic dependencies exercise report contracts, not real React source facts.
export function syntheticInput(): InputPackage {
  return {
    schemaVersion: 1,
    repository: "https://github.com/example/repository/",
    base: { commitSha: "a".repeat(40) },
    head: { commitSha: "b".repeat(40) },
    files: [
      { id: "types", path: "src/types.js" },
      { id: "z-entry", path: "src/main #1.js" },
      { id: "a-entry", path: "src/main #1.js" },
    ],
    edges: [
      {
        id: "z-runtime",
        from: "z-entry",
        to: "types",
        kind: "import",
        typeOnly: false,
        specifier: "./types",
        sourceLine: 12,
      },
      {
        id: "a-type",
        from: "a-entry",
        to: "types",
        kind: "re-export",
        typeOnly: true,
        specifier: "./types",
        sourceLine: 3,
      },
    ],
    scope: {
      completeness: "partial",
      description: "Synthetic fixture for report generation",
      limitations: ["Source contents are not verified", "Selected files only"],
    },
    warnings: ["First warning", "Second warning"],
  };
}

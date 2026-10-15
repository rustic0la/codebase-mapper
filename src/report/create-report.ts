// Converts validated input into report data

import type { InputPackage } from "../contracts/input.js";
import type { ReportData } from "../contracts/report.js";

export function createReport(input: InputPackage): ReportData {
  const inputCopy = { ...input };
  const filesCopy = [...input.files].sort(
    (a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id),
  );

  const edgesCopy = [...input.edges].sort((a, b) => a.id.localeCompare(b.id));

  const fileCount = filesCopy.length;
  const edgeCount = edgesCopy.length;
  const runtimeEdgeCount = edgesCopy.filter(({ typeOnly }) => !typeOnly).length;
  const typeOnlyEdgeCount = edgesCopy.filter(
    ({ typeOnly }) => !!typeOnly,
  ).length;

  return {
    ...inputCopy,
    files: filesCopy,
    edges: edgesCopy,
    summary: { fileCount, edgeCount, runtimeEdgeCount, typeOnlyEdgeCount },
  };
}

// Превращает данные отчёта в текст сводки

import type { ReportData } from "../contracts/report.js";

export function renderMarkdown(report: ReportData): string {
  const {
    repository,
    base,
    head,
    scope,
    summary: { fileCount, edgeCount, runtimeEdgeCount, typeOnlyEdgeCount },
    files,
    edges,
    warnings,
  } = report;

  const repoUrl = new URL(repository);
  repoUrl.search = "";
  repoUrl.hash = "";

  const mainData = `${literalMarkdown(repository)} | ${base.commitSha} | ${head.commitSha}`;

  const scopeData = `${literalMarkdown(scope.description)} | ${scope.completeness}\n\n## Limitations:\n\n${scope.limitations.map((l) => `- ${literalMarkdown(l)}`).join("\n")}`;

  const filesData = `## Files:\n\n${files.map(({ path }) => `- ${literalMarkdown(path)}`).join("\n")}`;

  const edgesData = `## Dependencies:\n\n${
    edges.length
      ? edges
          .map(({ from, to, kind, sourceLine, typeOnly }) => {
            const fileFrom = files.find(({ id }) => id === from);
            if (!fileFrom) throw new Error(`No file: ${from}`);

            const fileTo = files.find(({ id }) => id === to);
            if (!fileTo) throw new Error(`No file: ${to}`);

            const filePath = fileFrom.path
              .split("/")
              .map(encodeURIComponent)
              .join("/");

            const sourceUrl = new URL(repoUrl);
            sourceUrl.pathname = `${repoUrl.pathname.replace(/\/+$/, "")}/blob/${head.commitSha}/${filePath}`;
            sourceUrl.hash = `L${sourceLine}`;
            const sourceLink = sourceUrl.href.replace(/[()]/g, (char) =>
              char === "(" ? "%28" : "%29",
            );

            return `From: ${literalMarkdown(fileFrom.path)} | To: ${literalMarkdown(fileTo.path)}\nKind: ${kind} | Type: ${typeOnly ? "type-only" : "runtime"}\n[Source: line ${sourceLine}](${sourceLink})`;
          })
          .join("\n\n")
      : "No edges in package"
  }`;

  const summaryCounts = `FileCount: ${fileCount} | EdgeCount: ${edgeCount} | RuntimeEdgeCount: ${runtimeEdgeCount} | TypeOnlyEdgeCount: ${typeOnlyEdgeCount}`;

  const warningsData = `## Warnings:\n\n${
    warnings.length
      ? `${warnings.map((w) => `- ${literalMarkdown(w)}`).join("\n")}`
      : "No warnings"
  }`;

  return [
    mainData,
    scopeData,
    summaryCounts,
    filesData,
    edgesData,
    warningsData,
  ].join("\n\n");
}

// Imported values are literal text, not report-authored Markdown structure.
function literalMarkdown(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/[\\`*_\[\]<>#&]/g, "\\$&");
}

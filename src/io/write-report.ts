// Writes JSON and Markdown to disk

import type { ReportData } from "../contracts/report.js";
import { join, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export async function writeReport(
  outputDir: string,
  report: ReportData,
  markdown: string,
): Promise<void> {
  const absolutePath = resolve(outputDir);
  await mkdir(absolutePath, { recursive: true });
  const reportPath = join(absolutePath, "report.json");
  const summaryPath = join(absolutePath, "summary.md");
  const json = JSON.stringify(report, null, 2);
  await writeFile(reportPath, json, "utf8");
  await writeFile(summaryPath, markdown, "utf8");
}

// Описывает структуру итогового отчёта
import type { InputPackage } from "./input.js";

export type ReportSummary = {
  fileCount: number;
  edgeCount: number;
  runtimeEdgeCount: number;
  typeOnlyEdgeCount: number;
};

export type ReportData = InputPackage & {
  summary: ReportSummary;
};

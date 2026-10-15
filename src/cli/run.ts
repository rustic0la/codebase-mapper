import { parseCliArgs } from "./args.js";
import { reportJson } from "../io/read-json.js";
import { checkInput } from "../contracts/input.js";
import { createReport } from "../report/create-report.js";
import { renderMarkdown } from "../report/render-markdown.js";
import { writeReport } from "../io/write-report.js";
import { resolve } from "node:path";

export async function run(argv: string[]): Promise<0 | 1> {
  try {
    const { inputPath, outputDir } = parseCliArgs(argv);
    const json = await reportJson(inputPath);
    const pkg = checkInput(json);
    const report = createReport(pkg);
    const markdown = renderMarkdown(report);
    await writeReport(outputDir, report, markdown);

    console.info(`Report written to: ${resolve(outputDir)}`);
    return 0;
  } catch (e) {
    console.error("Error: " + (e instanceof Error ? e.message : String(e)));
    return 1;
  }
}

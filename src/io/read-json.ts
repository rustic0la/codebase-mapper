// Читает файл и разбирает JSON
import { readFile } from "node:fs/promises";

export function reportJson(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, "utf8");
}

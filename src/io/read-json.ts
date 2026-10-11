// Читает файл и разбирает JSON
import { readFile } from "node:fs/promises";

export async function reportJson(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

import { parseArgs } from "node:util";

export type CliOptions = {
  inputPath: string;
  outputDir: string;
};

// node dist/cli.js --input ./input.json --out ./report

export function parseCliArgs(argv: string[]): CliOptions {
  const options = {
    input: {
      type: "string",
    },
    out: {
      type: "string",
    },
  } as const;

  const { values } = parseArgs({
    args: argv,
    options,
    strict: true,
    allowPositionals: false,
  });

  if (!values.input?.trim()) {
    throw new Error("Missing required option: --input");
  }

  if (!values.out?.trim()) {
    throw new Error("Missing required option: --out");
  }

  return { inputPath: values.input, outputDir: values.out };
}

// Reads arguments, calls the other functions, and reports the run result

import { run } from "./cli/run.js";

const code = await run(process.argv.slice(2));

process.exitCode = code;

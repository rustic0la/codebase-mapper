import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/{contracts,io,report}/**/*.test.ts", "tests/cli.test.ts"],
  },
});

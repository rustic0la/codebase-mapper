import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // CLI tests are still a placeholder; enable them when implemented.
    include: ["tests/{contracts,io,report}/**/*.test.ts"],
  },
});

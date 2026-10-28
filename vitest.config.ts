import { defineConfig } from "vitest/config";

// Standalone config: the app's vite.config.ts loads Qwik plugins that tests don't need.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

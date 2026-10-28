import { qwikVite } from "@builder.io/qwik/optimizer";
import { defineConfig } from "vitest/config";

// Standalone config: only the Qwik optimizer (needed to compile component$ for
// component tests), without the app's qwikCity/tailwind/tsconfig plugins.
export default defineConfig({
  plugins: [qwikVite()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

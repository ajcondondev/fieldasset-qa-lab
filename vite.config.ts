/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base + hash routing = the build runs on any static host,
  // including GitHub Pages project sites, with no path configuration.
  base: "./",
  plugins: [react()],
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});

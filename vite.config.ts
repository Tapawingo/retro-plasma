import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/retroPlasma.ts",
      name: "DitheredPlasmaBackground",
      fileName: (format) =>
        format === "es"
          ? "retroPlasma.js"
          : `retroPlasma.${format}.js`,
      formats: ["es", "umd"]
    }
  }
});

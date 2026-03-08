import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@cartridge/controller"],
  },
  build: {
    target: "esnext",
  },
});

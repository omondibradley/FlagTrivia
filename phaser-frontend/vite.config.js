import { defineConfig } from "vite";

// itch.io serves assets from a different CDN domain (img.itch.zone), so the
// `crossorigin` attribute Vite adds to module scripts triggers a CORS failure.
// This plugin strips it from the built HTML.
const removecrossorigin = {
  name: "remove-crossorigin",
  transformIndexHtml: (html) => html.replace(/ crossorigin/g, ""),
};

export default defineConfig({
  base: "./",
  plugins: [removecrossorigin],
  optimizeDeps: {
    exclude: ["@cartridge/controller"],
  },
  build: {
    target: "esnext",
  },
});

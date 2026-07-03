import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import electron from "vite-plugin-electron/simple";
import path from "path";

// Main = ESM (.mjs) — Electron 43 supports an ESM entrypoint.
const emitMjs = (name: string) => ({
  build: {
    rollupOptions: { output: { entryFileNames: `${name}.mjs` } },
  },
});

// Preload = CommonJS (.cjs) — a sandboxed preload (sandbox:true) cannot be ESM.
const emitCjs = (name: string, entry: string) => ({
  build: {
    lib: { entry, formats: ["cjs" as const] },
    rollupOptions: { output: { entryFileNames: `${name}.cjs` } },
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Desktop (Electron) build/dev is selected with `--mode desktop`.
  const isDesktop = mode === "desktop";

  return {
    // Electron loads assets over file:// → relative paths; web stays absolute.
    base: isDesktop ? "./" : "/",
    // Compile-time flag: literal `false` on web, so desktop-only branches are
    // dead-code-eliminated. NOTE: vitest inherits this define too — if a standalone
    // vitest.config.ts is ever added, it must re-declare __DESKTOP__ or tests throw.
    define: {
      __DESKTOP__: JSON.stringify(isDesktop),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      isDesktop &&
        electron({
          main: { entry: "electron/main.ts", vite: emitMjs("main") },
          preload: {
            input: "electron/preload.ts",
            vite: emitCjs("preload", "electron/preload.ts"),
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

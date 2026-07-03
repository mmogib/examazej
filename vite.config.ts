import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Desktop (Electron) build is selected via BUILD_TARGET=desktop.
  const isDesktop = process.env.BUILD_TARGET === "desktop";
  return {
    // Electron loads assets over file:// → use relative paths; web stays absolute.
    base: isDesktop ? "./" : "/",
    // Compile-time flag; resolves to a literal and is tree-shaken out of the web bundle.
    define: {
      __DESKTOP__: JSON.stringify(isDesktop),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

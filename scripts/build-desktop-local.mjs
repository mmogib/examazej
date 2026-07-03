// Local desktop build for THIS machine (owner). Cross-shell (run from zsh, PowerShell,
// cmd — it's plain Node). Outputs the installer to D: because C: is space-tight, routes
// electron-builder temp + caches to D:, and trusts the university proxy CA.
//
//   npm run electron:build:local
//
// NOTE: CI (Phase 5, windows-latest) does NOT use this — it runs electron-builder directly
// and writes to the default `release/` (from electron-builder.yml) on the runner.
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = "D:\\examazej-release";

const env = {
  ...process.env,
  NODE_OPTIONS: "--use-system-ca",      // proxy CA for registry + electron/nsis downloads
  TEMP: "D:\\eb-tmp",
  TMP: "D:\\eb-tmp",
  ELECTRON_BUILDER_CACHE: "D:\\eb-cache",
  ELECTRON_CACHE: "D:\\electron-cache",
};
for (const d of ["D:\\eb-tmp", "D:\\eb-cache", "D:\\electron-cache"]) {
  mkdirSync(d, { recursive: true });
}

const run = (cmd) => execSync(cmd, { cwd: root, env, stdio: "inherit", shell: true });
console.log("==> vite build --mode desktop");
run("npx vite build --mode desktop");
console.log(`==> electron-builder (output: ${out})`);
run(`npx electron-builder --config.directories.output="${out}"`);
console.log(`Done. Installer + win-unpacked -> ${out}`);

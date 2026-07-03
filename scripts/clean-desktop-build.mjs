// Remove local desktop BUILD OUTPUT (regenerable; once a release is pushed it's on GitHub
// Releases, so the local copy is disposable). Keeps download caches (D:\eb-cache,
// D:\electron-cache) so the next build stays fast. Cross-shell — plain Node.
//
//   npm run electron:clean
import { rmSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  join(root, "dist"),
  join(root, "dist-electron"),
  join(root, "release"), // in case a build ever wrote output on C: by mistake
  "D:\\examazej-release",
  "D:\\eb-tmp",
];
for (const p of targets) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log("removed " + p);
  }
}
console.log("Build output cleared. Caches kept (D:\\eb-cache, D:\\electron-cache) for fast rebuilds.");

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureSystemCa } from "./npm-audit.mjs";
import { getNpmEnvironment, getNpmInvocation } from "./npm-command.mjs";

/**
 * The npm that installs dependencies in CI (.github/workflows/desktop-release.yml runs
 * `npx --yes <CI_NPM_SPEC> ci`). Keep the two in step; a test checks the workflow.
 */
export const CI_NPM_SPEC = "npm@11";

const FILES = ["package.json", "package-lock.json", ".npmrc"];

/**
 * Proves `npm ci` accepts package.json + package-lock.json with the npm CI uses, before any
 * release state changes. Runs a dry run in a temporary copy, so node_modules is never touched.
 * (v1.8.0's installer build failed because CI's npm rejected a lock file the local npm accepted.)
 */
export function runLockfileCheck({
  root = process.cwd(),
  env = process.env,
  execPath = process.execPath,
  platform = process.platform,
  spawn = spawnSync,
  makeTempDir = () => mkdtempSync(join(tmpdir(), "examazej-lockfile-")),
} = {}) {
  const dir = makeTempDir();
  try {
    for (const file of FILES) {
      if (existsSync(join(root, file))) copyFileSync(join(root, file), join(dir, file));
    }
    const npm = getNpmInvocation({ env, execPath, platform });
    const childEnv = getNpmEnvironment(env);
    const result = spawn(
      npm.command,
      [...npm.argsPrefix, "exec", "--yes", `--package=${CI_NPM_SPEC}`, "--",
        "npm", "ci", "--dry-run", "--ignore-scripts"],
      {
        cwd: dir,
        env: { ...childEnv, NODE_OPTIONS: ensureSystemCa(env.NODE_OPTIONS) },
        shell: false,
        stdio: "inherit",
      },
    );
    return result.status ?? 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  process.exitCode = runLockfileCheck();
}

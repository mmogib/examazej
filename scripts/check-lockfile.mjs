import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureSystemCa } from "./npm-audit.mjs";
import { getNpmEnvironment, getNpmInvocation } from "./npm-command.mjs";

/**
 * The npm that installs dependencies in CI: .github/workflows/desktop-release.yml runs
 * `npm install -g <CI_NPM_SPEC>` and then a plain `npm ci`. Keep the two in step; a test checks
 * the workflow.
 */
export const CI_NPM_SPEC = "npm@11";
const CI_NPM_MAJOR = CI_NPM_SPEC.split("@")[1];

const FILES = ["package.json", "package-lock.json", ".npmrc"];

/**
 * Proves `npm ci` accepts package.json + package-lock.json + .npmrc the way CI runs it, before
 * any release state changes: this machine's npm must be CI's major version (it writes the lock
 * file), and it runs `npm ci --dry-run` directly in a temporary copy, so node_modules is never
 * touched. v1.8.0's installer build failed on a lock file CI's npm 10 rejected; v1.8.1's failed
 * because npm 10 launched npm 11 (`npx npm@11 ci`) and passed it .npmrc's allow-scripts as an
 * environment setting, which npm 11 refuses. A dry run catches both.
 */
export function runLockfileCheck({
  root = process.cwd(),
  env = process.env,
  execPath = process.execPath,
  platform = process.platform,
  spawn = spawnSync,
  log = console.log,
  makeTempDir = () => mkdtempSync(join(tmpdir(), "examazej-lockfile-")),
} = {}) {
  const npm = getNpmInvocation({ env, execPath, platform });
  const childEnv = { ...getNpmEnvironment(env), NODE_OPTIONS: ensureSystemCa(env.NODE_OPTIONS) };

  const versionRun = spawn(npm.command, [...npm.argsPrefix, "--version"], {
    env: childEnv,
    shell: false,
    encoding: "utf8",
  });
  const version = String(versionRun.stdout ?? "").trim();
  if (versionRun.status !== 0 || version.split(".")[0] !== CI_NPM_MAJOR) {
    log(
      `CI installs with ${CI_NPM_SPEC}, but this machine has npm ${version || "(unknown)"}. ` +
        `Use npm ${CI_NPM_MAJOR} here (it writes package-lock.json), or change CI_NPM_SPEC and ` +
        `the workflow together.`
    );
    return 1;
  }

  const dir = makeTempDir();
  try {
    for (const file of FILES) {
      if (existsSync(join(root, file))) copyFileSync(join(root, file), join(dir, file));
    }
    const result = spawn(
      npm.command,
      [...npm.argsPrefix, "ci", "--dry-run", "--ignore-scripts"],
      { cwd: dir, env: childEnv, shell: false, stdio: "inherit" },
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

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getNpmEnvironment, getNpmInvocation } from "./npm-command.mjs";

export const RELEASE_CHECKS = [
  { script: "lockfile:check", label: "Clean install with CI's npm" },
  { script: "audit:security", label: "Dependency audit" },
  { script: "lint:strict", label: "ESLint" },
  { script: "typecheck", label: "TypeScript" },
  { script: "test:run", label: "Tests" },
  { script: "build:clean", label: "Web build" },
  { script: "build:django:clean", label: "University (Django) build" },
  { script: "build:desktop:clean", label: "Desktop build" },
];

function runNpmScript(script) {
  const npm = getNpmInvocation();
  const result = spawnSync(npm.command, [...npm.argsPrefix, "run", script], {
    env: getNpmEnvironment(),
    shell: false,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

export function runReleaseChecks({
  log = console.log,
  runScript = runNpmScript,
} = {}) {
  for (const check of RELEASE_CHECKS) {
    log(`\n==> ${check.label} (${check.script})`);
    const status = runScript(check.script);
    if (status !== 0) {
      log(`Release verification stopped: ${check.script} failed.`);
      return status;
    }
  }

  log("\nRelease verification passed.");
  return 0;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  process.exitCode = runReleaseChecks();
}

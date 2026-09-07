import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getNpmEnvironment, getNpmInvocation } from "./npm-command.mjs";

const SYSTEM_CA_FLAG = "--use-system-ca";

export function ensureSystemCa(nodeOptions = "") {
  const options = nodeOptions.trim();
  const tokens = options.split(/\s+/).filter(Boolean);
  if (tokens.includes(SYSTEM_CA_FLAG)) return options;
  return [options, SYSTEM_CA_FLAG].filter(Boolean).join(" ");
}

export function runNpmAudit({
  env = process.env,
  execPath = process.execPath,
  platform = process.platform,
  spawn = spawnSync,
} = {}) {
  const npm = getNpmInvocation({ env, execPath, platform });
  const childEnv = getNpmEnvironment(env);
  const result = spawn(npm.command, [...npm.argsPrefix, "audit", "--audit-level=low"], {
    env: {
      ...childEnv,
      NODE_OPTIONS: ensureSystemCa(env.NODE_OPTIONS),
    },
    shell: false,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  process.exitCode = runNpmAudit();
}

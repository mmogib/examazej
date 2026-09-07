import { dirname, join } from "node:path";

export function getNpmInvocation({
  env = process.env,
  execPath = process.execPath,
  platform = process.platform,
} = {}) {
  if (platform !== "win32") {
    return { command: "npm", argsPrefix: [] };
  }

  const npmCli =
    env.npm_execpath ?? join(dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js");
  return { command: execPath, argsPrefix: [npmCli] };
}

export function getNpmEnvironment(env = process.env) {
  const childEnv = { ...env };
  for (const key of Object.keys(childEnv)) {
    if (key.toLowerCase() === "npm_config_allow_scripts") {
      delete childEnv[key];
    }
  }
  return childEnv;
}

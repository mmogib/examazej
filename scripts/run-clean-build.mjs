import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getNpmEnvironment, getNpmInvocation } from "./npm-command.mjs";

export const FORBIDDEN_BUILD_WARNINGS = [
  "Browserslist:",
  "Some chunks are larger",
  "Unknown input options",
  "Unknown output options",
  "externalized for browser compatibility",
  "could not be resolved",
  "Circular chunk:",
  // A `base` without a leading slash still builds (Vite adds the slash), but say so.
  '"base" option should start with a slash',
];

/** Where the KFUPM (Django) server serves the built files from; see vite.config.ts. */
export const DJANGO_BASE = "/static/frontend/";

const BUILD_SCRIPTS = {
  web: "build",
  desktop: "build:desktop",
  django: "build:django",
};

export function findBuildProblem({ output, status }) {
  if (status !== 0) return `Build command exited with status ${status}`;
  return FORBIDDEN_BUILD_WARNINGS.find((warning) => output.includes(warning)) ?? null;
}

export function runCleanBuild(
  mode,
  {
    cwd = process.cwd(),
    env = process.env,
    platform = process.platform,
    readFile = readFileSync,
    spawn = spawnSync,
    stderr = process.stderr,
    stdout = process.stdout,
  } = {},
) {
  const script = BUILD_SCRIPTS[mode];
  if (!script) {
    stderr.write(`Unknown build mode: ${mode}\n`);
    return 1;
  }

  const npm = getNpmInvocation({ env, platform });
  const result = spawn(npm.command, [...npm.argsPrefix, "run", script], {
    cwd,
    encoding: "utf8",
    env: getNpmEnvironment(env),
    shell: false,
  });
  const buildStdout = result.stdout ?? "";
  const buildStderr = result.stderr ?? "";
  stdout.write(buildStdout);
  stderr.write(buildStderr);

  const problem = findBuildProblem({
    output: `${buildStdout}\n${buildStderr}`,
    status: result.status ?? 1,
  });
  if (problem) {
    stderr.write(`Release build rejected: ${problem}\n`);
    return result.status || 1;
  }

  if (mode === "web" || mode === "django") {
    const indexHtml = readFile(resolve(cwd, "dist", "index.html"), "utf8");
    if (/rel="modulepreload"[^>]+exceljs/i.test(indexHtml)) {
      stderr.write("Release build rejected: ExcelJS is eagerly preloaded.\n");
      return 1;
    }
    if (mode === "django" && !indexHtml.includes(`src="${DJANGO_BASE}assets/`)) {
      stderr.write(
        `Release build rejected: the Django build does not load its code from ${DJANGO_BASE}.\n`,
      );
      return 1;
    }
  }

  return 0;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  process.exitCode = runCleanBuild(process.argv[2]);
}

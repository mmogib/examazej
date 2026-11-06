import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getNpmInvocation } from "../npm-command.mjs";
import { ensureSystemCa, runNpmAudit } from "../npm-audit.mjs";
import {
  FORBIDDEN_BUILD_WARNINGS,
  findBuildProblem,
} from "../run-clean-build.mjs";
import { RELEASE_CHECKS, runReleaseChecks } from "../verify-release.mjs";
import { CI_NPM_SPEC, runLockfileCheck } from "../check-lockfile.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("release verification", () => {
  it("runs every release check in the approved order", () => {
    expect(RELEASE_CHECKS.map((check) => check.script)).toEqual([
      "lockfile:check",
      "audit:security",
      "lint:strict",
      "typecheck",
      "test:run",
      "build:clean",
      "build:desktop:clean",
    ]);
  });

  it("stops after the first failed check", () => {
    const visited = [];
    const status = runReleaseChecks({
      log: vi.fn(),
      runScript(script) {
        visited.push(script);
        return script === "typecheck" ? 2 : 0;
      },
    });

    expect(status).toBe(2);
    expect(visited).toEqual(["lockfile:check", "audit:security", "lint:strict", "typecheck"]);
  });
});

describe("npm audit runner", () => {
  it("runs npm through Node on Windows without invoking a command shell", () => {
    expect(
      getNpmInvocation({
        env: { npm_execpath: "C:\\npm\\bin\\npm-cli.js" },
        execPath: "C:\\Program Files\\nodejs\\node.exe",
        platform: "win32",
      }),
    ).toEqual({
      command: "C:\\Program Files\\nodejs\\node.exe",
      argsPrefix: ["C:\\npm\\bin\\npm-cli.js"],
    });
  });

  it("preserves existing Node options and appends the system CA flag once", () => {
    expect(ensureSystemCa("--max-old-space-size=4096")).toBe(
      "--max-old-space-size=4096 --use-system-ca",
    );
    expect(ensureSystemCa("--use-system-ca")).toBe("--use-system-ca");
  });

  it("runs a low-threshold audit without a shell", () => {
    const spawn = vi.fn(() => ({ status: 0 }));
    const status = runNpmAudit({
      env: {
        NODE_OPTIONS: "--trace-warnings",
        npm_execpath: "C:\\npm\\bin\\npm-cli.js",
        npm_config_allow_scripts: "@anthropic-ai/claude-code",
      },
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      platform: "win32",
      spawn,
    });

    expect(status).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      "C:\\Program Files\\nodejs\\node.exe",
      ["C:\\npm\\bin\\npm-cli.js", "audit", "--audit-level=low"],
      expect.objectContaining({
        env: expect.objectContaining({
          NODE_OPTIONS: "--trace-warnings --use-system-ca",
        }),
        shell: false,
        stdio: "inherit",
      }),
    );
    expect(spawn.mock.calls[0][2].env).not.toHaveProperty(
      "npm_config_allow_scripts",
    );
  });
});

describe("lock file check", () => {
  it("dry-runs npm ci with CI's npm in a temporary copy, without a shell", () => {
    const spawn = vi.fn(() => ({ status: 0 }));
    const status = runLockfileCheck({
      root: repositoryRoot,
      env: {
        npm_execpath: "C:\\npm\\bin\\npm-cli.js",
        npm_config_allow_scripts: "@anthropic-ai/claude-code",
      },
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      platform: "win32",
      spawn,
    });

    expect(status).toBe(0);
    const [command, args, options] = spawn.mock.calls[0];
    expect(command).toBe("C:\\Program Files\\nodejs\\node.exe");
    expect(args).toEqual([
      "C:\\npm\\bin\\npm-cli.js",
      "exec", "--yes", `--package=${CI_NPM_SPEC}`, "--",
      "npm", "ci", "--dry-run", "--ignore-scripts",
    ]);
    expect(options.cwd).not.toBe(repositoryRoot);
    expect(options.shell).toBe(false);
    expect(options.env).not.toHaveProperty("npm_config_allow_scripts");
    expect(options.env.NODE_OPTIONS).toContain("--use-system-ca");
  });

  it("fails when npm ci rejects the lock file", () => {
    const status = runLockfileCheck({ root: repositoryRoot, spawn: () => ({ status: 1 }) });
    expect(status).toBe(1);
  });

  it("CI installs dependencies with the same npm the check uses", () => {
    const workflow = readFileSync(
      resolve(repositoryRoot, ".github", "workflows", "desktop-release.yml"),
      "utf8",
    );
    expect(workflow).toContain(`run: npx --yes ${CI_NPM_SPEC} ci`);
    expect(workflow).not.toMatch(/run: npm ci\b/);
  });
});

describe("clean build runner", () => {
  it.each(FORBIDDEN_BUILD_WARNINGS)(
    "rejects the build warning %s",
    (warning) => {
      expect(findBuildProblem({ output: `before\n${warning}\nafter`, status: 0 })).toBe(
        warning,
      );
    },
  );

  it("returns the build status before scanning warnings", () => {
    expect(findBuildProblem({ output: "clean output", status: 7 })).toBe(
      "Build command exited with status 7",
    );
  });

  it("accepts warning-free successful output", () => {
    expect(findBuildProblem({ output: "built in 4.2s", status: 0 })).toBeNull();
  });
});

describe("release integration", () => {
  it("excludes generated coverage output from strict lint", () => {
    const eslintConfig = readFileSync(
      resolve(repositoryRoot, "eslint.config.js"),
      "utf8",
    );

    expect(eslintConfig).toMatch(/ignores:\s*\[[^\]]*"coverage"/s);
  });

  it("pins every reviewed dependency install script", () => {
    const npmConfig = readFileSync(
      resolve(repositoryRoot, ".npmrc"),
      "utf8",
    );

    expect(npmConfig).toContain(
      "allow-scripts=@swc/core@1.13.2,electron-winstaller@5.4.0,esbuild@0.25.12",
    );
    expect(npmConfig).toContain("strict-allow-scripts=true");
  });

  it("runs verification after the clean-tree check and before version mutation", () => {
    const releaseScript = readFileSync(
      resolve(repositoryRoot, "scripts", "release.sh"),
      "utf8",
    );
    const cleanTreeCheck = releaseScript.indexOf("git status --porcelain");
    const verification = releaseScript.indexOf("npm run verify:release");
    const versionRead = releaseScript.indexOf("CURRENT_VERSION=");

    expect(cleanTreeCheck).toBeGreaterThan(-1);
    expect(verification).toBeGreaterThan(cleanTreeCheck);
    expect(verification).toBeLessThan(versionRead);
  });

  it("runs the same read-only gate in CI", () => {
    const workflow = readFileSync(
      resolve(repositoryRoot, ".github", "workflows", "quality.yml"),
      "utf8",
    );

    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("main");
    expect(workflow).toContain("new-feat");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run verify:release");
  });
});

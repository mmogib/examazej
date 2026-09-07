# Pre-Release Quality Gate Design

## Purpose

Prevent a release from versioning, tagging, merging, or pushing while the repository has known dependency vulnerabilities, type errors, lint errors, or lint warnings. The same verification must be available locally and in CI so the release workflow cannot silently diverge from normal development checks.

## Placement in the Approved Workflow

1. Implement and test a feature on a feature branch.
2. Obtain local user acceptance.
3. Merge the accepted feature into `new-feat`.
4. Run the pre-release quality gate and fix all actionable findings.
5. Rerun the complete gate from a clean checkout.
6. Stop for explicit release approval.
7. Only after approval, run `scripts/release.sh` from `new-feat`.

The release script must invoke the quality gate before changing package versions, creating commits or tags, switching branches, or pushing anything.

## One Reusable Gate

Add one cross-platform `npm run verify:release` command. It runs these checks sequentially and stops on the first failure:

1. `npm audit --audit-level=low`
2. ESLint with `--max-warnings=0`
3. the complete TypeScript project build/check
4. the complete non-watch Vitest suite
5. the production web build
6. the production desktop-mode build, without running Electron packaging

Generated output directories must be excluded from lint input so a previous build cannot change lint results. The desktop command must use the direct Vite desktop mode accepted by this repository rather than the npm argument form that is parsed as a directory by the installed npm version.

The audit command must retain certificate verification. On the university network it may use Node's system certificate store through `--use-system-ca`; it must never disable strict SSL. An unavailable audit endpoint is a failed gate, not a clean audit.

## CI and Release Integration

A quality workflow runs on pull requests and pushes affecting `new-feat` or `main`. It uses `npm ci` and the same `npm run verify:release` command used locally.

`scripts/release.sh` invokes that command after validating the current branch and clean worktree, but before calculating or applying a version change. A failed check exits without a version bump, commit, tag, merge, push, deployment, or Electron publication.

## Remediation Policy

- Apply non-breaking `npm audit fix` updates first and inspect the lockfile diff.
- Never use `npm audit fix --force` automatically.
- Upgrade related packages, such as the Tiptap family, as one aligned and explicitly tested set when remediation crosses a declared compatibility boundary.
- Fix repository-owned lint errors, lint warnings, TypeScript errors, and straightforward build warnings rather than suppressing them.
- Resolve warnings from stale browser data or obsolete configuration at their source.
- If an upstream-only warning has no safe current remediation, document its dependency path, impact, and follow-up owner explicitly; do not represent it as fixed or hide it by weakening the gate.
- Run tests and both builds after each dependency group or logically related cleanup commit.

## Current Baseline to Eliminate

The September 7, 2026 audit reports 40 advisories in the full dependency tree (9 high) and 34 when development dependencies are omitted (5 high). Most have a non-forced remediation; Tiptap requires an aligned upgrade and separate regression testing. The repository also currently has 47 lint errors, 8 lint warnings, 3 TypeScript errors, stale Browserslist data, large-bundle output, and desktop Rollup option warnings. These predate the pledge feature, but the new gate cannot be enabled as a passing release requirement until the actionable baseline is cleaned.

## Safety and Scope

- Keep the pledge feature commits unchanged; quality work uses separate commits on `new-feat`.
- Do not compile LaTeX, run `electron-builder`, create installers, release, tag, push, or deploy during cleanup.
- Preserve `package-lock.json` and use reproducible `npm ci` installs in CI.
- Treat the final result as ready only when the gate passes from a clean state and the user has approved release separately.


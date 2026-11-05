# Dependency notices

Last reviewed: 2026-11-05

## Security overrides

`package.json` `overrides` force patched versions where a parent package pins a
vulnerable range. Remove each one once its parent ships a range that already
resolves to the patched version (check with `npm explain <package>`).

- `@tailwindcss/typography` → `postcss-selector-parser@^6.1.5`
  (GHSA-rj75-hqrm-r3gf). Typography pins `6.0.10` exactly; `6.1.x` is a
  same-major update.
- `app-builder-lib`, `@electron/universal`, `@typescript-eslint/typescript-estree`
  → `minimatch@^11.0.4` (GHSA-g3hv-75wg-m249, fixed only in `11.0.1+`). This
  crosses a major version: v11 removed `makeRe()`, `Minimatch#regexp`, and the
  `AST` class. None of the three parents uses them. They call only `minimatch()`,
  `new Minimatch()`, `.set`, `.negate`, and `.match(path, partial)`. Because
  `app-builder-lib` selects which files enter the desktop package, the override
  was verified on 2026-11-05 by packaging `--dir` builds before and after it:
  the asar listings matched entry-for-entry (94 entries; only content-hashed
  bundle names differed). Repeat that check whenever Electron Builder or this
  override changes.

## Install scripts

The project explicitly approves these version-pinned dependency lifecycle scripts
in `.npmrc` and enables `strict-allow-scripts`, so an unreviewed script fails the
install:

- `@swc/core@1.13.2`: selects or verifies the native SWC binding used by the Vite
  React plugin.
- `esbuild@0.25.12`: installs and verifies the platform-specific esbuild binary
  used by Vite.
- `electron-winstaller@5.4.0`: selects the platform-specific 7-Zip executable
  used by Electron Builder's Windows installer tooling.

Keep these approvals pinned. When any listed version changes, review the new
package script before updating its approval.

## Upstream deprecation notices

A clean npm install currently reports deprecations below direct dependencies we
already have at their latest published versions:

- `exceljs@4.4.0` brings older `archiver`, `fast-csv`, and `unzipper` trees. These
  account for `inflight`, `glob@7`, `lodash.isequal`, `rimraf@2`, and `fstream`.
- `electron-builder@26.18.1` brings Electron packaging utilities that account for
  `inflight`, `glob@7`, `rimraf@2`, `boolean`, and `electron-winstaller` notices.
- `electron-updater@6.8.9` also depends on deprecated `lodash.isequal`.

Do not force incompatible transitive versions through npm overrides merely to
silence these messages. Recheck the paths with `npm explain <package>` whenever
ExcelJS, Electron Builder, or Electron Updater publishes an update. The enforced
production audit remains `npm run audit:security`, and the complete gate is
`npm run verify:release`.

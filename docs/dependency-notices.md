# Dependency notices

Last reviewed: 2026-09-08

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
- `electron-builder@26.15.3` brings Electron packaging utilities that account for
  `inflight`, `glob@7`, `rimraf@2`, `boolean`, and `electron-winstaller` notices.
- `electron-updater@6.8.9` also depends on deprecated `lodash.isequal`.

Do not force incompatible transitive versions through npm overrides merely to
silence these messages. Recheck the paths with `npm explain <package>` whenever
ExcelJS, Electron Builder, or Electron Updater publishes an update. The enforced
production audit remains `npm run audit:security`, and the complete gate is
`npm run verify:release`.

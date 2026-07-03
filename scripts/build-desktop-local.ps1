# Local desktop build for THIS machine (owner). Outputs the installer to D: because C:
# is space-tight, and routes electron-builder's temp + caches to D: too, with the
# university SSL-inspection CA (needed for the electron/nsis downloads on the proxy).
#
#   Run:  npm run electron:build:local
#
# NOTE: CI (Phase 5, windows-latest) does NOT use this script — it runs electron-builder
# directly and writes to the default `release/` (from electron-builder.yml) on the runner.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$out = "D:\examazej-release"
$env:NODE_OPTIONS = "--use-system-ca"            # trust the proxy CA (registry + electron/nsis downloads)
$env:TEMP = "D:\eb-tmp"; $env:TMP = "D:\eb-tmp"  # keep 7zip/compression temp off C:
$env:ELECTRON_BUILDER_CACHE = "D:\eb-cache"      # nsis/7zip tooling cache
$env:ELECTRON_CACHE = "D:\electron-cache"        # electron framework zip cache
New-Item -ItemType Directory -Force -Path D:\eb-tmp, D:\eb-cache, D:\electron-cache | Out-Null

Write-Host "==> vite build --mode desktop"
npx vite build --mode desktop
if ($LASTEXITCODE -ne 0) { throw "vite build failed" }

Write-Host "==> electron-builder (output: $out)"
npx electron-builder --config.directories.output="$out"
if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }

Write-Host "Done. Installer + win-unpacked -> $out"

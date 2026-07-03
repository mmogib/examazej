# Remove local desktop BUILD OUTPUT (regenerable; once a release is pushed it lives on
# GitHub Releases, so the local copy is disposable). Keeps the download caches
# (D:\eb-cache, D:\electron-cache) so the next build stays fast (no proxy re-download).
#
#   Run:  npm run electron:clean
$root = Split-Path -Parent $PSScriptRoot
$targets = @(
  (Join-Path $root 'dist'),
  (Join-Path $root 'dist-electron'),
  (Join-Path $root 'release'),   # in case a build ever wrote output on C: by mistake
  'D:\examazej-release',
  'D:\eb-tmp'
)
foreach ($p in $targets) {
  if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "removed $p" }
}
Write-Host "Build output cleared. Caches kept (D:\eb-cache, D:\electron-cache) for fast rebuilds."

# Regenerate ALL app icons (web + desktop) from the single Fable master.
# Requires ImageMagick (`magick`). Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File scripts/gen-icons.ps1
# Outputs are committed to git, so CI (windows-latest) never needs ImageMagick.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$master = "assets/branding/icon/examazej-icon-1024.png"   # 1024x1024 app icon (green->cyan bg)
$og     = "assets/branding/icon/examazej-og-1200x630.png" # 1200x630 social banner

New-Item -ItemType Directory -Force -Path "build"  | Out-Null
New-Item -ItemType Directory -Force -Path "public" | Out-Null

Write-Host "Desktop -> build/icon.ico (256..16)"
magick $master -define icon:auto-resize=256,128,64,48,32,24,16 "build/icon.ico"

Write-Host "Web -> public/favicon.png (512)"
magick $master -resize 512x512 "public/favicon.png"

Write-Host "Web -> public/favicon.ico (48,32,16)"
magick $master -define icon:auto-resize=48,32,16 "public/favicon.ico"

Write-Host "Web -> public/apple-touch-icon.png (180, opaque green corners)"
magick $master -resize 180x180 -background "#027E2F" -flatten "public/apple-touch-icon.png"

Write-Host "Web -> public/icon-192.png, public/icon-512.png (PWA)"
magick $master -resize 192x192 "public/icon-192.png"
magick $master -resize 512x512 "public/icon-512.png"

Write-Host "Web -> public/og-image.png (1200x630)"
Copy-Item $og "public/og-image.png" -Force

Write-Host "Done. Regenerate anytime the master changes."

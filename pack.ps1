# SubText Packaging Script for GitHub Releases
# Creates a clean subtext-v1.0.0.zip inside the parent directory

$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

$outputZip = Join-Path $scriptDir "..\subtext-v1.0.0.zip"
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$filesToInclude = @(
    (Join-Path $scriptDir "manifest.json"),
    (Join-Path $scriptDir "popup.html"),
    (Join-Path $scriptDir "popup.css"),
    (Join-Path $scriptDir "popup.js"),
    (Join-Path $scriptDir "content.js"),
    (Join-Path $scriptDir "content.css"),
    (Join-Path $scriptDir "icon16.png"),
    (Join-Path $scriptDir "icon48.png"),
    (Join-Path $scriptDir "icon128.png"),
    (Join-Path $scriptDir "README.md")
)

Write-Host "Packaging SubText into $outputZip..." -ForegroundColor Cyan
Compress-Archive -Path $filesToInclude -DestinationPath $outputZip -Force
Write-Host "Success! Archive ready at: $(Resolve-Path $outputZip)" -ForegroundColor Green

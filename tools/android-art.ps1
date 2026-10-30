$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskResourceRoot = Join-Path $taskRoot 'android\app\src\main\res'
$taskIcon = [Drawing.Image]::FromFile((Join-Path $taskRoot 'public\assets\art\app-icon.png'))
function Write-AndroidBitmap([string]$taskDestination, [int]$taskSize, [bool]$taskAdaptive) {
    $taskBitmap = [Drawing.Bitmap]::new($taskSize, $taskSize)
    $taskGraphics = [Drawing.Graphics]::FromImage($taskBitmap)
    try {
        $taskGraphics.Clear($(if ($taskAdaptive) { [Drawing.Color]::Transparent } else { [Drawing.ColorTranslator]::FromHtml('#11121c') }))
        $taskGraphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $taskArtSize = if ($taskAdaptive) { [int]($taskSize * 0.67) } else { $taskSize }
        $taskOffset = [int](($taskSize - $taskArtSize) / 2)
        $taskGraphics.DrawImage($taskIcon, $taskOffset, $taskOffset, $taskArtSize, $taskArtSize)
        $taskBitmap.Save($taskDestination, [Drawing.Imaging.ImageFormat]::Png)
    } finally { $taskGraphics.Dispose(); $taskBitmap.Dispose() }
}
try {
    foreach ($taskDensity in @(@('mdpi',1), @('hdpi',1.5), @('xhdpi',2), @('xxhdpi',3), @('xxxhdpi',4))) {
        $taskFolder = Join-Path $taskResourceRoot ('mipmap-' + $taskDensity[0])
        [IO.Directory]::CreateDirectory($taskFolder) | Out-Null
        Write-AndroidBitmap (Join-Path $taskFolder 'ic_launcher.png') ([int](48 * $taskDensity[1])) $false
        Write-AndroidBitmap (Join-Path $taskFolder 'ic_launcher_round.png') ([int](48 * $taskDensity[1])) $false
        Write-AndroidBitmap (Join-Path $taskFolder 'ic_launcher_foreground.png') ([int](108 * $taskDensity[1])) $true
    }
    foreach ($taskSplash in Get-ChildItem -LiteralPath $taskResourceRoot -Filter 'splash.png' -Recurse -File) {
        $taskBitmap = [Drawing.Bitmap]::new(1024,1024)
        $taskGraphics = [Drawing.Graphics]::FromImage($taskBitmap)
        try {
            $taskGraphics.Clear([Drawing.ColorTranslator]::FromHtml('#11121c'))
            $taskGraphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $taskGraphics.DrawImage($taskIcon,384,384,256,256)
            $taskBitmap.Save($taskSplash.FullName, [Drawing.Imaging.ImageFormat]::Png)
        } finally { $taskGraphics.Dispose(); $taskBitmap.Dispose() }
    }
} finally { $taskIcon.Dispose() }
Write-Output 'Generated art packaged at all five Android icon densities.'

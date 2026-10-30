param([switch]$SkipRelease)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskAndroid = Join-Path $taskRoot 'android'
$taskSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!(Test-Path -LiteralPath $taskSdk)) { throw 'Android SDK was not found. Set ANDROID_HOME to the SDK directory.' }
$taskSdkProperty = $taskSdk.Replace('\', '/')
[IO.File]::WriteAllText((Join-Path $taskAndroid 'local.properties'), "sdk.dir=$taskSdkProperty`n")
$taskSigning = Join-Path $taskAndroid 'signing.properties'
if (!$SkipRelease -and !(Test-Path -LiteralPath $taskSigning)) {
    $taskKeyDir = Join-Path $taskAndroid 'keystore'
    [IO.Directory]::CreateDirectory($taskKeyDir) | Out-Null
    $taskRandom = [Security.Cryptography.RandomNumberGenerator]::Create()
    $taskBytes = New-Object byte[] 32
    $taskRandom.GetBytes($taskBytes); $taskRandom.Dispose()
    $taskPassword = [Convert]::ToBase64String($taskBytes)
    $env:ELDERVALE_UPLOAD_PASSWORD = $taskPassword
    try {
        & keytool -genkeypair -keystore (Join-Path $taskKeyDir 'eldervale-upload.jks') -alias eldervale-upload -keyalg RSA -keysize 3072 -validity 10000 -storepass:env ELDERVALE_UPLOAD_PASSWORD -keypass:env ELDERVALE_UPLOAD_PASSWORD -dname 'CN=Eldervale Upload, OU=Game Development, O=Eldervale, L=Jakarta, C=ID' -noprompt
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the local upload key.' }
        [IO.File]::WriteAllText($taskSigning, "storeFile=keystore/eldervale-upload.jks`nstorePassword=$taskPassword`nkeyAlias=eldervale-upload`nkeyPassword=$taskPassword`n")
    } finally { Remove-Item Env:\ELDERVALE_UPLOAD_PASSWORD -ErrorAction SilentlyContinue }
}
Push-Location $taskAndroid
try {
    $taskGradleTargets = if ($SkipRelease) { @('assembleDebug') } else { @('assembleDebug', 'assembleRelease', 'bundleRelease') }
    & '.\gradlew.bat' @taskGradleTargets --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
} finally { Pop-Location }
$taskReleaseDir = Join-Path $taskRoot 'releases'
[IO.Directory]::CreateDirectory($taskReleaseDir) | Out-Null
Copy-Item -LiteralPath (Join-Path $taskAndroid 'app\build\outputs\apk\debug\app-debug.apk') -Destination (Join-Path $taskReleaseDir 'Eldervale-Android-debug.apk') -Force
if (!$SkipRelease) {
    Copy-Item -LiteralPath (Join-Path $taskAndroid 'app\build\outputs\apk\release\app-release.apk') -Destination (Join-Path $taskReleaseDir 'Eldervale-Android-v1.6.0.apk') -Force
    Copy-Item -LiteralPath (Join-Path $taskAndroid 'app\build\outputs\bundle\release\app-release.aab') -Destination (Join-Path $taskReleaseDir 'Eldervale-Play-v1.6.0.aab') -Force
}
Get-ChildItem -LiteralPath $taskReleaseDir -File | Where-Object { $_.Extension -in @('.apk', '.aab') } | Select-Object Name, Length

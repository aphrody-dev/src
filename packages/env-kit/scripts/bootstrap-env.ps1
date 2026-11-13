#Requires -Version 5.1
<#
.SYNOPSIS
  Harvests existing User/Machine/CLI credentials securely in-memory, populates C:\src\.env,
  enforces strict NTFS ACLs, configures global Git secret guards, and updates ~/.npmrc safely.
  ZERO raw secret values are ever written to stdout or logs.
#>

$ErrorActionPreference = 'Stop'

function Get-NonEmptyEnv([string]$Name) {
  foreach ($scope in @('User', 'Process', 'Machine')) {
    $v = [Environment]::GetEnvironmentVariable($Name, $scope)
    if (-not [string]::IsNullOrWhiteSpace($v)) {
      return $v.Trim()
    }
  }
  return ''
}

function Set-UserEnvIfMissingOrTarget([string]$Name, [string]$Value, [switch]$Force) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return }
  $cur = [Environment]::GetEnvironmentVariable($Name, 'User')
  if ($Force -or [string]::IsNullOrWhiteSpace($cur)) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Set-Item -Path "Env:\$Name" -Value $Value
  }
}

# 1. Configure global git core.excludesFile
& git config --global core.excludesFile "C:/Users/aphro/.gitignore_global"

# 2. Harvest GitHub token from gh CLI if available
$ghToken = Get-NonEmptyEnv 'GITHUB_TOKEN'
if (-not $ghToken) { $ghToken = Get-NonEmptyEnv 'GH_TOKEN' }
try {
  $cliGh = (& gh auth token 2>$null)
  if ($cliGh -and -not [string]::IsNullOrWhiteSpace($cliGh)) {
    $ghToken = $cliGh.Trim()
  }
} catch {}

Set-UserEnvIfMissingOrTarget -Name 'GITHUB_TOKEN' -Value $ghToken
Set-UserEnvIfMissingOrTarget -Name 'GH_TOKEN' -Value $ghToken

# 3. Figma credentials & local Material Icons dir
$figmaVal = Get-NonEmptyEnv 'FIGMA_ACCESS_TOKEN'
if (-not $figmaVal) { $figmaVal = Get-NonEmptyEnv 'FIGMA_TOKEN' }
$figmaIconsDir = 'C:/src/packages/design/node_modules/@material-symbols/svg-400'
if ($figmaVal) {
  Set-UserEnvIfMissingOrTarget -Name 'FIGMA_ACCESS_TOKEN' -Value $figmaVal -Force
  Set-UserEnvIfMissingOrTarget -Name 'FIGMA_TOKEN' -Value $figmaVal -Force
}
Set-UserEnvIfMissingOrTarget -Name 'FIGMA_MATERIAL_ICONS_LOCAL_DIR' -Value $figmaIconsDir -Force

# 4. npm / Bun token & ~/.npmrc interpolation
$npmToken = Get-NonEmptyEnv 'NPM_TOKEN'
$npmrcPath = Join-Path $HOME '.npmrc'
if (Test-Path $npmrcPath) {
  $npmLines = Get-Content $npmrcPath
  $updatedLines = New-Object System.Collections.Generic.List[string]
  foreach ($line in $npmLines) {
    if ($line -match '^//registry\.npmjs\.org/:_authToken=(.+)$') {
      $extracted = $Matches[1].Trim()
      if ($extracted -ne '${NPM_TOKEN}' -and -not $npmToken) {
        $npmToken = $extracted
      }
      $updatedLines.Add('//registry.npmjs.org/:_authToken=${NPM_TOKEN}')
    } else {
      $updatedLines.Add($line)
    }
  }
  Set-Content -Path $npmrcPath -Value $updatedLines -Encoding UTF8
}
if ($npmToken) {
  Set-UserEnvIfMissingOrTarget -Name 'NPM_TOKEN' -Value $npmToken -Force
}

# 5. Cargo / Crates.io token + Cargo 2026 env
$cargoToken = Get-NonEmptyEnv 'CARGO_REGISTRY_TOKEN'
$cargoCreds = Join-Path $HOME '.cargo\credentials.toml'
if (-not $cargoToken -and (Test-Path $cargoCreds)) {
  $credRaw = Get-Content -Raw $cargoCreds
  if ($credRaw -match '(?m)^\s*token\s*=\s*"([^"]+)"') {
    $cargoToken = $Matches[1].Trim()
  }
}
if ($cargoToken) {
  Set-UserEnvIfMissingOrTarget -Name 'CARGO_REGISTRY_TOKEN' -Value $cargoToken
}

$cargoHome = (Get-NonEmptyEnv 'CARGO_HOME')
if (-not $cargoHome) { $cargoHome = 'C:\Users\aphro\.cargo' }
$rustupHome = (Get-NonEmptyEnv 'RUSTUP_HOME')
if (-not $rustupHome) { $rustupHome = 'C:\Users\aphro\.rustup' }
$cargoTargetDir = (Get-NonEmptyEnv 'CARGO_TARGET_DIR')
if (-not $cargoTargetDir) { $cargoTargetDir = 'C:\src\.cargo-target' }
$rustcWrapper = (Get-NonEmptyEnv 'RUSTC_WRAPPER')
if (-not $rustcWrapper) { $rustcWrapper = 'sccache' }

# 6. Python / uv / PyPI
$uvPublishToken = Get-NonEmptyEnv 'UV_PUBLISH_TOKEN'
$twinePassword = Get-NonEmptyEnv 'TWINE_PASSWORD'
if (-not $uvPublishToken -and $twinePassword) { $uvPublishToken = $twinePassword }
if (-not $twinePassword -and $uvPublishToken) { $twinePassword = $uvPublishToken }
$twineUsername = Get-NonEmptyEnv 'TWINE_USERNAME'
if (-not $twineUsername) { $twineUsername = '__token__' }
$uvCacheDir = Get-NonEmptyEnv 'UV_CACHE_DIR'
if (-not $uvCacheDir) { $uvCacheDir = "$env:LOCALAPPDATA\uv\cache" }
Set-UserEnvIfMissingOrTarget -Name 'UV_LINK_MODE' -Value 'hardlink'
Set-UserEnvIfMissingOrTarget -Name 'PYTHONUTF8' -Value '1'

# 7. .NET / NuGet
$nugetApiKey = Get-NonEmptyEnv 'NUGET_API_KEY'
Set-UserEnvIfMissingOrTarget -Name 'DOTNET_CLI_TELEMETRY_OPTOUT' -Value '1'
Set-UserEnvIfMissingOrTarget -Name 'DOTNET_NOLOGO' -Value '1'

# 8. C / C++ / CUDA / Vulkan
$vcpkgCache = Get-NonEmptyEnv 'VCPKG_DEFAULT_BINARY_CACHE'
if (-not $vcpkgCache) { $vcpkgCache = "$env:LOCALAPPDATA\vcpkg\archives" }
$cudaPath = Get-NonEmptyEnv 'CUDA_PATH'
if (-not $cudaPath) { $cudaPath = 'C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.4' }
$vulkanSdk = Get-NonEmptyEnv 'VULKAN_SDK'
if (-not $vulkanSdk) { $vulkanSdk = 'C:\VulkanSDK\1.4.363.0' }

# 9. Go & Lua
$goPath = Get-NonEmptyEnv 'GOPATH'
if (-not $goPath) { $goPath = 'C:\Users\aphro\go' }
$luaPath = 'C:\src\packages\env-kit\loaders\lua\?.lua;C:\src\packages\env-kit\loaders\lua\?\init.lua;;'
$luaCPath = 'C:\src\packages\env-kit\loaders\lua\?.dll;;'
Set-UserEnvIfMissingOrTarget -Name 'LUA_PATH' -Value $luaPath -Force
Set-UserEnvIfMissingOrTarget -Name 'LUA_CPATH' -Value $luaCPath -Force

# 10. Google Cloud & ADC
$gcpProject = Get-NonEmptyEnv 'GOOGLE_CLOUD_PROJECT'
if (-not $gcpProject) { $gcpProject = Get-NonEmptyEnv 'GCLOUD_PROJECT' }
if (-not $gcpProject) { $gcpProject = 'aphrody' }
$gcpRegion = Get-NonEmptyEnv 'GOOGLE_CLOUD_REGION'
if (-not $gcpRegion) { $gcpRegion = 'us-central1' }
$gcpLocation = Get-NonEmptyEnv 'GOOGLE_CLOUD_LOCATION'
if (-not $gcpLocation) { $gcpLocation = $gcpRegion }
$gcpAdc = Get-NonEmptyEnv 'GOOGLE_APPLICATION_CREDENTIALS'
$defaultAdc = Join-Path $env:APPDATA 'gcloud\application_default_credentials.json'
if (-not $gcpAdc -and (Test-Path $defaultAdc)) {
  $gcpAdc = $defaultAdc
}
if ($gcpAdc) {
  Set-UserEnvIfMissingOrTarget -Name 'GOOGLE_APPLICATION_CREDENTIALS' -Value $gcpAdc
}

# 11. Vercel, Neon, Cloudflare
$vercelToken = Get-NonEmptyEnv 'VERCEL_TOKEN'
$vercelOrgId = Get-NonEmptyEnv 'VERCEL_ORG_ID'
$vercelProjectId = Get-NonEmptyEnv 'VERCEL_PROJECT_ID'
$neonApiKey = Get-NonEmptyEnv 'NEON_API_KEY'
$neonOrgId = Get-NonEmptyEnv 'NEON_ORG_ID'
$databaseUrl = Get-NonEmptyEnv 'DATABASE_URL'
$cfApiToken = Get-NonEmptyEnv 'CLOUDFLARE_API_TOKEN'
$cfAccountId = Get-NonEmptyEnv 'CLOUDFLARE_ACCOUNT_ID'
if (-not $cfAccountId) { $cfAccountId = 'ca22c1a51a145f919b54afa18d936516' }
Set-UserEnvIfMissingOrTarget -Name 'CLOUDFLARE_ACCOUNT_ID' -Value $cfAccountId

# 12. AI Keys & Local Sovereign Endpoints
$geminiKey = Get-NonEmptyEnv 'GEMINI_API_KEY'
$googleApiKey = Get-NonEmptyEnv 'GOOGLE_API_KEY'
if (-not $geminiKey -and $googleApiKey) { $geminiKey = $googleApiKey }
if (-not $googleApiKey -and $geminiKey) { $googleApiKey = $geminiKey }
$openaiKey = Get-NonEmptyEnv 'OPENAI_API_KEY'
$anthropicKey = Get-NonEmptyEnv 'ANTHROPIC_API_KEY'
$anthropicWorkspace = Get-NonEmptyEnv 'ANTHROPIC_WORKSPACE_ID'
$anthropicSa = Get-NonEmptyEnv 'ANTHROPIC_SERVICE_ACCOUNT_ID'
$exaKey = Get-NonEmptyEnv 'EXA_API_KEY'
$ctx7Key = Get-NonEmptyEnv 'CTX7_API_KEY'
$shenronAdmin = Get-NonEmptyEnv 'SHENRON_MCP_ADMIN_TOKEN'
$piLuBaseUrl = Get-NonEmptyEnv 'PI_LU_BASE_URL'
if (-not $piLuBaseUrl) { $piLuBaseUrl = 'http://127.0.0.1:8129/v1' }
$ring3BaseUrl = Get-NonEmptyEnv 'RING3_BASE_URL'
if (-not $ring3BaseUrl) { $ring3BaseUrl = 'http://127.0.0.1:8787/v1' }
Set-UserEnvIfMissingOrTarget -Name 'PI_LU_BASE_URL' -Value $piLuBaseUrl
Set-UserEnvIfMissingOrTarget -Name 'RING3_BASE_URL' -Value $ring3BaseUrl

function Format-EnvVal([string]$Val) {
  if ($null -eq $Val) { return '' }
  if ($Val -match '[\s#"'']') {
    $escaped = $Val.Replace('\', '\\').Replace('"', '\"')
    return "`"$escaped`""
  }
  return $Val
}

# Preserve any pre-existing custom keys if C:\src\.env already existed
$existingCustom = @{}
$envFilePath = 'C:\src\.env'
if (Test-Path $envFilePath) {
  foreach ($line in (Get-Content $envFilePath)) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $k = $Matches[1]
      $v = $Matches[2].Trim()
      if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
        $v = $v.Substring(1, $v.Length - 2)
      }
      if (-not [string]::IsNullOrEmpty($v)) {
        $existingCustom[$k] = $v
      }
    }
  }
}

function Resolve-Val([string]$Key, [string]$Harvested) {
  if (-not [string]::IsNullOrEmpty($Harvested)) { return $Harvested }
  if ($existingCustom.ContainsKey($Key)) { return $existingCustom[$Key] }
  return ''
}

$entries = [ordered]@{
  '__SECTION_1' = '# --- 1. GitHub & Git Forge ---'
  'GITHUB_TOKEN' = (Resolve-Val 'GITHUB_TOKEN' $ghToken)
  'GH_TOKEN' = (Resolve-Val 'GH_TOKEN' $ghToken)

  '__SECTION_2' = "`n# --- 2. Figma & Design Systems ---"
  'FIGMA_ACCESS_TOKEN' = (Resolve-Val 'FIGMA_ACCESS_TOKEN' $figmaVal)
  'FIGMA_TOKEN' = (Resolve-Val 'FIGMA_TOKEN' $figmaVal)
  'FIGMA_MATERIAL_ICONS_LOCAL_DIR' = (Resolve-Val 'FIGMA_MATERIAL_ICONS_LOCAL_DIR' $figmaIconsDir)

  '__SECTION_3' = "`n# --- 3. JavaScript / Bun / npm Registry ---"
  'NPM_TOKEN' = (Resolve-Val 'NPM_TOKEN' $npmToken)
  'BUN_INSTALL' = (Resolve-Val 'BUN_INSTALL' (Get-NonEmptyEnv 'BUN_INSTALL'))

  '__SECTION_4' = "`n# --- 4. Rust / Crates.io / sccache ---"
  'CARGO_REGISTRY_TOKEN' = (Resolve-Val 'CARGO_REGISTRY_TOKEN' $cargoToken)
  'CARGO_HOME' = (Resolve-Val 'CARGO_HOME' $cargoHome)
  'RUSTUP_HOME' = (Resolve-Val 'RUSTUP_HOME' $rustupHome)
  'CARGO_TARGET_DIR' = (Resolve-Val 'CARGO_TARGET_DIR' $cargoTargetDir)
  'RUSTC_WRAPPER' = (Resolve-Val 'RUSTC_WRAPPER' $rustcWrapper)
  'CARGO_REGISTRIES_CRATES_IO_PROTOCOL' = 'sparse'

  '__SECTION_5' = "`n# --- 5. Python / uv / PyPI ---"
  'UV_PUBLISH_TOKEN' = (Resolve-Val 'UV_PUBLISH_TOKEN' $uvPublishToken)
  'TWINE_USERNAME' = (Resolve-Val 'TWINE_USERNAME' $twineUsername)
  'TWINE_PASSWORD' = (Resolve-Val 'TWINE_PASSWORD' $twinePassword)
  'UV_CACHE_DIR' = (Resolve-Val 'UV_CACHE_DIR' $uvCacheDir)
  'UV_LINK_MODE' = 'hardlink'
  'PYTHONUTF8' = '1'

  '__SECTION_6' = "`n# --- 6. .NET / NuGet ---"
  'NUGET_API_KEY' = (Resolve-Val 'NUGET_API_KEY' $nugetApiKey)
  'DOTNET_CLI_TELEMETRY_OPTOUT' = '1'
  'DOTNET_NOLOGO' = '1'

  '__SECTION_7' = "`n# --- 7. C / C++ / CUDA / Vulkan Native Toolchain ---"
  'CC' = 'cl.exe'
  'CXX' = 'cl.exe'
  'CMAKE_GENERATOR' = 'Ninja'
  'VCPKG_ROOT' = 'C:\src\vcpkg'
  'VCPKG_DEFAULT_BINARY_CACHE' = (Resolve-Val 'VCPKG_DEFAULT_BINARY_CACHE' $vcpkgCache)
  'CUDA_PATH' = (Resolve-Val 'CUDA_PATH' $cudaPath)
  'VULKAN_SDK' = (Resolve-Val 'VULKAN_SDK' $vulkanSdk)

  '__SECTION_8' = "`n# --- 8. Go & Lua ---"
  'GOPATH' = (Resolve-Val 'GOPATH' $goPath)
  'GOPROXY' = 'https://proxy.golang.org,direct'
  'CGO_ENABLED' = '1'
  'LUA_PATH' = $luaPath
  'LUA_CPATH' = $luaCPath

  '__SECTION_9' = "`n# --- 9. Google Cloud Platform (GCP & ADC) ---"
  'GOOGLE_CLOUD_PROJECT' = (Resolve-Val 'GOOGLE_CLOUD_PROJECT' $gcpProject)
  'GCLOUD_PROJECT' = (Resolve-Val 'GCLOUD_PROJECT' $gcpProject)
  'CLOUDSDK_CORE_PROJECT' = (Resolve-Val 'CLOUDSDK_CORE_PROJECT' $gcpProject)
  'GOOGLE_CLOUD_REGION' = (Resolve-Val 'GOOGLE_CLOUD_REGION' $gcpRegion)
  'GOOGLE_CLOUD_LOCATION' = (Resolve-Val 'GOOGLE_CLOUD_LOCATION' $gcpLocation)
  'GOOGLE_APPLICATION_CREDENTIALS' = (Resolve-Val 'GOOGLE_APPLICATION_CREDENTIALS' $gcpAdc)

  '__SECTION_10' = "`n# --- 10. Vercel, Neon Serverless Postgres & Cloudflare ---"
  'VERCEL_TOKEN' = (Resolve-Val 'VERCEL_TOKEN' $vercelToken)
  'VERCEL_ORG_ID' = (Resolve-Val 'VERCEL_ORG_ID' $vercelOrgId)
  'VERCEL_PROJECT_ID' = (Resolve-Val 'VERCEL_PROJECT_ID' $vercelProjectId)
  'NEON_API_KEY' = (Resolve-Val 'NEON_API_KEY' $neonApiKey)
  'NEON_ORG_ID' = (Resolve-Val 'NEON_ORG_ID' $neonOrgId)
  'DATABASE_URL' = (Resolve-Val 'DATABASE_URL' $databaseUrl)
  'CLOUDFLARE_API_TOKEN' = (Resolve-Val 'CLOUDFLARE_API_TOKEN' $cfApiToken)
  'CLOUDFLARE_ACCOUNT_ID' = (Resolve-Val 'CLOUDFLARE_ACCOUNT_ID' $cfAccountId)

  '__SECTION_11' = "`n# --- 11. AI Foundation Models & Sovereign Local Inference ---"
  'GEMINI_API_KEY' = (Resolve-Val 'GEMINI_API_KEY' $geminiKey)
  'GOOGLE_API_KEY' = (Resolve-Val 'GOOGLE_API_KEY' $googleApiKey)
  'OPENAI_API_KEY' = (Resolve-Val 'OPENAI_API_KEY' $openaiKey)
  'ANTHROPIC_API_KEY' = (Resolve-Val 'ANTHROPIC_API_KEY' $anthropicKey)
  'ANTHROPIC_WORKSPACE_ID' = (Resolve-Val 'ANTHROPIC_WORKSPACE_ID' $anthropicWorkspace)
  'ANTHROPIC_SERVICE_ACCOUNT_ID' = (Resolve-Val 'ANTHROPIC_SERVICE_ACCOUNT_ID' $anthropicSa)
  'EXA_API_KEY' = (Resolve-Val 'EXA_API_KEY' $exaKey)
  'CTX7_API_KEY' = (Resolve-Val 'CTX7_API_KEY' $ctx7Key)
  'SHENRON_MCP_ADMIN_TOKEN' = (Resolve-Val 'SHENRON_MCP_ADMIN_TOKEN' $shenronAdmin)
  'RING3_BASE_URL' = (Resolve-Val 'RING3_BASE_URL' $ring3BaseUrl)
  'PI_LU_BASE_URL' = (Resolve-Val 'PI_LU_BASE_URL' $piLuBaseUrl)
  'PI_LU_FALLBACK_URL' = 'http://127.0.0.1:8084/v1'
}

$outLines = New-Object System.Collections.Generic.List[string]
$outLines.Add('# ==============================================================================')
$outLines.Add('# C:\src\.env — Sovereign Monorepo Master Environment')
$outLines.Add('# NTFS ACL Locked (Owner + SYSTEM + Administrators ONLY). DO NOT COMMIT.')
$outLines.Add('# ==============================================================================')
$outLines.Add('')

$populatedCount = 0
$slotCount = 0
foreach ($k in $entries.Keys) {
  if ($k.StartsWith('__SECTION_')) {
    $outLines.Add($entries[$k])
  } else {
    $val = [string]$entries[$k]
    if ($val.Length -gt 0) { $populatedCount++ } else { $slotCount++ }
    $outLines.Add("$k=$(Format-EnvVal $val)")
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($envFilePath, $outLines, $utf8NoBom)

# Lock NTFS ACLs on C:\src\.env using locale-independent Well-Known SIDs (*S-1-5-18 = SYSTEM, *S-1-5-32-544 = Administrators)
& icacls $envFilePath /inheritance:r /grant:r "$($env:USERNAME):(F)" "*S-1-5-18:(F)" "*S-1-5-32-544:(F)" | Out-Null

Write-Output "[bootstrap-env] Wrote C:\src\.env successfully (Populated=$populatedCount, EmptySlots=$slotCount)."
Write-Output "[bootstrap-env] Applied strict NTFS ACLs on C:\src\.env:"
& icacls $envFilePath

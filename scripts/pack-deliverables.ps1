# ====================================================================
# LearnOS Autonomous Deliverable Packaging Script (fixed)
# Generates isolated agent ZIPs and master integrated ZIP
# Excludes node_modules, dist, .git, .env, logs and old zips
# Run:  powershell -ExecutionPolicy Bypass -File scripts\package-deliverables.ps1
# ====================================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$OutputDir   = Join-Path $ProjectRoot 'deliverables'
# Staging project ke bahar (TEMP) -> master zip mein recursion ka chance nahi
$TempStaging = Join-Path ([System.IO.Path]::GetTempPath()) ("learnos-staging-" + [guid]::NewGuid().ToString('N'))

$ExcludeDirs  = @('node_modules', 'dist', '.git', 'temp_staging', 'deliverables')
$ExcludeFiles = @('.env', '.env.local', '.env.production', '.env.development', '*.log', '*.zip')

$Missing = New-Object System.Collections.Generic.List[string]
$Created = New-Object System.Collections.Generic.List[string]

function Get-Rel([string]$p) {
    if ($p.StartsWith($ProjectRoot)) { return $p.Substring($ProjectRoot.Length).TrimStart('\') }
    return $p
}

# Filtered copy: folders via robocopy (excludes apply at every level, node_modules kabhi copy hi nahi hota)
function Copy-Filtered {
    param([string]$Src, [string]$Dest)

    if (-not (Test-Path -LiteralPath $Src)) {
        $rel = Get-Rel $Src
        $Missing.Add($rel)
        Write-Warning "Missing: $rel"
        return
    }

    if (Test-Path -LiteralPath $Src -PathType Container) {
        New-Item -ItemType Directory -Force -Path $Dest | Out-Null
        $roboArgs = @($Src, $Dest, '/E', '/XD') + $ExcludeDirs + @('/XF') + $ExcludeFiles + @('/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1')
        & robocopy @roboArgs | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit $LASTEXITCODE): $Src" }
        $global:LASTEXITCODE = 0
    }
    else {
        $name = Split-Path $Src -Leaf
        foreach ($pat in $ExcludeFiles) { if ($name -like $pat) { return } }
        New-Item -ItemType Directory -Force -Path (Split-Path $Dest -Parent) | Out-Null
        Copy-Item -LiteralPath $Src -Destination $Dest -Force
    }
}

# .NET ZipFile: 2GB limit nahi, forward-slash entries, hidden/dot files bhi include
function New-ZipFromFolder {
    param([string]$ZipName, [string]$StageDir)

    $fileCount = @(Get-ChildItem -LiteralPath $StageDir -Recurse -File -Force -ErrorAction SilentlyContinue).Count
    if ($fileCount -eq 0) {
        Write-Warning "$ZipName.zip skip kiya: staging khaali hai"
        return
    }

    $TargetZip = Join-Path $OutputDir "$ZipName.zip"
    if (Test-Path -LiteralPath $TargetZip) { Remove-Item -LiteralPath $TargetZip -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($StageDir, $TargetZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

    # Verify: zip khol ke entries gino
    $zip = [System.IO.Compression.ZipFile]::OpenRead($TargetZip)
    try { $entries = $zip.Entries.Count } finally { $zip.Dispose() }

    $sizeKb = [math]::Round((Get-Item -LiteralPath $TargetZip).Length / 1KB)
    Write-Host "  [OK] $ZipName.zip ($sizeKb KB, $entries entries)"
    $Created.Add($ZipName)
}

function Create-AgentZip {
    param (
        [string]$ZipName,
        [string]$AgentFolder,
        [string[]]$IncludePaths
    )

    $Stage = Join-Path $TempStaging $ZipName
    New-Item -ItemType Directory -Force -Path $Stage | Out-Null

    Copy-Filtered (Join-Path $ProjectRoot "agents\$AgentFolder\README.md") (Join-Path $Stage 'README.md')
    Copy-Filtered (Join-Path $ProjectRoot 'README.md') (Join-Path $Stage 'PROJECT_README.md')

    foreach ($path in $IncludePaths) {
        Copy-Filtered (Join-Path $ProjectRoot $path) (Join-Path $Stage $path)
    }

    New-ZipFromFolder -ZipName $ZipName -StageDir $Stage
}

try {
    Write-Host "LearnOS Packaging Engine"
    Write-Host "Root: $ProjectRoot"

    if (Test-Path -LiteralPath $OutputDir) { Remove-Item -Recurse -Force -LiteralPath $OutputDir }
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    New-Item -ItemType Directory -Force -Path $TempStaging | Out-Null

    Write-Host "Packaging deliverables into $OutputDir ..."

    # 1. ATLAS
    Create-AgentZip -ZipName "ATLAS_LearnOS" -AgentFolder "ATLAS" -IncludePaths @(
        "client\src\components",
        "client\src\pages\Dashboard",
        "client\src\pages\AIAssistant",
        "client\src\pages\Analytics",
        "client\src\pages\ProfileSettings",
        "client\src\App.tsx",
        "client\src\main.tsx",
        "client\src\types",
        "client\src\services",
        "client\package.json",
        "client\tsconfig.json",
        "client\vite.config.ts",
        "client\tailwind.config.js"
    )

    # 2. NOVA
    Create-AgentZip -ZipName "NOVA_LearnOS" -AgentFolder "NOVA" -IncludePaths @(
        "client\src\pages\CollegeTutor",
        "client\src\pages\Notes",
        "client\src\pages\ExamCentre",
        "server\src\routes\tutor.ts",
        "server\src\routes\notes.ts",
        "server\src\routes\exams.ts",
        "server\src\types"
    )

    # 3. ORBIT
    Create-AgentZip -ZipName "ORBIT_LearnOS" -AgentFolder "ORBIT" -IncludePaths @(
        "client\src\pages\StudyPlanner",
        "server\src\routes\planner.ts",
        "server\src\types"
    )

    # 4. FORGE
    Create-AgentZip -ZipName "FORGE_LearnOS" -AgentFolder "FORGE" -IncludePaths @(
        "client\src\pages\CodingLab",
        "client\src\pages\SkillDevelopment",
        "server\src\routes\coding.ts",
        "server\src\routes\skills.ts",
        "server\src\services\codeExecutionService.ts",
        "server\src\types"
    )

    # 5. KERNEL
    Create-AgentZip -ZipName "KERNEL_LearnOS" -AgentFolder "KERNEL" -IncludePaths @(
        "server\src",
        "server\package.json",
        "server\tsconfig.json"
    )

    # 6. SENTINEL
    Create-AgentZip -ZipName "SENTINEL_LearnOS" -AgentFolder "SENTINEL" -IncludePaths @(
        "server\test",
        "server\src\routes\system.ts"
    )

    # 7. Master (poora project, excludes robocopy handle karta hai, purane root zips bhi skip)
    Write-Host "Building master archive ..."
    $StageMaster = Join-Path $TempStaging 'LearnOS_Complete_Project'
    Copy-Filtered $ProjectRoot $StageMaster
    New-ZipFromFolder -ZipName 'LearnOS_Complete_Project' -StageDir $StageMaster

    # Convenience: root mein bhi copy (master ban chuka hai, to ye usme nahi ghusenge)
    Get-ChildItem -LiteralPath $OutputDir -Filter '*.zip' | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProjectRoot $_.Name) -Force
    }

    # Final report (sach batata hai, blindly "success" nahi)
    Write-Host ""
    if ($Missing.Count -gt 0) {
        Write-Warning "$($Missing.Count) path(s) missing the:"
        $Missing | Sort-Object -Unique | ForEach-Object { Write-Host "   - $_" }
    }
    if ($Created.Count -eq 7) {
        Write-Host "Done: all 7 ZIP deliverables generated and verified."
    }
    else {
        Write-Warning "Sirf $($Created.Count)/7 ZIPs bane. Upar ke warnings check karo."
        $global:ExitCode = 1
    }
}
catch {
    Write-Error "Packaging fail: $($_.Exception.Message)"
    $global:ExitCode = 1
}
finally {
    if (Test-Path -LiteralPath $TempStaging) {
        Remove-Item -Recurse -Force -LiteralPath $TempStaging -ErrorAction SilentlyContinue
    }
}

if ($global:ExitCode) { exit $global:ExitCode }

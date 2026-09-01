# ========================================================
# St. Michael Medium Clinic HMS - Database Restore (PowerShell)
# ========================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$DbName = "st_michael_hms",
    [string]$DbUser = "stm_admin",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Error: Backup file '$BackupFile' was not found." -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  WARNING: Restoring will overwrite existing data in $DbName on $DbHost:$DbPort!" -ForegroundColor Yellow
$Confirmation = Read-Host "Are you sure you want to proceed with restore? (y/N)"
if ($Confirmation -ne "y" -and $Confirmation -ne "Y") {
    Write-Host "Restore operation aborted by user." -ForegroundColor Gray
    exit 0
}

Write-Host "🔄 Restoring database $DbName from $BackupFile..." -ForegroundColor Cyan
& pg_restore -h $DbHost -p $DbPort -U $DbUser -d $DbName -c -v $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database restore completed successfully." -ForegroundColor Green
}
else {
    Write-Host "❌ Restore encountered warnings or errors (Code: $LASTEXITCODE)." -ForegroundColor Yellow
}


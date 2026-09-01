# ========================================================
# St. Michael Medium Clinic HMS - Database Backup (PowerShell)
# ========================================================

param(
    [string]$BackupDir = "./backups",
    [string]$DbName = "st_michael_hms",
    [string]$DbUser = "stm_admin",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "stm_hms_backup_$Timestamp.dump"

Write-Host "📦 Starting St. Michael HMS Database Backup at $(Get-Date)..." -ForegroundColor Cyan
Write-Host "Target: $DbName on $DbHost:$DbPort (User: $DbUser)" -ForegroundColor Gray

& pg_dump -h $DbHost -p $DbPort -U $DbUser -F c -b -v -f $BackupFile $DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup completed successfully: $BackupFile" -ForegroundColor Green
    
    # Retention cleanup
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "stm_hms_backup_*.dump" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
    Write-Host "🧹 Pruned backups older than $RetentionDays days." -ForegroundColor Gray
}
else {
    Write-Host "❌ Database backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
}


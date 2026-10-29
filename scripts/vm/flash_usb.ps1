<#
.SYNOPSIS
  Directly flashes vm/prismos.img onto the target 16GB USB Drive (PhysicalDrive2).
#>

param(
    [int]$DiskNumber = 2,
    [string]$ImagePath = "$PSScriptRoot\..\..\vm\prismos.img"
)

# Self-elevate to Administrator if needed
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges to access raw physical sectors on Disk $DiskNumber..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$imageFullPath = [System.IO.Path]::GetFullPath($ImagePath)
if (-not (Test-Path $imageFullPath)) {
    Write-Host "ERROR: Image file not found: $imageFullPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$targetDisk = Get-Disk -Number $DiskNumber -ErrorAction Stop
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       PRISM-OS BAREMETAL LIVEUSB FLASH UTILITY          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Image File    : $imageFullPath"
Write-Host " Target Drive  : Disk $DiskNumber - $($targetDisk.FriendlyName)"
Write-Host " Target Size   : $([math]::Round($targetDisk.Size / 1GB, 2)) GB"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "WARNING: ALL DATA ON DISK $DiskNumber WILL BE OVERWRITTEN!" -ForegroundColor Red
Write-Host "Flashing will begin in 3 seconds... Press Ctrl+C to abort."
Start-Sleep -Seconds 3

Write-Host "[1/3] Preparing raw disk access..." -ForegroundColor Cyan

# Remove drive letters so Windows volume locking doesn't block raw writes
Get-Partition -DiskNumber $DiskNumber -ErrorAction SilentlyContinue | Remove-PartitionAccessPath -Accesspath "D:\" -ErrorAction SilentlyContinue

$sourceStream = [System.IO.File]::OpenRead($imageFullPath)
$targetPath = "\\.\PhysicalDrive$DiskNumber"

try {
    # Open target physical drive
    $targetStream = [System.IO.File]::Open($targetPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::ReadWrite)
    
    $buffer = New-Object byte[] (4 * 1024 * 1024) # 4MB chunks
    $totalBytes = $sourceStream.Length
    $writtenBytes = 0
    $startTime = [System.Diagnostics.Stopwatch]::StartNew()

    Write-Host "[2/3] Streaming 3.0 GB raw image directly to physical sectors..." -ForegroundColor Green

    while (($read = $sourceStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
        $targetStream.Write($buffer, 0, $read)
        $writtenBytes += $read
        $pct = [math]::Round(($writtenBytes / $totalBytes) * 100, 1)
        $mb = [math]::Round($writtenBytes / 1MB, 1)
        $speed = [math]::Round(($writtenBytes / 1MB) / [math]::Max(0.1, $startTime.Elapsed.TotalSeconds), 1)
        Write-Progress -Activity "Flashing PrismOS LiveUSB" -Status "$pct% ($mb MB / 3072 MB at $speed MB/s)" -PercentComplete $pct
    }

    $targetStream.Flush()
    $targetStream.Close()
    $sourceStream.Close()
    $startTime.Stop()

    Write-Host "[3/3] Flushing disk caches..." -ForegroundColor Cyan
    Update-HostStorageCache

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "   SUCCESS: PRISM-OS IS NOW FLASHED TO YOUR USB DRIVE!   " -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " Turn off your PC, insert the USB drive, and boot via F11 / F12."
    Write-Host " The system will launch directly into the 60 FPS 3D Diegetic Desktop."
    Write-Host ""
} catch {
    Write-Host "Flash error: $_" -ForegroundColor Red
} finally {
    $sourceStream.Close()
}

Read-Host "Press Enter to exit"

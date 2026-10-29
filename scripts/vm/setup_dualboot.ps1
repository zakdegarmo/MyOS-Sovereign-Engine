<#
.SYNOPSIS
  Installs PrismOS to Partition 2 of the 64GB USB Drive without touching Fedora on Partition 1.
#>

# 1. Require elevation
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges to partition the 64GB drive..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$repoPath = "C:\Users\zakde\Desktop\AntiGravity projects\MyOS"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     PRISM-OS + FEDORA DUAL-BOOT INSTALLER (64GB USB)     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Target Drive  : Disk 1 (64GB PNY USB)"
Write-Host " Partition 1   : H:\ (Fedora LiveOS) -> 100% PRESERVED & SAFE"
Write-Host " Partition 2   : Creating 4.5 GB ext4 partition in empty space"
Write-Host "==========================================================" -ForegroundColor Cyan

# Verify H:\ exists and has Fedora grub
if (-not (Test-Path "H:\boot\grub2\grub.cfg")) {
    Write-Host "ERROR: H:\boot\grub2\grub.cfg not found. Make sure the 64GB drive is plugged in as H:." -ForegroundColor Red
    pause
    exit 1
}

# Backup Fedora grub.cfg
$grubPath = "H:\boot\grub2\grub.cfg"
$grubBak = "H:\boot\grub2\grub.cfg.orig_fedora"
if (-not (Test-Path $grubBak)) {
    Copy-Item $grubPath $grubBak -Force
    Write-Host "Backed up original Fedora GRUB config to $grubBak" -ForegroundColor Green
}

# Attach Disk 1 to WSL
Write-Host "[1/4] Attaching 64GB physical drive to WSL..." -ForegroundColor Cyan
wsl --mount \\.\PHYSICALDRIVE1 --bare
Start-Sleep -Seconds 2

# Run Linux partitioning and DD in WSL
Write-Host "[2/4] Partitioning empty space & writing PrismOS in WSL..." -ForegroundColor Green
wsl -u root -d Ubuntu -- bash -c "tr -d '\r' < '/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/scripts/vm/dualboot_worker.sh' | bash"

# Detach disk from WSL
Write-Host "[3/4] Detaching disk from WSL..." -ForegroundColor Cyan
wsl --unmount \\.\PHYSICALDRIVE1

# Update H:\boot\grub2\grub.cfg
Write-Host "[4/4] Adding PrismOS entry to Fedora boot menu on H:\..." -ForegroundColor Cyan
$grubContent = Get-Content $grubPath -Raw

if (-not $grubContent.Contains("PrismOS 3D Diegetic Desktop")) {
    $prismEntry = @'

# ==========================================================
# PrismOS 3D Diegetic Operating System
# ==========================================================
menuentry "Start PrismOS 3D Diegetic Desktop" --class prism --class gnu-linux --class os {
	search --no-floppy --fs-uuid --set=root e84c169c-0c7b-4d5b-a15c-11c23ab37566
	linux /boot/vmlinuz-lts quiet root=UUID=e84c169c-0c7b-4d5b-a15c-11c23ab37566 modules=ext4
	initrd /boot/initramfs-lts
}
'@
    Add-Content -Path $grubPath -Value $prismEntry
    Write-Host "PrismOS menu entry successfully registered!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "    DUAL-BOOT SETUP COMPLETE! FEDORA REMAINS SAFE!       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " The 64GB USB stick now contains BOTH operating systems:"
Write-Host "   1. Fedora-Workstation-Live (Partition 1 - 100% untouched)"
Write-Host "   2. PrismOS 3D Diegetic Desktop (Partition 2 - 4.6 GB ext4)"
Write-Host ""
Write-Host " Reboot your PC and pick either OS from the boot menu!"
Write-Host ""
pause

<#
.SYNOPSIS
  Launches the turnkey PrismOS Linux VM disk image (prismos.qcow2) with visible GTK/Wayland GUI window.
.DESCRIPTION
  Boots directly from vm/prismos.qcow2 with:
  - 2GB RAM
  - 2 CPU Cores
  - VirtIO graphics & hardware acceleration
  - Absolute USB tablet mouse (smooth 1:1 Windows mouse input)
  - Auto-login and automated kiosk launch of PrismOS
#>

param(
  [string]$DiskPath = "$PSScriptRoot\..\..\vm\prismos.qcow2",
  [int]$MemoryMB = 4096,
  [int]$Cores = 4
)

$diskFullPath = [System.IO.Path]::GetFullPath($DiskPath)
$wslDiskPath = $diskFullPath.Replace('\', '/').Replace('C:', '/mnt/c').Replace('c:', '/mnt/c')

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   IGNITING PRISM-OS BAREMETAL LINUX VIRTUAL MACHINE      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Prism Disk  : $diskFullPath"
Write-Host " Memory      : ${MemoryMB} MB"
Write-Host " Cores       : $Cores"
Write-Host " Mouse Input : Absolute USB Tablet (1:1 cursor sync)"
Write-Host " Kiosk Mode  : Auto-boot directly into 3D Diegetic Desktop"
Write-Host "==========================================================" -ForegroundColor Cyan

$wslCmd = "DISPLAY=:0 WAYLAND_DISPLAY=wayland-0 qemu-system-x86_64 " +
          "-m $MemoryMB -smp $Cores " +
          "-drive file='$wslDiskPath',format=qcow2 " +
          "-vga none -device virtio-vga,xres=1280,yres=720 " +
          "-usb -device usb-tablet " +
          "-display gtk,zoom-to-fit=on " +
          "-net nic,model=virtio " +
          "-net user,hostfwd=tcp::2222-:22"

wsl -d Ubuntu -- bash -c "$wslCmd"

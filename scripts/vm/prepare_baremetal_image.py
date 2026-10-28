#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
import time

def log(msg):
    print(f"[BAREMETAL-BUILD] {msg}")
    sys.stdout.flush()

MOUNT_DIR = "/tmp/prismos_root"
REPO_DIR = "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS"
QCOW_PATH = os.path.join(REPO_DIR, "vm/prismos.qcow2")

def main():
    log("Step 1: Mounting prismos.qcow2 via qemu-nbd...")
    os.makedirs(MOUNT_DIR, exist_ok=True)
    subprocess.run(["modprobe", "nbd"], check=True)
    subprocess.run(["qemu-nbd", "-d", "/dev/nbd0"], stderr=subprocess.DEVNULL)
    time.sleep(1)
    subprocess.run(["qemu-nbd", "-c", "/dev/nbd0", QCOW_PATH], check=True)
    time.sleep(1)
    subprocess.run(["mount", "/dev/nbd0", MOUNT_DIR], check=True)

    try:
        log("Step 2: Injecting standalone 3D engine dist & filesystem bridge...")
        opt_dir = os.path.join(MOUNT_DIR, "opt/prism-os")
        os.makedirs(opt_dir, exist_ok=True)
        
        # Copy dist bundle
        dist_src = os.path.join(REPO_DIR, "apps/prism-os/dist")
        dist_dst = os.path.join(opt_dir, "dist")
        if os.path.exists(dist_dst):
            shutil.rmtree(dist_dst)
        shutil.copytree(dist_src, dist_dst)
        
        # Copy server script
        server_dst_dir = os.path.join(opt_dir, "server")
        os.makedirs(server_dst_dir, exist_ok=True)
        shutil.copy2(os.path.join(REPO_DIR, "apps/prism-os/server/linux_fs_bridge.py"),
                     os.path.join(server_dst_dir, "linux_fs_bridge.py"))
        os.chmod(os.path.join(server_dst_dir, "linux_fs_bridge.py"), 0o755)

        log("Step 3: Updating /root/.xinitrc for turnkey standalone bare-metal launch...")
        xinit_content = """#!/bin/sh
xset -dpms
xset s off
xset s noblank

# Ensure audio and input permissions
chmod 666 /dev/dri/* 2>/dev/null || true

# Start local PrismOS Python Server (Frontend UI + POSIX Kernel Bridge)
PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 /opt/prism-os/server/linux_fs_bridge.py &
sleep 1

# First run bypass
mkdir -p /root/.config/chromium
touch "/root/.config/chromium/First Run"

# Launch Chromium in dedicated Kiosk Mode with physical GPU acceleration
exec /usr/bin/chromium-browser \\
  --no-sandbox \\
  --test-type \\
  --kiosk \\
  --start-maximized \\
  --start-fullscreen \\
  --ignore-gpu-blocklist \\
  --enable-webgl \\
  --enable-webgl2 \\
  --enable-gpu-rasterization \\
  --enable-zero-copy \\
  --no-first-run \\
  --disable-fre \\
  --no-default-browser-check \\
  --password-store=basic \\
  --disable-dev-shm-usage \\
  --disable-features=Translate \\
  --disable-infobars \\
  --noerrdialogs \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  http://localhost:3333
"""
        with open(os.path.join(MOUNT_DIR, "root/.xinitrc"), "w") as f:
            f.write(xinit_content)
        os.chmod(os.path.join(MOUNT_DIR, "root/.xinitrc"), 0o755)

        log("Step 4: Installing physical hardware kernel (linux-lts) with apk.static...")
        shutil.copy2("/etc/resolv.conf", os.path.join(MOUNT_DIR, "etc/resolv.conf"))
        
        # Install linux-lts for bare-metal USB, xHCI, SATA, NVMe, and GPU support
        apk_cmd = [
            "/tmp/apk.static", "--root", MOUNT_DIR, "add", "--no-cache",
            "linux-lts", "mesa-dri-gallium", "xf86-video-modesetting", "udev", "dbus", "e2fsprogs", "syslinux"
        ]
        res = subprocess.run(apk_cmd, capture_output=True, text=True)
        log(f"apk.static install result: {res.returncode}")
        if res.stdout:
            print(res.stdout[-500:])
        if res.stderr:
            print(res.stderr[-500:])

        # Run update-extlinux inside guest chroot
        log("Updating extlinux boot menu...")
        subprocess.run(["chroot", MOUNT_DIR, "update-extlinux"], check=True)

        log("Step 5: Verifying bootloader configuration...")
        extlinux_path = os.path.join(MOUNT_DIR, "boot/extlinux.conf")
        if os.path.exists(extlinux_path):
            with open(extlinux_path) as f:
                print(f.read())

    finally:
        log("Syncing and unmounting...")
        subprocess.run(["sync"])
        subprocess.run(["umount", MOUNT_DIR])
        subprocess.run(["qemu-nbd", "-d", "/dev/nbd0"])
        log("Disk image prepared and unmounted cleanly.")

if __name__ == "__main__":
    main()

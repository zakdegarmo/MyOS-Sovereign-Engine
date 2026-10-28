#!/usr/bin/env bash
# ==============================================================================
# MyOS Sovereign Live ISO Builder
# Generates a bootable hybrid USB/ISO image with Cage Wayland + Chromium Kiosk.
# ==============================================================================

set -euo pipefail

ISO_NAME="myos-sovereign-live-$(date +%Y%m%d).iso"
BUILD_DIR="/tmp/myos-iso-build"

echo "=============================================================================="
echo " Building MyOS Sovereign Live ISO Image: ${ISO_NAME}"
echo "=============================================================================="

# 1. Check prerequisites
for cmd in lb debootstrap xorriso mksquashfs rsync; do
    if ! command -v "$cmd" > /dev/null 2>&1; then
        echo "[-] Missing build tool: $cmd. Install with: sudo apt-get install live-build debootstrap xorriso squashfs-tools"
        exit 1
    fi
done

# 2. Build Web Production Bundle if needed
echo "[+] Step 1/5: Verifying MyOS Web Production Bundle (dist/)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYOS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ ! -d "$MYOS_ROOT/apps/web/dist" ]; then
    echo "[*] Building apps/web production bundle..."
    cd "$MYOS_ROOT/apps/web"
    npm run build
fi

# 3. Initialize Live Build Environment
echo "[+] Step 2/5: Initializing live-build configuration..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

lb config \
    --mode debian \
    --distribution bookworm \
    --architectures amd64 \
    --archive-areas "main contrib non-free non-free-firmware" \
    --linux-flavours amd64 \
    --bootloader grub-efi \
    --system live \
    --memtest none \
    --win32-loader false

# 4. Define Package Inclusions for Kiosk & GPU Acceleration
echo "[+] Step 3/5: Configuring package manifests..."
mkdir -p config/package-lists
cat << EOF > config/package-lists/myos.list.chroot
# Base & Hardware Drivers
linux-image-amd64
firmware-linux
firmware-misc-non-free
mesa-vulkan-drivers
mesa-va-drivers
libgl1-mesa-dri
libglx-mesa0
xwayland
cage
chromium
curl
rsync
parted
dosfstools
e2fsprogs
pciutils
usbutils
alsa-utils
pipewire
pipewire-alsa
wireplumber
ca-certificates
sudo

# Runtimes for Sovereign Engine
nodejs
npm
EOF

# 5. Populate Chroot Overlay (Services, Kiosk, MyOS Dist Assets)
echo "[+] Step 4/5: Overlaying MyOS system services and assets..."
mkdir -p config/includes.chroot/etc/systemd/system
mkdir -p config/includes.chroot/usr/local/bin
mkdir -p config/includes.chroot/opt/myos/web
mkdir -p config/includes.chroot/home/myos/.config

# Copy Kiosk & Bridge Scripts
cp "$SCRIPT_DIR/myos-kiosk-session.sh" config/includes.chroot/usr/local/bin/
cp "$SCRIPT_DIR/myos-bridge-service.js" config/includes.chroot/usr/local/bin/
cp "$SCRIPT_DIR/myos-install.sh" config/includes.chroot/usr/local/bin/myos-install
chmod +x config/includes.chroot/usr/local/bin/*

# Copy Built Web Assets
cp -r "$MYOS_ROOT/apps/web/dist"/* config/includes.chroot/opt/myos/web/

# Systemd Kiosk Service
cat << "EOF" > config/includes.chroot/etc/systemd/system/myos-kiosk.service
[Unit]
Description=MyOS Sovereign Wayland Kiosk
After=network.target sound.target myos-bridge.service

[Service]
User=myos
Environment=XDG_RUNTIME_DIR=/run/user/1000
ExecStart=/usr/bin/cage -s -- /usr/local/bin/myos-kiosk-session.sh
Restart=always
RestartSec=2

[Install]
WantedBy=graphical.target
EOF

# Systemd Bridge Daemon Service
cat << "EOF" > config/includes.chroot/etc/systemd/system/myos-bridge.service
[Unit]
Description=MyOS Host Filesystem Bridge Daemon
After=network.target

[Service]
User=myos
WorkingDirectory=/home/myos
ExecStart=/usr/bin/node /usr/local/bin/myos-bridge-service.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Autologin Configuration
mkdir -p config/includes.chroot/etc/systemd/system/getty@tty1.service.d
cat << "EOF" > config/includes.chroot/etc/systemd/system/getty@tty1.service.d/override.conf
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin myos --noclear %I $TERM
EOF

# Hook: Create 'myos' User with sudo rights
mkdir -p config/hooks/live
cat << "EOF" > config/hooks/live/01-create-myos-user.hook.chroot
#!/bin/bash
useradd -m -s /bin/bash -G sudo,video,audio,render,input myos
echo "myos:sovereign" | chpasswd
echo "myos ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
mkdir -p /home/myos/{Documents,Projects,Media,Downloads}
chown -R myos:myos /home/myos
systemctl enable myos-kiosk.service
systemctl enable myos-bridge.service
EOF
chmod +x config/hooks/live/01-create-myos-user.hook.chroot

# 6. Execute ISO Build
echo "[+] Step 5/5: Compiling bootable ISO image (this may take several minutes)..."
lb build

# Move generated ISO back to scripts/distro
if [ -f "live-image-amd64.hybrid.iso" ]; then
    mv "live-image-amd64.hybrid.iso" "$MYOS_ROOT/scripts/distro/$ISO_NAME"
    echo ""
    echo "=============================================================================="
    echo " [SUCCESS] Created MyOS Bootable ISO:"
    echo " $MYOS_ROOT/scripts/distro/$ISO_NAME"
    echo ""
    echo " Flash to USB using:"
    echo " sudo dd if=$MYOS_ROOT/scripts/distro/$ISO_NAME of=/dev/sdX bs=4M status=progress oflag=sync"
    echo "=============================================================================="
fi

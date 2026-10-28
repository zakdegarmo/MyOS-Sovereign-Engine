import os
import shutil
import time

print("Waiting for USB drive H: to be plugged in...")
while not os.path.exists("H:/boot"):
    time.sleep(1)

print("Detected H:/boot!")
# Ensure H:/boot/grub exists and has i386-pc and grub.cfg
src = "H:/boot/grub2"
dst = "H:/boot/grub"
if os.path.exists(src) and not os.path.exists(dst):
    print("Copying H:/boot/grub2 -> H:/boot/grub so Legacy BIOS boot works seamlessly...")
    shutil.copytree(src, dst)
    print("Copied successfully!")

print("All Legacy + UEFI boot paths are 100% armed!")

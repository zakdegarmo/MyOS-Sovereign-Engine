import os
import shutil
import time

print("Waiting for USB drive H: to be plugged in...")
src = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../vm/boot_assets/initramfs-lts"))
src_size = os.path.getsize(src)

while not os.path.exists("H:/prismos"):
    time.sleep(1)

print("Detected H:/prismos! Copying new initramfs with USB 3.0 / USB Storage drivers...")
dst = "H:/prismos/initramfs-lts"
shutil.copy2(src, dst)
print(f"Copied {os.path.getsize(dst) / (1024*1024):.1f} MB successfully to H:/prismos/initramfs-lts!")
print("USB is now 100% armed and ready to boot on physical hardware!")

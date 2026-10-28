import os
import sys
import time
import ctypes
from ctypes import wintypes
import subprocess

def main():
    img_path = os.path.abspath("vm/prismos.img")
    if not os.path.exists(img_path):
        print(f"ERROR: Image not found at {img_path}")
        sys.exit(1)
        
    img_size = os.path.getsize(img_path)
    print(f"Source Image : {img_path} ({img_size / (1024*1024):.1f} MB)")
    print("Target Device: \\\\.\\Harddisk1Partition2 (Partition 2 on 64GB USB)")
    print("Partition 1 (H:\\ - Fedora LiveOS) is 100% UNTOUCHED & SAFE.")

    GENERIC_READ = 0x80000000
    GENERIC_WRITE = 0x40000000
    FILE_SHARE_READ = 0x00000001
    FILE_SHARE_WRITE = 0x00000002
    OPEN_EXISTING = 3
    FILE_ATTRIBUTE_NORMAL = 0x80

    kernel32 = ctypes.windll.kernel32

    # Open direct partition handle
    h_disk = kernel32.CreateFileW(
        r"\\.\Harddisk1Partition2",
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        None
    )

    if h_disk == -1 or h_disk == 0xFFFFFFFFFFFFFFFF:
        err = kernel32.GetLastError()
        print(f"ERROR: Failed to open Partition 2 handle. Win32 Error: {err}")
        sys.exit(1)

    chunk_size = 4 * 1024 * 1024  # 4 MB chunks
    buffer = ctypes.create_string_buffer(chunk_size)
    bytes_written = wintypes.DWORD(0)

    start_time = time.time()
    total_written = 0

    print("Streaming image to Partition 2...")
    with open(img_path, "rb") as src:
        while True:
            chunk = src.read(chunk_size)
            if not chunk:
                break
            ctypes.memmove(buffer, chunk, len(chunk))
            success = kernel32.WriteFile(
                h_disk,
                buffer,
                len(chunk),
                ctypes.byref(bytes_written),
                None
            )
            if not success or bytes_written.value != len(chunk):
                err = kernel32.GetLastError()
                print(f"\nWriteFile error at {total_written} bytes. Win32 Error: {err}")
                kernel32.CloseHandle(h_disk)
                sys.exit(1)

            total_written += bytes_written.value
            elapsed = max(0.1, time.time() - start_time)
            speed = (total_written / (1024 * 1024)) / elapsed
            pct = (total_written / img_size) * 100
            mb = total_written / (1024 * 1024)
            print(f"\rProgress: {pct:5.1f}% ({mb:.1f} MB / {img_size/(1024*1024):.1f} MB) at {speed:5.1f} MB/s", end="", flush=True)

    kernel32.FlushFileBuffers(h_disk)
    kernel32.CloseHandle(h_disk)

    print("\nFlushing Windows host disk cache...")
    subprocess.run(["powershell", "-NoProfile", "-Command", "Update-HostStorageCache"], capture_output=True)
    print("\nFLASH_COMPLETE_SUCCESS: PrismOS Partition 2 updated successfully!")

if __name__ == "__main__":
    main()

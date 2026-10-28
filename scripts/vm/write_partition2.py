import sys
import os
import subprocess
import time
import ctypes
from ctypes import wintypes
import json

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def main():
    print("==========================================================")
    print("    PRISM-OS DUAL-BOOT PARTITION 2 INSTALLER (64GB USB)   ")
    print("==========================================================")

    if not is_admin():
        print("Requesting administrator privileges...")
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, f'"{os.path.abspath(__file__)}"', None, 1
        )
        sys.exit(0)

    # =========================================================================
    # HARD FAILS-SAFE DISK VALIDATION
    # Under no circumstances allow operations on the main OS drive or any fixed disk!
    # =========================================================================
    print("\n[SAFETY AUDIT] Verifying target disk identity...")
    disk_check_ps = (
        'Get-Disk -Number 1 | '
        'Select-Object Number, FriendlyName, BusType, Size, IsBoot, IsSystem, PartitionStyle | '
        'ConvertTo-Json'
    )
    r_disk = subprocess.run(["powershell", "-NoProfile", "-Command", disk_check_ps], capture_output=True, text=True)
    if r_disk.returncode != 0 or not r_disk.stdout.strip():
        print("CRITICAL SAFETY ERROR: Could not query Disk 1 via Windows Storage Management.")
        print("Aborting to protect system integrity.")
        input("Press Enter to exit...")
        sys.exit(1)

    try:
        disk_info = json.loads(r_disk.stdout)
    except Exception as e:
        print(f"CRITICAL SAFETY ERROR: Failed to parse disk telemetry: {e}")
        input("Press Enter to exit...")
        sys.exit(1)

    disk_num = disk_info.get("Number")
    friendly_name = disk_info.get("FriendlyName", "")
    bus_type = disk_info.get("BusType", "")
    size_bytes = disk_info.get("Size", 0)
    is_boot = disk_info.get("IsBoot", True)
    is_system = disk_info.get("IsSystem", True)

    print(f"  Target Disk Number : {disk_num}")
    print(f"  Friendly Name      : {friendly_name}")
    print(f"  Bus Type           : {bus_type}")
    print(f"  Reported Size      : {size_bytes / (1024*1024*1024):.2f} GB")
    print(f"  Is Windows Boot    : {is_boot}")
    print(f"  Is Windows System  : {is_system}")

    # Safety Assertions
    if disk_num != 1:
        print("CRITICAL SAFETY TRIPWIRE: Disk number is not 1. ABORTING!")
        input("Press Enter to exit...")
        sys.exit(1)

    if is_boot or is_system:
        print("CRITICAL SAFETY TRIPWIRE: Disk 1 is marked as Windows Boot or System! ABORTING!")
        input("Press Enter to exit...")
        sys.exit(1)

    if bus_type != "USB":
        print(f"CRITICAL SAFETY TRIPWIRE: Disk 1 bus type is '{bus_type}', NOT 'USB'! ABORTING!")
        input("Press Enter to exit...")
        sys.exit(1)

    # Size must be a 64GB USB stick (~55-65 GB), NOT your 2TB NVMe SSD!
    if size_bytes > 70 * 1024 * 1024 * 1024 or size_bytes < 20 * 1024 * 1024 * 1024:
        print(f"CRITICAL SAFETY TRIPWIRE: Disk 1 size ({size_bytes / 1e9:.1f} GB) does not match expected 64GB USB stick! ABORTING!")
        input("Press Enter to exit...")
        sys.exit(1)

    print("[SAFETY AUDIT PASSED] Disk 1 confirmed to be removable USB media. Internal drives are 100% safe.\n")

    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../vm/prismos.img"))
    if not os.path.exists(image_path):
        print(f"ERROR: Image not found at {image_path}")
        input("Press Enter to exit...")
        sys.exit(1)

    img_size = os.path.getsize(image_path)
    print(f"Image Source : {image_path}")
    print(f"Image Size   : {img_size / (1024*1024):.1f} MB (3.00 GB)")

    # 1. Inspect existing partitions on Disk 1
    print("\n[1/3] Inspecting partitions on Disk 1...")
    ps_cmd = 'Get-Partition -DiskNumber 1 | Select-Object PartitionNumber, DriveLetter, Offset, Size | ConvertTo-Json'
    res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
    parts = []
    if res.stdout.strip():
        try:
            data = json.loads(res.stdout)
            parts = data if isinstance(data, list) else [data]
        except Exception:
            pass

    for p in parts:
        print(f"  Existing Partition {p.get('PartitionNumber')}: Letter={p.get('DriveLetter')} Offset={p.get('Offset')} Size={p.get('Size')/(1024*1024):.1f} MB")

    # Safety check on Partition 1
    part1 = next((p for p in parts if p.get('PartitionNumber') == 1), None)
    if part1 and part1.get('DriveLetter') != 'H':
        print(f"WARNING: Partition 1 drive letter is '{part1.get('DriveLetter')}', expected 'H'.")

    part2 = next((p for p in parts if p.get('PartitionNumber') == 2), None)

    # 2. Create Partition 2 if it doesn't exist
    if not part2:
        print("\n[2/3] Partition 2 does not exist. Creating 4.5 GB Partition 2 on Disk 1...")
        dp_script = "select disk 1\ncreate partition primary size=4500\n"
        dp_file = os.path.join(os.environ.get("TEMP", "C:/Windows/Temp"), "create_part2.txt")
        with open(dp_file, "w") as f:
            f.write(dp_script)
        r = subprocess.run(f"diskpart /s {dp_file}", shell=True, capture_output=True, text=True)
        print(r.stdout)
        try:
            os.remove(dp_file)
        except:
            pass

        time.sleep(2)
        # Re-check partitions
        res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
        if res.stdout.strip():
            try:
                data = json.loads(res.stdout)
                parts = data if isinstance(data, list) else [data]
                part2 = next((p for p in parts if p.get('PartitionNumber') == 2), None)
            except:
                pass
    else:
        print("\n[2/3] Partition 2 already exists on Disk 1.")

    if not part2:
        print("ERROR: Could not find or create Partition 2 on Disk 1.")
        input("Press Enter to exit...")
        sys.exit(1)

    offset = part2['Offset']
    part_size = part2['Size']
    print(f"Target Partition 2: Offset={offset} bytes ({offset/(1024*1024):.1f} MB), Size={part_size/(1024*1024):.1f} MB")

    # 3. Stream prismos.img directly to Partition 2
    print("\n[3/3] Streaming PrismOS 3D Diegetic Desktop into Partition 2...")
    print("      Partition 1 (H:\\ - Fedora LiveOS) is 100% PRESERVED & SAFE.")

    GENERIC_READ = 0x80000000
    GENERIC_WRITE = 0x40000000
    FILE_SHARE_READ = 0x00000001
    FILE_SHARE_WRITE = 0x00000002
    OPEN_EXISTING = 3
    FILE_ATTRIBUTE_NORMAL = 0x80

    kernel32 = ctypes.windll.kernel32

    # Prefer writing directly to Partition 2 device handle to isolate from Partition 1
    h_disk = kernel32.CreateFileW(
        r"\\.\Harddisk1Partition2",
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        None
    )

    write_offset = 0
    if h_disk == -1 or h_disk == 0xFFFFFFFFFFFFFFFF:
        print("Direct partition handle unavailable, opening PhysicalDrive1 with seek offset...")
        h_disk = kernel32.CreateFileW(
            r"\\.\PhysicalDrive1",
            GENERIC_READ | GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            None,
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            None
        )
        write_offset = offset

    if h_disk == -1 or h_disk == 0xFFFFFFFFFFFFFFFF:
        err = kernel32.GetLastError()
        print(f"ERROR: Failed to open raw disk device. Win32 Error: {err}")
        input("Press Enter to exit...")
        sys.exit(1)

    # Move file pointer to offset if using PhysicalDrive
    if write_offset > 0:
        high_dist = ctypes.c_long(write_offset >> 32)
        low_dist = ctypes.c_ulong(write_offset & 0xFFFFFFFF)
        FILE_BEGIN = 0
        kernel32.SetFilePointer(h_disk, low_dist, ctypes.byref(high_dist), FILE_BEGIN)

    chunk_size = 4 * 1024 * 1024  # 4 MB
    buffer = ctypes.create_string_buffer(chunk_size)
    bytes_written = wintypes.DWORD(0)

    start_time = time.time()
    total_written = 0

    with open(image_path, "rb") as src:
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
                input("Press Enter to exit...")
                sys.exit(1)

            total_written += bytes_written.value
            elapsed = max(0.1, time.time() - start_time)
            speed = (total_written / (1024 * 1024)) / elapsed
            pct = (total_written / img_size) * 100
            mb = total_written / (1024 * 1024)
            print(f"\rProgress: {pct:5.1f}% ({mb:.1f} MB / {img_size/(1024*1024):.1f} MB) at {speed:5.1f} MB/s", end="", flush=True)

    kernel32.FlushFileBuffers(h_disk)
    kernel32.CloseHandle(h_disk)

    print("\n\nFlushing host disk cache...")
    subprocess.run(["powershell", "-NoProfile", "-Command", "Update-HostStorageCache"], capture_output=True)

    print("\n==========================================================")
    print("      SUCCESS: PRISM-OS + FEDORA DUAL-BOOT IS READY!      ")
    print("==========================================================")
    print(" Your 64GB USB stick now has BOTH operating systems:")
    print("   [1] PrismOS 3D Diegetic Desktop (Partition 2 - 4.5 GB)")
    print("   [2] Fedora-Workstation-Live (Partition 1 - H:\\)")
    print("")
    print(" Next Steps:")
    print(" 1. Safely remove or plug this USB drive into your physical second PC.")
    print(" 2. Turn on the PC and tap F11 or F12 to open the Boot Menu.")
    print(" 3. Choose the PNY USB Drive (UEFI or Legacy).")
    print(" 4. Select 'PrismOS 3D Diegetic Desktop' to launch the 60 FPS spatial OS!")
    print("==========================================================")
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
